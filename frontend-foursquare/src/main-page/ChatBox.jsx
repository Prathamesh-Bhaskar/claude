// src/main-page/ChatBox.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { tripApi } from "../api/horizonApi";
import { processTripResponse } from "../utils/TripProcessor";
import { Mic, Send, StopCircle } from "lucide-react";

const ChatBox = forwardRef(({ onPlanGenerated, tripContext = null }, ref) => {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi there! I am your AI travel assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    sendMessage: (message) => {
      handleSendMessage(message);
    }
  }));

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setListening(false);
      };

      recognitionRef.current.onend = () => setListening(false);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle voice listening
  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  // Handle sending a message
  const handleSend = () => {
    if (!input.trim()) return;
    handleSendMessage(input);
  };

  // Function to handle sending a message (can be called externally)
  const handleSendMessage = async (message) => {
    // Add user message to chat
    const userMessage = { type: "user", text: message };
    setMessages(prev => [...prev, userMessage]);
    
    // Update conversation history for context
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: message }
    ];
    setConversationHistory(updatedHistory);
    
    // Clear input and show loading state
    setInput("");
    setIsLoading(true);

    try {
      // Call the backend API
      const response = await tripApi.sendChatMessage(message, conversationHistory, tripContext ? { trip_context: tripContext } : null);
      
      console.log("Chat API response:", response);
      
      // Add AI response to chat
      const botMessage = { type: "bot", text: response.response };
      setMessages(prev => [...prev, botMessage]);
      
      // Update conversation history with AI response
      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: response.response }
      ]);
      
      // Process the response to extract a trip plan
      if (response.actionable && response.action_type === "planning") {
        console.log("Planning action detected, processing response");
        
        // Process the text response to extract locations and create a trip plan
        const processedPlan = processTripResponse(response.response);
        
        // Notify parent component about the new trip plan
        onPlanGenerated && onPlanGenerated(processedPlan);
      } else {
        // Even if not marked as actionable, check for trip planning content
        const hasItinerary = 
          response.response.includes("itinerary") || 
          response.response.includes("Day 1") || 
          (response.response.includes("day") && response.response.includes("trip"));
        
        if (hasItinerary) {
          console.log("Detected potential itinerary in response, processing");
          const processedPlan = processTripResponse(response.response);
          onPlanGenerated && onPlanGenerated(processedPlan);
        }
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      // Handle errors
      setMessages(prev => [
        ...prev, 
        { type: "bot", text: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract potential trip preferences from the user's message
  const extractPreferences = (message) => {
    // Simple preference extraction
    const preferences = {
      duration: extractDuration(message) || 3,
      budget: extractBudget(message) || "medium",
      interests: extractInterests(message) || ["sightseeing"]
    };
    
    return preferences;
  };

  // Extract duration from message
  const extractDuration = (message) => {
    const durationMatch = message.match(/(\d+)[ -]day|for (\d+) days/i);
    return durationMatch ? parseInt(durationMatch[1] || durationMatch[2]) : null;
  };

  // Extract budget from message
  const extractBudget = (message) => {
    const message_lower = message.toLowerCase();
    if (message_lower.includes("luxury") || message_lower.includes("high-end") || message_lower.includes("expensive")) {
      return "luxury";
    } else if (message_lower.includes("budget") || message_lower.includes("cheap") || message_lower.includes("inexpensive")) {
      return "budget";
    }
    return "medium";
  };

  // Extract interests from message
  const extractInterests = (message) => {
    const interests = [];
    const message_lower = message.toLowerCase();
    
    const interestKeywords = {
      "beach": ["beach", "beaches", "coastal", "seaside"],
      "food": ["food", "culinary", "cuisine", "restaurant", "eat"],
      "culture": ["culture", "art", "museum", "history", "historical"],
      "adventure": ["adventure", "hiking", "trekking", "outdoor", "sport"],
      "shopping": ["shopping", "market", "mall", "shop"],
      "nature": ["nature", "wildlife", "park", "mountain", "forest"],
      "nightlife": ["nightlife", "party", "club", "bar", "pub"]
    };
    
    Object.entries(interestKeywords).forEach(([interest, keywords]) => {
      if (keywords.some(keyword => message_lower.includes(keyword))) {
        interests.push(interest);
      }
    });
    
    return interests.length > 0 ? interests : ["sightseeing"];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
        <h2 className="font-bold">Travel Assistant</h2>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === "user"
                  ? "bg-indigo-100 text-gray-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef}></div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full focus:outline-none transition-colors ${
              listening ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {listening ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={listening}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full focus:outline-none ${
              !input.trim() || isLoading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatBox;