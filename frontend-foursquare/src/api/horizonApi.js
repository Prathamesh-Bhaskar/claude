// src/api/horizonApi.js
// This file serves as the central API client for the Horizon backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic API request handler with error handling
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
    const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },  
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Trip Planning API
 */
export const tripApi = {
  // Create a new trip plan based on natural language input and preferences
  planTrip: (query, preferences) => {
    return apiRequest('/trip/plan', 'POST', { query, preferences });
  },
  
  // Send a message to the AI chat assistant
  sendChatMessage: (message, conversationHistory = [], tripId = null) => {
    return apiRequest('/chat/message', 'POST', { 
      message, 
      conversation_history: conversationHistory,
      trip_id: tripId
    });
  },
};

/**
 * Routing API
 */
export const routeApi = {
  // Optimize a route between multiple locations
  optimizeRoute: (locations, mode = 'car', startLocation = null) => {
    return apiRequest('/trip/optimize', 'POST', { 
      locations, 
      mode,
      start_location: startLocation
    });
  },
  
  // Get transportation options between two locations
  getTransportation: (origin, destination, date) => {
    return apiRequest('/route/transportation', 'POST', {
      origin,
      destination,
      date
    });
  }
};

/**
 * Recommendations API
 */
export const recommendationApi = {
  // Get personalized recommendations based on location and preferences
  getRecommendations: (location, preferences, tripContext, count = 5) => {
    return apiRequest('/recommendations', 'POST', {
      location,
      preferences,
      trip_context: tripContext,
      count
    });
  },
  
  // Get weather information for a location
  getWeather: (location, date) => {
    return apiRequest('/recommendations/weather', 'POST', {
      location,
      date
    });
  }
};

/**
 * Booking API
 */
export const bookingApi = {
  // Get accommodation options
  getAccommodations: (location, checkIn, checkOut, guests, rooms = 1, preferences = {}) => {
    return apiRequest('/booking/accommodation', 'POST', {
      location,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      rooms,
      preferences
    });
  },
  
  // Get transportation booking options
  getTransportBooking: (origin, destination, date, passengers, mode, travelClass) => {
    return apiRequest('/booking/transport', 'POST', {
      origin,
      destination,
      date,
      passengers,
      mode,
      class: travelClass
    });
  },
  
  // Get restaurant recommendations and booking options
  getRestaurants: (location, date, time, guests, preferences = {}) => {
    return apiRequest('/booking/food', 'POST', {
      location,
      date,
      time,
      guests,
      preferences
    });
  }
};

// Export all APIs as a unified object
export default {
  trip: tripApi,
  route: routeApi,
  recommendation: recommendationApi,
  booking: bookingApi
};