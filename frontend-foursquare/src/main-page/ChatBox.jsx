// src/main-page/ChatBox.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react"; 
import { tripApi } from "../api/horizonApi";

export default function ChatBox({ onPlanGenerated }) {
  const [messages, setMessages] = useState([
    { type: "bot", text: "👋 Hi! I am your AI travel assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { type: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Update conversation history for context
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: input }
    ];
    setConversationHistory(updatedHistory);
    
    // Clear input and show loading state
    setInput("");
    setIsLoading(true);

    try {
      // Call the backend API
      const response = await tripApi.sendChatMessage(input, conversationHistory);
      
      // Add AI response to chat
      const botMessage = { type: "bot", text: response.response };
      setMessages(prev => [...prev, botMessage]);
      
      // Update conversation history with AI response
      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: response.response }
      ]);
      
      // If the response contains a trip plan, pass it to the parent component
      if (response.actionable && response.action_type === "planning") {
        // Here we'd make another API call to get the full trip plan
        const tripPlan = await tripApi.planTrip(input, {
          // Extract preferences from the conversation or use defaults
          duration: extractDuration(input) || 3,
          budget: extractBudget(input) || "medium",
          interests: extractInterests(input) || ["sightseeing"]
        });
        
        // Notify parent component about the new trip plan
        onPlanGenerated && onPlanGenerated(tripPlan);
      }
    } catch (error) {
      // Handle errors
      setMessages(prev => [
        ...prev, 
        { type: "bot", text: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start listening for speech
  const startListening = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      alert("Your browser does not support voice recognition.");
    }
  };

  // Helper functions to extract preferences from user input
  const extractDuration = (input) => {
    const durationMatch = input.match(/(\d+)\s*(day|days)/i);
    return durationMatch ? parseInt(durationMatch[1]) : null;
  };

  const extractBudget = (input) => {
    if (input.match(/budget|cheap|affordable|inexpensive/i)) return "low";
    if (input.match(/luxury|expensive|high-end/i)) return "high";
    return "medium";
  };

  const extractInterests = (input) => {
    const interests = [];
    if (input.match(/history|historical|heritage|monument/i)) interests.push("history");
    if (input.match(/food|cuisine|restaurant|eating/i)) interests.push("food");
    if (input.match(/nature|outdoors|hiking|trek/i)) interests.push("nature");
    if (input.match(/shopping|market|mall/i)) interests.push("shopping");
    if (input.match(/beach|ocean|sea/i)) interests.push("beaches");
    if (input.match(/adventure|thrill|exciting/i)) interests.push("adventure");
    if (input.match(/relax|peaceful|quiet/i)) interests.push("relaxation");
    return interests.length > 0 ? interests : null;
  };

  // ✅ Button Styles
  const micButtonStyle = {
    padding: "12px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s, background-color 0.2s",
    cursor: "pointer",
    backgroundColor: listening ? "#ef4444" : "#e5e7eb", // red when listening, gray otherwise
    color: listening ? "white" : "#4b5563",
  };

  const sendButtonStyle = {
    marginLeft: "8px",
    padding: "8px 16px",
    borderRadius: "9999px",
    backgroundColor: "#f97316", // orange
    color: "white",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.2s, background-color 0.2s",
  };

  return (
    <div className="top-5 left-5 w-full max-w-sm md:max-w-md h-[750px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">

      {/* Chat Header */}
      <div className="bg-orange-500 text-white font-bold px-4 py-3 text-center text-lg md:text-xl">
        AI Chat Assistant
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: msg.type === "user" ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
              msg.type === "user"
                ? "bg-orange-100 text-orange-800 ml-auto"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {msg.text}
          </motion.div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl max-w-xs flex items-center space-x-2"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
            </div>
            <span>Thinking...</span>
          </motion.div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 p-3 border-t border-gray-200">
        {/* Voice Button */}
        <button
          onClick={startListening}
          style={micButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            if (!listening) e.currentTarget.style.backgroundColor = "#d1d5db"; // hover gray
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            if (!listening) e.currentTarget.style.backgroundColor = "#e5e7eb"; // reset gray
          }}
          disabled={isLoading}
        >
          <Mic size={20} />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          disabled={isLoading}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          style={sendButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ea580c"; // darker orange
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f97316"; // normal orange
            e.currentTarget.style.transform = "scale(1)";
          }}
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}