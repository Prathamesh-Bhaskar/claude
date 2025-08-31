// src/components/TripPlannerForm.jsx
import React, { useState } from "react";
import { MapPin, Calendar, DollarSign, Heart, Utensils, Bus, Send } from "lucide-react";
import { tripApi } from "../api/horizonApi";

const TripPlannerForm = ({ onPlanGenerated, setIsLoading }) => {
  // Form state
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(5);
  const [budget, setBudget] = useState(20000);
  const [interests, setInterests] = useState(["nature", "beaches", "relaxation"]);
  const [dietary, setDietary] = useState(["vegetarian"]);
  const [transportation, setTransportation] = useState(["train", "bus"]);

  // Available options
  const interestOptions = [
    "nature", "beaches", "relaxation", "adventure", "culture", 
    "history", "food", "shopping", "wildlife", "spirituality"
  ];
  const dietaryOptions = ["vegetarian", "vegan", "non-vegetarian", "halal", "gluten-free"];
  const transportationOptions = ["train", "bus", "car", "flight", "ferry"];

  // Toggle selection in a multi-select array
  const toggleItem = (item, array, setArray) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  // Generate query from form fields
  const generateQuery = () => {
    let generatedQuery = `Plan a ${duration}-day`;
    
    if (destination) {
      generatedQuery += ` ${destination} trip`;
    } else {
      generatedQuery += " trip";
    }
    
    // Add interests
    if (interests.length > 0) {
      generatedQuery += `: ${interests.slice(0, 3).join(", ")}`;
    }
    
    // Add budget if specified
    if (budget > 0) {
      generatedQuery += `, budget ₹${budget}`;
    }
    
    setQuery(generatedQuery);
    return generatedQuery;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Generate query if empty
    const finalQuery = query || generateQuery();
    
    // Prepare API payload
    const payload = {
      query: finalQuery,
      preferences: {
        budget: budget,
        duration: duration,
        interests: interests,
        dietary: dietary,
        transportation: transportation
      },
      user_id: "user123" // This would normally come from authentication
    };
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Call trip planning API
      const response = await tripApi.planTrip(finalQuery, payload.preferences);
      
      // Pass the response to parent component
      onPlanGenerated(response);
    } catch (error) {
      console.error("Error planning trip:", error);
      alert("Failed to plan trip. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <MapPin className="mr-2 text-orange-500" size={20} />
        Plan Your Trip
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <MapPin className="mr-1" size={16} />
            Destination
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g., Kerala, Goa, Rajasthan"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        
        {/* Duration */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="mr-1" size={16} />
            Duration (Days)
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            min="1"
            max="30"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        
        {/* Budget */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <DollarSign className="mr-1" size={16} />
            Budget (₹)
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            min="1000"
            step="1000"
            value={budget}
            onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value) || 1000))}
          />
        </div>
        
        {/* Interests */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <Heart className="mr-1" size={16} />
            Interests
          </label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleItem(interest, interests, setInterests)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  interests.includes(interest)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {interest.charAt(0).toUpperCase() + interest.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Dietary Preferences */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <Utensils className="mr-1" size={16} />
            Dietary Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleItem(option, dietary, setDietary)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  dietary.includes(option)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Transportation */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <Bus className="mr-1" size={16} />
            Transportation
          </label>
          <div className="flex flex-wrap gap-2">
            {transportationOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleItem(option, transportation, setTransportation)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  transportation.includes(option)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Natural Language Query (Optional) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Custom Query (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Or describe your trip in your own words"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={generateQuery}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Generate query from form fields"
            >
              Auto
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to auto-generate from the form fields above
          </p>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
        >
          <Send size={18} />
          Plan My Trip
        </button>
      </form>
    </div>
  );
};

export default TripPlannerForm;