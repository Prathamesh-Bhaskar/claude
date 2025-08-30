// src/main-page/PlanDetails.jsx
import { useState, useEffect } from "react";

export default function PlanDetails({ tripPlan = null }) {
  const [planData, setPlanData] = useState({
    title: "Delhi Sightseeing Trip",
    duration: "3 Days / 2 Nights",
    locations: [
      {
        name: "Red Fort",
        photos: ["/assets/redfort1.jpg", "/assets/redfort2.jpg"],
        description: "A historic fort in Delhi, showcasing Mughal architecture.",
        dailyPlan: [
          { day: 1, food: "Local street food", hotel: "Hotel Taj Palace", activities: "Guided tour, Photography" },
        ],
      },
      {
        name: "India Gate",
        photos: ["/assets/indiagate1.jpg", "/assets/indiagate2.jpg"],
        description: "A war memorial and popular picnic spot.",
        dailyPlan: [
          { day: 1, food: "Picnic snacks", hotel: "Hotel Taj Palace", activities: "Evening walk, Sightseeing" },
        ],
      },
      {
        name: "Qutub Minar",
        photos: ["/assets/qutub1.jpg", "/assets/qutub2.jpg"],
        description: "Tallest brick minaret in India with rich history.",
        dailyPlan: [
          { day: 2, food: "Local cuisine nearby", hotel: "Hotel Taj Palace", activities: "Guided tour" },
        ],
      },
    ],
    notes: "Remember to carry water, wear comfortable shoes, and follow local guidelines.",
  });

  // Process trip plan when it changes
  useEffect(() => {
    if (tripPlan) {
      const processedLocations = [];
      
      // Process locations from trip plan
      if (tripPlan.days) {
        tripPlan.days.forEach(day => {
          if (day.locations) {
            day.locations.forEach(location => {
              // Check if location already exists
              const existingLoc = processedLocations.find(loc => loc.name === location.name);
              
              if (existingLoc) {
                // Add daily plan to existing location
                existingLoc.dailyPlan.push({
                  day: day.day,
                  food: location.food || "Local cuisine",
                  hotel: location.accommodation || "Not specified",
                  activities: location.activities ? location.activities.join(", ") : "Sightseeing"
                });
              } else {
                // Create new location entry
                processedLocations.push({
                  name: location.name,
                  photos: ["/assets/placeholder.jpg"], // Placeholder for now
                  description: location.description || `Visit ${location.name} and explore the surroundings.`,
                  dailyPlan: [{
                    day: day.day,
                    food: location.food || "Local cuisine",
                    hotel: location.accommodation || "Not specified",
                    activities: location.activities ? location.activities.join(", ") : "Sightseeing"
                  }]
                });
              }
            });
          }
        });
      }
      
      // Update plan data with processed information
      setPlanData({
        title: tripPlan.title || "Your Trip Plan",
        duration: tripPlan.duration || `${tripPlan.days?.length || 1} Days`,
        locations: processedLocations,
        notes: tripPlan.notes || "Enjoy your journey!"
      });
    }
  }, [tripPlan]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-200 space-y-6">
      {/* Trip Title and Duration */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{planData.title}</h2>
        <p className="text-gray-600"><strong>Duration:</strong> {planData.duration}</p>
      </div>

      {/* Locations */}
      {planData.locations.map((location, index) => (
        <div key={index} className="space-y-3 border-t pt-4">
          {/* Location Name */}
          <h3 className="text-xl font-semibold">{location.name}</h3>

          {/* Photos */}
          <div className="flex gap-2 overflow-x-auto">
            {location.photos.map((photo, idx) => (
              <div 
                key={idx}
                className="w-32 h-24 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-gray-500 text-xs"
              >
                Photo Placeholder
              </div>
            ))}
          </div>

          {/* Description */}
          <p className="text-gray-700">{location.description}</p>

          {/* Daily Plan */}
          <div>
            <h4 className="font-semibold mb-1">Daily Plan:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {location.dailyPlan.map((plan, idx) => (
                <li key={idx}>
                  <strong>Day {plan.day}:</strong> Food: {plan.food}, Hotel: {plan.hotel}, Activities: {plan.activities}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* Notes */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold mb-1">Notes:</h4>
        <p className="text-gray-700">{planData.notes}</p>
      </div>
    </div>
  );
}