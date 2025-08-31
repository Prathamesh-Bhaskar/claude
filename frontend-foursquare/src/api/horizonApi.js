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
  
  // Get trip plan data by ID
  getTripById: (tripId) => {
    return apiRequest(`/trip/${tripId}`, 'GET');
  },
  
  // Update an existing trip plan
  updateTrip: (tripId, updates) => {
    return apiRequest(`/trip/${tripId}`, 'PATCH', updates);
  },
  
  // Generate image for a location using Wikipedia or other services
  getLocationImage: async (locationName) => {
    try {
      const response = await apiRequest('/trip/location/image', 'POST', { 
        location_name: locationName 
      });
      return response.image_url;
    } catch (error) {
      console.error('Error fetching location image:', error);
      // Fallback to direct Wikipedia API if backend fails
      try {
        const wikiResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(locationName)}`
        );
        if (wikiResponse.ok) {
          const data = await wikiResponse.json();
          return data.thumbnail?.source || null;
        }
      } catch (wikiError) {
        console.error('Wikipedia fallback failed:', wikiError);
      }
      return null;
    }
  }
};

/**
 * Routing API
 */
export const routeApi = {
  // Optimize a route between multiple locations
  optimizeRoute: (locations, mode = 'car', startLocation = null) => {
    // Format locations to match expected API format
    const formattedLocations = locations.map(loc => ({
      name: loc.name || loc.city || '',
      lat: loc.lat,
      lng: loc.lng,
      description: loc.description || '',
      day: loc.day || null
    }));
    
    return apiRequest('/trip/optimize', 'POST', { 
      locations: formattedLocations, 
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
  },
  
  // Get detailed route between two points with path geometry
  getRoutePath: (origin, destination, mode = 'car') => {
    return apiRequest('/route/path', 'POST', {
      origin,
      destination,
      mode
    });
  },
  
  // Get detailed multi-stop route with waypoints for a complete trip
  getMultiStopRoute: (waypoints, mode = 'car') => {
    return apiRequest('/route/multi-stop', 'POST', {
      waypoints,
      mode
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
  },
  
  // Get points of interest near a location
  getNearbyAttractions: (location, radius = 5, categories = [], limit = 10) => {
    return apiRequest('/recommendations/nearby', 'POST', {
      location,
      radius,
      categories,
      limit
    });
  },
  
  // Get top attractions for a destination
  getTopAttractions: (destination, count = 10) => {
    return apiRequest('/recommendations/top-attractions', 'POST', {
      destination,
      count
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
  },
  
  // Get hotel details by ID
  getHotelDetails: (hotelId) => {
    return apiRequest(`/booking/hotel/${hotelId}`, 'GET');
  },
  
  // Get hotel options for each day of a trip
  getTripAccommodations: (tripId, preferences = {}) => {
    return apiRequest('/booking/trip-accommodations', 'POST', {
      trip_id: tripId,
      preferences
    });
  }
};

/**
 * Map API for map-related operations
 */
export const mapApi = {
  // Get geocoding information for a location name
  geocode: (locationName) => {
    return apiRequest('/map/geocode', 'POST', { location: locationName });
  },
  
  // Reverse geocode from coordinates to address
  reverseGeocode: (lat, lng) => {
    return apiRequest('/map/reverse-geocode', 'POST', { lat, lng });
  },
  
  // Get points of interest for a map view
  getPOIs: (bounds, filters = {}) => {
    return apiRequest('/map/pois', 'POST', { 
      bounds,
      filters 
    });
  },
  
  // Get all trip-related locations for map display
  getTripMapData: (tripId) => {
    return apiRequest(`/map/trip/${tripId}`, 'GET');
  }
};

// Export all APIs as a unified object
export default {
  trip: tripApi,
  route: routeApi,
  recommendation: recommendationApi,
  booking: bookingApi,
  map: mapApi
};