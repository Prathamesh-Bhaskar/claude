// src/main-page/MainPage.jsx
import { useState, useEffect } from "react";
import ChatBox from "./ChatBox";
import MapBox from "./MapBox";
import PlanDetails from "./PlanDetails";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoadMap from "./RoadMap";
import Booking from "./Booking";

export default function MainPage() {
  const [tripPlan, setTripPlan] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [roadmapData, setRoadmapData] = useState({ title: "", days: [] });

  // Process trip plan data for various components
  useEffect(() => {
    if (tripPlan) {
      // Process locations for map
      const locations = [];
      
      if (tripPlan.days) {
        tripPlan.days.forEach(day => {
          if (day.locations) {
            day.locations.forEach(location => {
              locations.push({
                name: location.name,
                lat: location.lat,
                lng: location.lng,
                day: day.day,
                description: location.description || ""
              });
            });
          }
        });
      }
      
      setMapLocations(locations);
      
      // Process data for roadmap
      const roadmapTitle = tripPlan.title || "Your Journey";
      const roadmapDays = tripPlan.days?.map(day => ({
        title: day.title || `Day ${day.day}`,
        subtitle: day.locations?.map(loc => loc.name).join(", ") || ""
      })) || [];
      
      setRoadmapData({
        title: roadmapTitle,
        days: roadmapDays
      });
    }
  }, [tripPlan]);

  // Handle trip plan generation from chat
  const handlePlanGenerated = (plan) => {
    console.log("New trip plan generated:", plan);
    setTripPlan(plan);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col gap-0.1">
      {/* Navbar */}
      <Navbar className="sticky top-0 z-50" />

      {/* Main Content */}
      <div className="flex flex-col gap-4 p-4 mt-[60px]">
        {/* Top Row - ChatBox (left) and MapBox (right) */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left - ChatBox */}
          <div className="flex-none w-full md:w-[450px] rounded-2xl shadow-2xl p-0.5 border border-gray-200">
            <ChatBox onPlanGenerated={handlePlanGenerated} />
          </div>

          {/* Right - MapBox */}
          <div className="flex-1 rounded-2xl shadow-2xl p-0.5 border border-gray-200">
            <MapBox initialLocations={mapLocations} tripPlan={tripPlan} />
          </div>
        </div>

        {/* RoadMap - styled like other cards */}
        <div className="w-full min-h-100 rounded-2xl shadow-2xl p-0.5 border border-gray-200">
          <RoadMap title={roadmapData.title} days={roadmapData.days} />
        </div>

        {/* PlanDetails */}
        <div className="w-full rounded-2xl shadow-2xl p-0.5 border border-gray-200">
          <PlanDetails tripPlan={tripPlan} />
        </div>

        {/* Booking - styled like other cards */}
        <div className="w-full rounded-2xl shadow-2xl p-0.5 border border-gray-200">
          <Booking tripPlan={tripPlan} />
        </div>

        <div>
          <Footer />
        </div>
      </div>
    </div>
  );
}