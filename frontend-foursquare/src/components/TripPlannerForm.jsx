// Enhanced TripPlannerForm.jsx - Form-based trip planning
import React, { useState, forwardRef, useImperativeHandle } from "react";
import { MapPin, Calendar, DollarSign, Users, Heart, Car, Utensils } from "lucide-react";
import { tripApi } from "../api/horizonApi";

const TripPlannerForm = forwardRef(({ onSubmit, onPlanGenerated }, ref) => {
  const [formData, setFormData] = useState({
    destination: "",
    duration: "",
    budget: "",
    travelers: "2",
    interests: [],
    dietary: [],
    transportation: [],
    accommodation: "hotel",
    startDate: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit();
    },
    resetForm: () => {
      setFormData({
        destination: "",
        duration: "",
        budget: "",
        travelers: "2",
        interests: [],
        dietary: [],
        transportation: [],
        accommodation: "hotel",
        startDate: ""
      });
      setErrors({});
    },
    setFormData: (newData) => {
      setFormData(prev => ({ ...prev, ...newData }));
    }
  }));

  const interestOptions = [
    { id: "nature", label: "Nature & Wildlife", icon: "🌿" },
    { id: "culture", label: "Culture & Heritage", icon: "🏛️" },
    { id: "beaches", label: "Beaches & Coast", icon: "🏖️" },
    { id: "food", label: "Food & Cuisine", icon: "🍽️" },
    { id: "adventure", label: "Adventure Sports", icon: "🏔️" },
    { id: "relaxation", label: "Spa & Wellness", icon: "🧘" },
    { id: "nightlife", label: "Nightlife & Entertainment", icon: "🌃" },
    { id: "shopping", label: "Shopping", icon: "🛍️" }
  ];

  const dietaryOptions = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "non-vegetarian", label: "Non-Vegetarian" },
    { id: "gluten-free", label: "Gluten-Free" },
    { id: "dairy-free", label: "Dairy-Free" }
  ];

  const transportationOptions = [
    { id: "flight", label: "Flight", icon: "✈️" },
    { id: "train", label: "Train", icon: "🚂" },
    { id: "bus", label: "Bus", icon: "🚌" },
    { id: "car", label: "Car/Taxi", icon: "🚗" },
    { id: "ferry", label: "Ferry/Boat", icon: "⛴️" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleMultiSelect = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.destination.trim()) {
      newErrors.destination = "Destination is required";
    }
    
    if (!formData.duration) {
      newErrors.duration = "Duration is required";
    } else if (parseInt(formData.duration) < 1 || parseInt(formData.duration) > 30) {
      newErrors.duration = "Duration must be between 1 and 30 days";
    }
    
    if (!formData.budget) {
      newErrors.budget = "Budget is required";
    } else if (parseInt(formData.budget) < 1000) {
      newErrors.budget = "Budget should be at least ₹1,000";
    }
    
    if (formData.interests.length === 0) {
      newErrors.interests = "Please select at least one interest";
    }
    
    if (formData.transportation.length === 0) {
      newErrors.transportation = "Please select at least one transportation mode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create natural language query from form data
      const query = generateQueryFromForm(formData);
      
      // Prepare preferences object
      const preferences = {
        duration: parseInt(formData.duration),
        budget: parseInt(formData.budget),
        interests: formData.interests,
        dietary: formData.dietary,
        transportation: formData.transportation,
        travelers: parseInt(formData.travelers),
        accommodation: formData.accommodation,
        startDate: formData.startDate
      };

      // Call the trip planning API
      const response = await tripApi.planTrip(query, preferences);
      
      // Call parent handlers
      onSubmit && onSubmit(formData);
      onPlanGenerated && onPlanGenerated(response);
      
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({ submit: "Failed to create trip plan. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateQueryFromForm = (data) => {
    const parts = [];
    
    parts.push(`Plan a ${data.duration}-day trip to ${data.destination}`);
    
    if (data.budget) {
      parts.push(`with a budget of ₹${data.budget}`);
    }
    
    if (data.travelers && data.travelers !== "1") {
      parts.push(`for ${data.travelers} travelers`);
    }
    
    if (data.interests.length > 0) {
      parts.push(`focusing on ${data.interests.join(", ")}`);
    }
    
    if (data.dietary.length > 0) {
      parts.push(`with ${data.dietary.join(" and ")} dietary preferences`);
    }
    
    if (data.startDate) {
      parts.push(`starting from ${new Date(data.startDate).toLocaleDateString()}`);
    }

    return parts.join(" ");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Form header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
        <h2 className="text-xl font-bold flex items-center">
          <MapPin className="mr-2" size={20} />
          Trip Planning Form
        </h2>
        <p className="text-green-100 mt-1">Fill in your preferences for a customized trip plan</p>
      </div>

      {/* Form content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline mr-1" size={16} />
            Destination *
          </label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleInputChange}
            placeholder="e.g., Kerala, Goa, Rajasthan..."
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.destination ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.destination && (
            <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
          )}
        </div>

        {/* Duration and Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              Duration (days) *
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="1"
              max="30"
              placeholder="e.g., 5"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.duration ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline mr-1" size={16} />
              Budget (₹) *
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              min="1000"
              placeholder="e.g., 25000"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.budget ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.budget && (
              <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
            )}
          </div>
        </div>

        {/* Travelers and Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline mr-1" size={16} />
              Number of Travelers
            </label>
            <select
              name="travelers"
              value={formData.travelers}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              Start Date (Optional)
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Heart className="inline mr-1" size={16} />
            Interests *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {interestOptions.map((interest) => (
              <button
                key={interest.id}
                type="button"
                onClick={() => handleMultiSelect("interests", interest.id)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  formData.interests.includes(interest.id)
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{interest.icon}</span>
                  <span className="text-sm font-medium">{interest.label}</span>
                </div>
              </button>
            ))}
          </div>
          {errors.interests && (
            <p className="mt-1 text-sm text-red-600">{errors.interests}</p>
          )}
        </div>

        {/* Transportation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Car className="inline mr-1" size={16} />
            Preferred Transportation *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {transportationOptions.map((transport) => (
              <button
                key={transport.id}
                type="button"
                onClick={() => handleMultiSelect("transportation", transport.id)}
                className={`p-3 text-center border rounded-lg transition-colors ${
                  formData.transportation.includes(transport.id)
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-xl mb-1">{transport.icon}</div>
                <div className="text-xs font-medium">{transport.label}</div>
              </button>
            ))}
          </div>
          {errors.transportation && (
            <p className="mt-1 text-sm text-red-600">{errors.transportation}</p>
          )}
        </div>

        {/* Dietary Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Utensils className="inline mr-1" size={16} />
            Dietary Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((diet) => (
              <button
                key={diet.id}
                type="button"
                onClick={() => handleMultiSelect("dietary", diet.id)}
                className={`px-4 py-2 text-sm border rounded-full transition-colors ${
                  formData.dietary.includes(diet.id)
                    ? "bg-orange-50 border-orange-500 text-orange-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {diet.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accommodation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accommodation Type
          </label>
          <select
            name="accommodation"
            value={formData.accommodation}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="hotel">Hotel</option>
            <option value="hostel">Hostel</option>
            <option value="resort">Resort</option>
            <option value="guesthouse">Guesthouse</option>
            <option value="homestay">Homestay</option>
            <option value="apartment">Apartment/Airbnb</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          {errors.submit && (
            <p className="mb-3 text-sm text-red-600 text-center">{errors.submit}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Creating Your Trip Plan...
              </div>
            ) : (
              "Create My Trip Plan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

export default TripPlannerForm;