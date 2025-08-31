// src/main-page/MainPage.jsx
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
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' or 'form'
  const [mapLocations, setMapLocations] = useState([]);
  const [tripPlan, setTripPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roadmapData, setRoadmapData] = useState({
    title: "Your Trip Plan",
    days: []
  });
  
  const chatBoxRef = useRef(null);

  // Handle when a new trip plan is generated
  const handlePlanGenerated = (response) => {
    console.log("New trip plan response:", response);
    
    try {
      // If it's already a structured trip plan with days array
      if (response && response.days) {
        setTripPlan(response);
        
        // Update roadmap data
        updateRoadmapFromPlan(response);
        
        // Extract locations for the map
        const allLocations = [];
        response.days.forEach(day => {
          day.locations.forEach(location => {
            allLocations.push(location);
          });
        });
        setMapLocations(allLocations);
      }
      // If it's some other format, log a warning
      else {
        console.warn("Received response in unknown format:", response);
      }
    } catch (error) {
      console.error("Error processing trip plan:", error);
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
      // Set the form tab active if URL parameters are present
      setActiveTab("form");
      
      // If chat interface is available, send a message to it
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
                <p className="text-lg font-medium">Planning your trip...</p>
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
                <div className="bg-white rounded-lg shadow-md h-[550px]">
                  <ChatBox 
                    ref={chatBoxRef}
                    onPlanGenerated={handlePlanGenerated} 
                  />
                </div>
              ) : (
                <TripPlannerForm 
                  onPlanGenerated={handlePlanGenerated} 
                  setIsLoading={setIsLoading}
                />
              )}
            </div>
          </div>
          
          {/* Right column - Map and trip details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4">Trip Map</h2>
              <div className="h-[500px]">
                <MapBox 
                  initialLocations={mapLocations} 
                  tripPlan={tripPlan} 
                />
              </div>
            </div>
            
            {/* Trip details section - show only if we have a trip plan */}
            {tripPlan && (
              <>
                {/* RoadMap */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-xl font-bold mb-4">Day by Day Itinerary</h2>
                  <RoadMap 
                    title={roadmapData.title} 
                    days={roadmapData.days} 
                  />
                </div>
                
                {/* Details */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-xl font-bold mb-4">Trip Details</h2>
                  <PlanDetails tripPlan={tripPlan} />
                </div>
                
                {/* Booking */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-xl font-bold mb-4">Booking Options</h2>
                  <Booking tripPlan={tripPlan} />
                </div>
              </>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}