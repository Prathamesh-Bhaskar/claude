// Enhanced ChatBox.jsx - Unified chat and trip planning
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { tripApi } from "../api/horizonApi";
import { Mic, Send, StopCircle, MapPin, Calendar, DollarSign, Bot, User } from "lucide-react";

const ChatBox = forwardRef(({ onPlanGenerated, onChatResponse, tripContext = null }, ref) => {
  const [messages, setMessages] = useState([
    { 
      type: "bot", 
      text: "Hi there! I'm your AI travel assistant. I can help you with:\n\n🗺️ **Trip Planning** - Tell me where you want to go\n💬 **Travel Questions** - Ask about destinations, activities, etc.\n📋 **Recommendations** - Get suggestions for places to visit\n\nHow can I help you today?",
      timestamp: new Date().toLocaleTimeString()
    }
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
    "Best time to visit Himachal Pradesh",
    "What to eat in Mumbai?",
    "Adventure activities in Rishikesh"
  ];

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    sendMessage: (message) => {
      handleSendMessage(message);
    },
    clearChat: () => {
      setMessages([{
        type: "bot",
        text: "Chat cleared! How can I help you plan your next trip?",
        timestamp: new Date().toLocaleTimeString()
      }]);
      setConversationHistory([]);
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

      recognitionRef.current.onerror = () => {
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

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    handleSendMessage(suggestion);
  };

  // Process and extract trip planning information from a message
  const extractTripInfo = (message) => {
    const preferences = {
      duration: extractDuration(message) || 5,
      budget: extractBudget(message) || 20000,
      interests: extractInterests(message) || ["nature", "culture", "food"],
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
    const budgetMatch = message.match(/budget.*?(\d+)/i);
    return budgetMatch ? parseInt(budgetMatch[1]) * 1000 : null;
  };

  // Extract interests from message
  const extractInterests = (message) => {
    const interests = [];
    const message_lower = message.toLowerCase();
    
    const interestMap = {
      "nature": ["nature", "hiking", "trekking", "mountains", "forests"],
      "beaches": ["beach", "sea", "ocean", "swimming", "surfing"],
      "culture": ["culture", "heritage", "temples", "history", "museums"],
      "food": ["food", "cuisine", "restaurant", "eating", "local dishes"],
      "adventure": ["adventure", "sports", "climbing", "rafting"],
      "relaxation": ["relax", "spa", "peaceful", "quiet", "meditation"]
    };

    for (const [interest, keywords] of Object.entries(interestMap)) {
      if (keywords.some(keyword => message_lower.includes(keyword))) {
        interests.push(interest);
      }
    }

    return interests.length > 0 ? interests : ["nature", "culture", "food"];
  };

  // Extract dietary preferences
  const extractDietary = (message) => {
    if (message.toLowerCase().includes("veg")) return ["vegetarian"];
    if (message.toLowerCase().includes("non-veg")) return ["non-vegetarian"];
    return ["vegetarian"];
  };
  
  // Extract transportation preferences
  const extractTransportation = (message) => {
    const transportation = [];
    const message_lower = message.toLowerCase();
    
    if (message_lower.includes("train")) transportation.push("train");
    if (message_lower.includes("bus")) transportation.push("bus");
    if (message_lower.includes("car") || message_lower.includes("drive")) transportation.push("car");
    if (message_lower.includes("flight") || message_lower.includes("fly")) transportation.push("flight");
    if (message_lower.includes("ferry") || message_lower.includes("boat")) transportation.push("ferry");
    
    return transportation.length > 0 ? transportation : ["train", "bus"];
  };

  // Determine if message is a trip planning request
  const isTripPlanningRequest = (message) => {
    const planningKeywords = [
      "plan", "trip", "travel", "visit", "itinerary", "schedule",
      "go to", "vacation", "holiday", "tour", "journey"
    ];
    
    const message_lower = message.toLowerCase();
    return planningKeywords.some(keyword => message_lower.includes(keyword));
  };

  // Function to handle sending a message
  const handleSendMessage = async (message) => {
    // Add user message to chat
    const userMessage = { 
      type: "user", 
      text: message,
      timestamp: new Date().toLocaleTimeString()
    };
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
      // Check if the message is a trip planning request
      const isPlanningRequest = isTripPlanningRequest(message);
      
      if (isPlanningRequest) {
        // Add a typing indicator message
        const typingMessage = { 
          type: "bot", 
          text: "🎯 I'm planning your trip now, this will take a moment...",
          timestamp: new Date().toLocaleTimeString(),
          isTyping: true
        };
        setMessages(prev => [...prev, typingMessage]);
        
        // Extract trip preferences
        const preferences = extractTripInfo(message);
        
        // Call the trip planning API directly
        const response = await tripApi.planTrip(message, preferences);
        
        // Remove typing indicator and add trip plan response
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping),
          { 
            type: "bot", 
            text: `✅ **Trip Plan Generated!** 

I've created a detailed trip plan based on your request. You can see the complete itinerary, map, and details in the center panel.

${response.title ? `**${response.title}**` : ''}

Would you like me to modify anything or do you have other questions about your trip?`,
            timestamp: new Date().toLocaleTimeString(),
            isPlanResponse: true
          }
        ]);
        
        // Update conversation history
        setConversationHistory([
          ...updatedHistory,
          { 
            role: "assistant", 
            content: "I've created a trip plan for you based on your request!" 
          }
        ]);
        
        // Notify parent component with trip plan
        onPlanGenerated && onPlanGenerated(response);
        
      } else {
        // Regular chat message - send to chat API
        const response = await tripApi.sendChatMessage(message, conversationHistory);
        
        // Add AI response to chat
        const botMessage = { 
          type: "bot", 
          text: response.response,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Update conversation history
        setConversationHistory([
          ...updatedHistory,
          { role: "assistant", content: response.response }
        ]);
        
        // Notify parent component with chat response
        onChatResponse && onChatResponse(response.response);
        
        // Check if response suggests trip planning
        if (response.actionable && response.action_type === "planning") {
          // Could trigger trip planning automatically if needed
          console.log("AI suggested trip planning action");
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Remove any typing indicators and add error message
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        { 
          type: "bot", 
          text: "❌ Sorry, I encountered an error processing your request. Please try again or rephrase your message.",
          timestamp: new Date().toLocaleTimeString(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl overflow-hidden shadow-lg">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <h2 className="font-bold flex items-center">
          <Bot className="mr-2" size={18} />
          AI Travel Assistant
        </h2>
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
            Online
          </div>
          <button 
            onClick={() => ref?.current?.clearChat()}
            className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full hover:bg-opacity-30 transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.type === "user" ? "ml-2" : "mr-2"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === "user" ? "bg-blue-500" : "bg-purple-500"
                }`}>
                  {message.type === "user" ? 
                    <User size={16} className="text-white" /> : 
                    <Bot size={16} className="text-white" />
                  }
                </div>
              </div>
              
              {/* Message bubble */}
              <div className="flex flex-col">
                <div
                  className={`p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : message.isError
                      ? "bg-red-50 border border-red-200 text-red-800"
                      : message.isPlanResponse
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.text}
                  </div>
                </div>
                {/* Timestamp */}
                <div className={`text-xs text-gray-400 mt-1 ${
                  message.type === "user" ? "text-right" : "text-left"
                }`}>
                  {message.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs text-gray-500">AI is typing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2">
          <div className="text-xs text-gray-500 mb-2">Try these suggestions:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about travel or trip planning..."
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          {/* Voice input button */}
          {recognitionRef.current && (
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-3 rounded-lg transition-colors ${
                listening 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {listening ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatBox;