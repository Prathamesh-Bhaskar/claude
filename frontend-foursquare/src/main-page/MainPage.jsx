// Enhanced MainPage.jsx - Unified response handling
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import MapBox from "./MapBox";
import ChatBox from "./ChatBox";
import RoadMap from "./RoadMap";
import PlanDetails from "./PlanDetails";
import Booking from "./Booking";
import TripPlannerForm from "../components/TripPlannerForm";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("chat");
  const [mapLocations, setMapLocations] = useState([]);
  const [tripPlan, setTripPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseDisplay, setResponseDisplay] = useState({
    show: false,
    content: null,
    type: 'trip' // 'trip' or 'chat'
  });
  const [roadmapData, setRoadmapData] = useState({
    title: "Your Trip Plan",
    days: []
  });
  
  const chatBoxRef = useRef(null);
  const formRef = useRef(null);

  // Unified response handler for both chat and form
  const handlePlanGenerated = (response, source = 'unknown') => {
    console.log(`New response from ${source}:`, response);
    
    try {
      setIsLoading(false);
      
      // Handle trip planning responses
      if (response && response.days) {
        setTripPlan(response);
        updateRoadmapFromPlan(response);
        
        // Extract locations for the map
        const allLocations = [];
        response.days.forEach(day => {
          day.locations.forEach(location => {
            allLocations.push(location);
          });
        });
        setMapLocations(allLocations);
        
        // Show response on frontend
        setResponseDisplay({
          show: true,
          content: response,
          type: 'trip',
          source: source
        });
      }
      // Handle regular chat responses
      else if (response && typeof response === 'string') {
        setResponseDisplay({
          show: true,
          content: response,
          type: 'chat',
          source: source
        });
      }
      // Handle other response formats
      else {
        console.log("Processing other response format:", response);
        setResponseDisplay({
          show: true,
          content: response,
          type: 'general',
          source: source
        });
      }
    } catch (error) {
      console.error("Error processing response:", error);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    
    try {
      // Create trip query from form data
      const query = `Plan a ${formData.duration}-day trip to ${formData.destination} with a budget of ₹${formData.budget}`;
      
      // Call trip planning API
      const response = await tripApi.planTrip(query, {
        duration: parseInt(formData.duration),
        budget: parseInt(formData.budget),
        interests: formData.interests || [],
        dietary: formData.dietary || [],
        transportation: formData.transportation || []
      });
      
      handlePlanGenerated(response, 'form');
      
    } catch (error) {
      console.error("Form submission error:", error);
      setIsLoading(false);
    }
  };

  // Handle chat messages (both trip planning and general chat)
  const handleChatResponse = (response, messageType) => {
    if (messageType === 'trip_plan') {
      handlePlanGenerated(response, 'chat');
    } else {
      // Just regular chat - let ChatBox handle its own display
      console.log("Regular chat response handled by ChatBox");
    }
  };

  // Update roadmap data based on trip plan
  const updateRoadmapFromPlan = (plan) => {
    if (!plan || !plan.days) return;
    
    setRoadmapData({
      title: plan.title || "Your Trip Plan",
      days: plan.days.map(day => ({
        day: day.day,
        title: day.title || `Day ${day.day}`,
        description: day.description || "",
        locations: day.locations.map(loc => ({
          name: loc.name,
          description: loc.description || "",
          activities: loc.activities || []
        }))
      }))
    });
  };

  // Process URL parameters on initial load
  useEffect(() => {
    const destination = searchParams.get("destination");
    const days = searchParams.get("days");
    
    if (destination) {
      setActiveTab("form");
      
      if (days && chatBoxRef.current) {
        const query = `Plan a ${days}-day trip to ${destination}`;
        chatBoxRef.current.sendMessage(query);
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Plan Your Perfect Trip</h1>
          <p className="text-gray-600 mt-2">Choose your preferred way to plan - chat with our AI or use the form</p>
        </div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                <p className="text-lg font-medium">Processing your request...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Planning interface */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tab selector */}
            <div className="bg-white rounded-lg shadow-md p-2 flex">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  activeTab === "chat"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Chat with AI
              </button>
              <button
                onClick={() => setActiveTab("form")}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  activeTab === "form"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Use Form
              </button>
            </div>
            
            {/* Planning interfaces */}
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === "chat" ? (
                <ChatBox 
                  ref={chatBoxRef}
                  onPlanGenerated={(response) => handleChatResponse(response, 'trip_plan')}
                  onChatResponse={(response) => handleChatResponse(response, 'chat')}
                />
              ) : (
                <TripPlannerForm 
                  ref={formRef}
                  onSubmit={handleFormSubmit}
                  onPlanGenerated={(response) => handlePlanGenerated(response, 'form')}
                />
              )}
            </div>
          </div>
          
          {/* Center column - Response Display */}
          <div className="lg:col-span-1">
            {responseDisplay.show && (
              <div className="space-y-6">
                {/* Response header */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      responseDisplay.source === 'chat' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    Response from {responseDisplay.source === 'chat' ? 'AI Chat' : 'Form'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {responseDisplay.type === 'trip' ? 'Trip Plan Generated' : 'AI Response'}
                  </p>
                </div>

                {/* Response content */}
                {responseDisplay.type === 'trip' && responseDisplay.content ? (
                  <div className="space-y-4">
                    <PlanDetails tripPlan={responseDisplay.content} />
                    <RoadMap data={roadmapData} />
                  </div>
                ) : responseDisplay.type === 'chat' ? (
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{responseDisplay.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(responseDisplay.content, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {!responseDisplay.show && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to Plan!</h3>
                <p className="text-gray-500">Use the chat or form to get started. Your results will appear here.</p>
              </div>
            )}
          </div>
          
          {/* Right column - Map */}
          <div className="lg:col-span-1">
            <MapBox locations={mapLocations} />
            {tripPlan && <Booking tripPlan={tripPlan} />}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}