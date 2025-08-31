// src/main-page/MainPage.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MapBox from "./MapBox";
import ChatBox from "./ChatBox";
import RoadMap from "./RoadMap";
import PlanDetails from "./PlanDetails";
import Booking from "./Booking";
import Footer from "../components/Footer";
import { tripApi } from "../api/horizonApi";
import { processTripResponse } from "../utils/TripProcessor";

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const [mapLocations, setMapLocations] = useState([]);
  const [tripPlan, setTripPlan] = useState(null);
  const [roadmapData, setRoadmapData] = useState({
    title: "Your Trip Plan",
    days: []
  });

  // Handle when a new trip plan is generated from the ChatBox
  const handlePlanGenerated = (response) => {
    console.log("New trip plan response:", response);
    
    try {
      // Check if response is a string (text response)
      if (typeof response === 'string') {
        // Process the text response into a structured trip plan
        const structuredPlan = processTripResponse(response);
        setTripPlan(structuredPlan);
        
        // Update roadmap data
        updateRoadmapFromPlan(structuredPlan);
        
        // Extract locations for the map
        const allLocations = [];
        structuredPlan.days.forEach(day => {
          day.locations.forEach(location => {
            allLocations.push(location);
          });
        });
        setMapLocations(allLocations);
      } 
      // Check if response is an object with a response property (API response)
      else if (response && response.response) {
        // Process the text response from the API
        const structuredPlan = processTripResponse(response.response);
        setTripPlan(structuredPlan);
        
        // Update roadmap data
        updateRoadmapFromPlan(structuredPlan);
        
        // Extract locations for the map
        const allLocations = [];
        structuredPlan.days.forEach(day => {
          day.locations.forEach(location => {
            allLocations.push(location);
          });
        });
        setMapLocations(allLocations);
      }
      // Check if response is already a structured trip plan
      else if (response && response.days) {
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
      // Auto-plan trip if destination is provided
      if (days) {
        const query = `Plan a ${days}-day trip to ${destination}`;
        planInitialTrip(query, {
          duration: parseInt(days, 10) || 3,
          budget: "medium",
          interests: ["sightseeing"]
        });
      }
    }
  }, [searchParams]);

  // Plan initial trip based on URL parameters
  const planInitialTrip = async (query, preferences) => {
    try {
      const response = await tripApi.planTrip(query, preferences);
      handlePlanGenerated(response);
    } catch (error) {
      console.error("Error planning initial trip:", error);
    }
  };

  // For testing, process the given JSON response from the message API
  useEffect(() => {
    try {
      // This is just a test - you would normally get this from the API
      const testResponse = {
        "action_type": null,
        "actionable": false,
        "response": "Of course! I'd be absolutely delighted to help you plan a fantastic trip to Goa. It's a destination with a wonderful split personality – from vibrant party hubs to serene, relaxing beaches.\n\nTo give you the best possible plan, I need a little more information. Could you tell me:\n\n*   **How many days are you planning for?**\n*   **What's your approximate budget** (e.g., backpacker, mid-range, luxury)?\n*   **Who are you traveling with** (solo, partner, family with kids, group of friends)?\n*   **What's your travel style?** Are you looking for non-stop partying, relaxing on the beach, exploring culture and history, adventure sports, or a mix of everything?\n*   **When are you planning to travel?** The season hugely impacts the experience.\n\nIn the meantime, here is a comprehensive starter plan for a **5-day \"Best of Both Worlds\" trip**, perfect for a first-time visitor. It balances the energy of North Goa with the tranquility of South Goa.\n\n---\n\n### **Understanding Goa: North vs. South**\n\nFirst, it's essential to know the difference between the two parts of Goa:\n\n*   **North Goa:** The energetic heart of Goa. Famous for its bustling beaches (Baga, Calangute, Anjuna), vibrant nightlife, flea markets, water sports, and a constant buzz. This is where you go for action and parties.\n*   **South Goa:** The serene soul of Goa. Known for its pristine, white-sand beaches (Palolem, Agonda, Colva), luxury resorts, quiet beach shacks, and a laid-back, relaxed atmosphere. This is where you go to unwind.\n\n---\n\n### **Sample 5-Day Goa Itinerary: The Perfect Mix of Action & Relaxation**\n\nThis itinerary assumes you want to experience a bit of everything.\n\n#### **Day 1: Arrival & North Goa Vibes (Anjuna/Vagator)**\n\n*   **Morning/Afternoon:** Arrive at Dabolim Airport (GOI) or the new Mopa Airport (GOX). Take a pre-paid taxi or use the Goa Miles app to get to your hotel in the Anjuna or Vagator area. These areas have a great vibe without being as crowded as Baga/Calangute.\n*   **Late Afternoon:** After checking in, head to **Vagator Beach**. Climb up to **Chapora Fort** (the \"Dil Chahta Hai\" fort) for a breathtaking sunset view over the sea and the Chapora River.\n*   **Evening:** Have dinner at a legendary spot. **Thalassa**, a Greek restaurant on the Vagator cliff, is famous for its stunning views and lively atmosphere (book in advance!). For a more relaxed vibe, try a beach shack on Ozran Beach.\n\n#### **Day 2: Markets, Beaches & Parties of the North**\n\n*   **Morning:** If it's a Wednesday, the **Anjuna Flea Market** is a must-visit. It's a massive, colorful market where you can find everything from hippie clothing and jewelry to souvenirs and spices. If not, the **Saturday Night Market** in Arpora is another fantastic option.\n*   **Afternoon:** Go beach-hopping. Start at the lively **Baga Beach** and neighboring **Calangute Beach**. This is the place for water sports like parasailing and jet-skiing. Grab lunch at a famous shack like **Brittos** or **St. Anthony's**.\n*   **Evening:** Experience North Goa's famous nightlife. Head to the iconic **Tito's Lane** in Baga for a variety of clubs and pubs. For a classic beach party vibe, check out **Curlies** on Anjuna beach.\n\n#### **Day 3: A Dose of History & Spice**\n\n*   **Morning:** Take a break from the beaches and dive into history. Hire a car/driver for the day and visit **Old Goa**, a UNESCO World Heritage site. Explore the stunning Portuguese-era churches, including the **Basilica of Bom Jesus** (which holds the mortal remains of St. Francis Xavier) and the magnificent **Sé Cathedral**.\n*   **Afternoon:** Drive to Ponda to visit a **Spice Plantation** (like Sahakari Spice Farm). Take a guided tour to see how spices like cardamom, vanilla, and pepper are grown. The tour usually ends with a delicious, traditional Goan buffet lunch served on banana leaves.\n*   **Late Afternoon:** Travel from North Goa to your hotel in South Goa. The journey will take about 2 hours. Check into a beach hut in **Palolem** or a quiet resort in **Agonda**.\n\n#### **Day 4: Serenity in the South**\n\n*   **Morning:** Wake up to the calm of South Goa. Spend the morning relaxing on the beautiful, crescent-shaped **Palolem Beach**. The sea here is very calm, perfect for swimming or kayaking. You can even kayak to the tiny, secluded **Butterfly Beach**.\n*   **Afternoon:** Visit the nearby **Agonda Beach**. It's a much quieter, protected turtle-nesting site. It's perfect for a long, peaceful walk and watching the sunset without the crowds.\n*   **Evening:** Enjoy a quiet, romantic dinner at a beach shack on Palolem or Agonda, with your feet in the sand. If it's a Saturday, experience the unique **Silent Noise Party** at Neptune's Point, Palolem, where everyone dances to music on wireless headphones.\n\n#### **Day 5: Dolphins & Departure**\n\n*   **Morning:** Take an early morning boat trip from Palolem Beach for **dolphin spotting**. Seeing dolphins playing in the wild is a magical way to start your last day.\n*   **Late Morning:** Enjoy a final Goan breakfast. Do some last-minute souvenir shopping for cashews, spices, or local handicrafts.\n*   **Afternoon:** Head to Dabolim Airport (GOI) for your departure, filled with wonderful memories of both sides of Goa.\n\n---\n\n### **Practical Travel Tips for Goa**\n\n*   **Getting Around:**\n    *   **Renting a Scooter/Motorbike:** The most popular way to explore. It's cheap and gives you freedom. Always wear a helmet and have your license handy.\n    *   **Taxis:** Taxis can be expensive. Use the **Goa Miles** app for more reasonable and regulated fares.\n    *   **Car Rental:** A good option for families or groups, especially for day trips like the one to Old Goa.\n*   **What to Eat:**\n    *   **Goan Fish Curry Rice:** The staple and absolute must-try.\n    *   **Prawn Balchão:** A fiery and tangy prawn pickle-like dish.\n    *   **Vindaloo:** A famous spicy and vinegary curry, usually made with pork or chicken.\n    *   **Bebinca:** A layered Goan pudding, often called the \"queen of Goan desserts.\"\n    *   **Feni:** The potent local spirit made from cashew or coconut. Try it with Limca!\n*   **Best Time to Visit:**\n    *   **November to February (Peak Season):** The weather is perfect, with sunny days and cool nights. All shacks and markets are open. It's also the most crowded and expensive time.\n    *   **June to September (Monsoon):** Goa turns lush and green. It's beautiful in a different way, but many beach shacks are closed, and the sea is too rough for swimming. Great for budget travel.\n    *   **March to May (Shoulder Season):** Hot and humid, but you can find good deals on flights and hotels.\n\nThis is just a starting point! Let me know your preferences, and I can tailor a perfect, personalized itinerary just for you. Happy travels"
      };
      
      handlePlanGenerated(testResponse);
    } catch (error) {
      console.error("Error processing test response:", error);
    }
  }, []); // Run once on component mount for testing

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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