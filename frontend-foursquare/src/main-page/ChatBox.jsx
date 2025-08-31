// src/main-page/ChatBox.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { tripApi } from "../api/horizonApi";
import { Mic, Send, StopCircle, MapPin, Calendar, DollarSign } from "lucide-react";

const ChatBox = forwardRef(({ onPlanGenerated, tripContext = null }, ref) => {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi there! I'm your AI travel assistant. Tell me where you'd like to go, and I'll help you plan the perfect trip!" }
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Quick suggestion chips
  const suggestions = [
    "Plan a budget trip to Kerala",
    "Weekend getaway in Goa",
    "Family vacation in Rajasthan",
    "5-day mountain retreat in Himachal Pradesh"
  ];

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

  // Process and extract trip planning information from a message
  const extractTripInfo = (message) => {
    const preferences = {
      duration: extractDuration(message) || 5,
      budget: extractBudget(message) || 20000,
      interests: extractInterests(message) || ["nature", "beaches", "relaxation"],
      dietary: extractDietary(message) || ["vegetarian"],
      transportation: extractTransportation(message) || ["train", "bus"]
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
    const budgetMatch = message.match(/budget (?:₹|Rs\.?|INR)?(\d+)[kK]?/i);
    if (budgetMatch) {
      let amount = parseInt(budgetMatch[1]);
      // If it's a small number like "20k", interpret as thousands
      if (amount < 100 && message.toLowerCase().includes("k")) {
        amount *= 1000;
      }
      return amount;
    }
    
    // Try to detect budget level from keywords
    const message_lower = message.toLowerCase();
    if (message_lower.includes("luxury") || message_lower.includes("high-end") || message_lower.includes("expensive")) {
      return 50000;
    } else if (message_lower.includes("budget") || message_lower.includes("cheap") || message_lower.includes("inexpensive")) {
      return 15000;
    }
    return 30000; // Default medium budget
  };

  // Extract interests from message
  const extractInterests = (message) => {
    const interests = [];
    const message_lower = message.toLowerCase();
    
    const interestKeywords = {
      "nature": ["nature", "wildlife", "mountains", "hill", "forest", "natural", "outdoors"],
      "beaches": ["beach", "coastal", "seaside", "ocean", "sea"],
      "relaxation": ["relax", "peaceful", "calm", "quiet", "retreat", "spa"],
      "adventure": ["adventure", "hiking", "trekking", "outdoor", "sport", "climbing"],
      "culture": ["culture", "art", "museum", "history", "historical", "heritage"],
      "food": ["food", "culinary", "cuisine", "restaurant", "eat", "dining"],
      "shopping": ["shopping", "market", "mall", "shop", "buy"],
      "spirituality": ["spiritual", "temple", "church", "mosque", "meditation", "yoga"],
      "photography": ["photography", "scenic", "views", "instagram", "photo"],
      "nightlife": ["nightlife", "party", "club", "bar", "pub", "music"]
    };
    
    Object.entries(interestKeywords).forEach(([interest, keywords]) => {
      if (keywords.some(keyword => message_lower.includes(keyword))) {
        interests.push(interest);
      }
    });
    
    return interests.length > 0 ? interests : ["nature", "beaches", "relaxation"];
  };
  
  // Extract dietary preferences from message
  const extractDietary = (message) => {
    const dietary = [];
    const message_lower = message.toLowerCase();
    
    if (message_lower.includes("vegetarian") || message_lower.includes("veg ")) {
      dietary.push("vegetarian");
    }
    
    if (message_lower.includes("vegan")) {
      dietary.push("vegan");
    }
    
    if (message_lower.includes("non-veg") || message_lower.includes("non veg") || message_lower.includes("meat")) {
      dietary.push("non-vegetarian");
    }
    
    if (message_lower.includes("halal")) {
      dietary.push("halal");
    }
    
    if (message_lower.includes("gluten") || message_lower.includes("celiac")) {
      dietary.push("gluten-free");
    }
    
    return dietary.length > 0 ? dietary : ["vegetarian"];
  };
  
  // Extract transportation preferences from message
  const extractTransportation = (message) => {
    const transportation = [];
    const message_lower = message.toLowerCase();
    
    if (message_lower.includes("train")) {
      transportation.push("train");
    }
    
    if (message_lower.includes("bus")) {
      transportation.push("bus");
    }
    
    if (message_lower.includes("car") || message_lower.includes("drive")) {
      transportation.push("car");
    }
    
    if (message_lower.includes("flight") || message_lower.includes("fly")) {
      transportation.push("flight");
    }
    
    if (message_lower.includes("ferry") || message_lower.includes("boat")) {
      transportation.push("ferry");
    }
    
    return transportation.length > 0 ? transportation : ["train", "bus"];
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
      // Check if the message seems like a trip planning request
      const isPlanningRequest = 
        message.toLowerCase().includes("plan") || 
        message.toLowerCase().includes("trip") || 
        message.toLowerCase().includes("travel") ||
        message.toLowerCase().includes("visit");
      
      if (isPlanningRequest) {
        // Extract trip preferences
        const preferences = extractTripInfo(message);
        
        // Add a typing indicator message
        setMessages(prev => [
          ...prev, 
          { type: "bot", text: "I'm planning your trip now, this will take a moment..." }
        ]);
        
        // Call the trip planning API directly
        const response = await tripApi.planTrip(message, preferences);
        
        // Process the response
        console.log("Trip plan API response:", response);
        
        // Add AI response message
        setMessages(prev => [
          ...prev.filter(msg => !msg.text.includes("planning your trip now")), // Remove the typing indicator
          { 
            type: "bot", 
            text: `I've created a trip plan for you based on your request! You can see the details below.`,
            isPlanResponse: true
          }
        ]);
        
        // Update conversation history
        setConversationHistory([
          ...updatedHistory,
          { 
            role: "assistant", 
            content: `I've created a trip plan for you based on your request! You can see the details below.`
          }
        ]);
        
        // Pass the response to parent component
        onPlanGenerated && onPlanGenerated(response);
      } else {
        // Regular chat message - send to chat API
        const response = await tripApi.sendChatMessage(message, conversationHistory);
        
        // Add AI response to chat
        setMessages(prev => [
          ...prev, 
          { type: "bot", text: response.response }
        ]);
        
        // Update conversation history
        setConversationHistory([
          ...updatedHistory,
          { role: "assistant", content: response.response }
        ]);
        
        // Check if it contains trip planning information anyway
        if (response.actionable && response.action_type === "planning") {
          // Call the trip planning API with the extracted information
          const preferences = extractTripInfo(message);
          
          try {
            const planResponse = await tripApi.planTrip(message, preferences);
            onPlanGenerated && onPlanGenerated(planResponse);
          } catch (planError) {
            console.error("Error getting trip plan:", planError);
          }
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      // Handle errors
      setMessages(prev => [
        ...prev, 
        { type: "bot", text: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 flex items-center justify-between">
        <h2 className="font-bold flex items-center">
          <MapPin className="mr-2" size={18} />
          Travel Assistant
        </h2>
        <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
          AI Powered
        </div>
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
                  ? "bg-orange-100 text-gray-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.text}
              
              {message.isPlanResponse && (
                <div className="mt-2 text-xs text-orange-500">
                  Check out the map and itinerary below!
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Quick suggestion chips - show only at the beginning */}
        {messages.length < 3 && (
          <div className="flex flex-wrap gap-2 my-4">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggestion)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-200"></div>
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
            placeholder="Tell me where you want to go..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={listening}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full focus:outline-none ${
              !input.trim() || isLoading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
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