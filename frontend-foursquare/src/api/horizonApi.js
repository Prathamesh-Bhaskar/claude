// Enhanced horizonApi.js - Unified API client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic API request handler with enhanced error handling and retry logic
 */
async function apiRequest(endpoint, method = 'GET', data = null, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const { timeout = 30000, retries = 1 } = options;
  
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    signal: AbortSignal.timeout(timeout)
  };

  if (data) {
    requestOptions.body = JSON.stringify(data);
  }

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`API Request [${method}] ${url}`, data ? { data } : '');
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`API Response [${method}] ${url}`, result);
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`API request failed (attempt ${attempt + 1}/${retries + 1}):`, error);
      
      // Don't retry on client errors (4xx) or aborts
      if (error.name === 'AbortError' || (error.message && error.message.includes('status 4'))) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

/**
 * Enhanced Trip Planning API
 */
export const tripApi = {
  /**
   * Create a new trip plan based on natural language input and preferences
   * @param {string} query - Natural language description of the trip
   * @param {Object} preferences - Trip preferences and constraints
   * @returns {Promise<Object>} Trip plan with days, locations, and activities
   */
  planTrip: async (query, preferences = {}) => {
    try {
      const requestData = {
        query: query.trim(),
        preferences: {
          duration: 5,
          budget: 20000,
          interests: ["nature", "culture", "food"],
          dietary: ["vegetarian"],
          transportation: ["train", "bus"],
          travelers: 2,
          accommodation: "hotel",
          ...preferences
        }
      };

      const response = await apiRequest('/trip/plan', 'POST', requestData, {
        timeout: 45000, // Trip planning can take longer
        retries: 2
      });

      // Validate response structure
      if (!response || !response.days || !Array.isArray(response.days)) {
        throw new Error('Invalid trip plan response format');
      }

      // Ensure each day has required fields
      response.days = response.days.map((day, index) => ({
        day: day.day || (index + 1),
        title: day.title || `Day ${index + 1}`,
        description: day.description || '',
        locations: Array.isArray(day.locations) ? day.locations.map(loc => ({
          name: loc.name || 'Unknown Location',
          description: loc.description || '',
          lat: loc.lat || 0,
          lng: loc.lng || 0,
          activities: Array.isArray(loc.activities) ? loc.activities : [],
          duration: loc.duration || '2-3 hours',
          cost_estimate: loc.cost_estimate || 'N/A'
        })) : []
      }));

      return response;
    } catch (error) {
      console.error('Trip planning API error:', error);
      throw new Error(`Failed to create trip plan: ${error.message}`);
    }
  },

  /**
   * Send a message to the AI chat assistant
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous conversation context
   * @param {string} tripId - Optional trip ID for context
   * @returns {Promise<Object>} AI response with additional metadata
   */
  sendChatMessage: async (message, conversationHistory = [], tripId = null) => {
    try {
      const requestData = {
        message: message.trim(),
        conversation_history: conversationHistory.slice(-10), // Keep last 10 messages for context
        trip_id: tripId
      };

      const response = await apiRequest('/chat/message', 'POST', requestData, {
        timeout: 20000,
        retries: 2
      });

      // Ensure response has required structure
      const normalizedResponse = {
        response: response.response || response.message || 'I apologize, but I cannot provide a response right now.',
        actionable: response.actionable || false,
        action_type: response.action_type || null,
        confidence: response.confidence || 0.8,
        suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
        metadata: response.metadata || {}
      };

      return normalizedResponse;
    } catch (error) {
      console.error('Chat API error:', error);
      
      // Provide fallback response for chat failures
      return {
        response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        actionable: false,
        action_type: null,
        confidence: 0,
        suggestions: [],
        error: true,
        metadata: { error: error.message }
      };
    }
  },

  /**
   * Get trip plan data by ID
   * @param {string} tripId - Trip identifier
   * @returns {Promise<Object>} Trip plan data
   */
  getTripById: async (tripId) => {
    try {
      return await apiRequest(`/trip/${tripId}`, 'GET');
    } catch (error) {
      console.error('Get trip API error:', error);
      throw new Error(`Failed to fetch trip: ${error.message}`);
    }
  },

  /**
   * Update an existing trip plan
   * @param {string} tripId - Trip identifier
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated trip plan
   */
  updateTrip: async (tripId, updates) => {
    try {
      return await apiRequest(`/trip/${tripId}`, 'PATCH', updates);
    } catch (error) {
      console.error('Update trip API error:', error);
      throw new Error(`Failed to update trip: ${error.message}`);
    }
  },

  /**
   * Generate image for a location
   * @param {string} locationName - Name of the location
   * @param {Object} options - Image generation options
   * @returns {Promise<Object>} Image data or URL
   */
  generateLocationImage: async (locationName, options = {}) => {
    try {
      const requestData = {
        location: locationName,
        ...options
      };
      
      return await apiRequest('/images/location', 'POST', requestData);
    } catch (error) {
      console.error('Image generation API error:', error);
      // Return fallback/placeholder image data
      return {
        url: `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent(locationName)}`,
        source: 'placeholder',
        error: true
      };
    }
  },

  /**
   * Get destination suggestions based on preferences
   * @param {Object} preferences - User preferences for suggestions
   * @returns {Promise<Array>} Array of destination suggestions
   */
  getDestinationSuggestions: async (preferences = {}) => {
    try {
      return await apiRequest('/destinations/suggest', 'POST', preferences);
    } catch (error) {
      console.error('Destination suggestions API error:', error);
      // Return fallback suggestions
      return [
        { name: "Kerala", type: "nature", description: "God's Own Country" },
        { name: "Goa", type: "beaches", description: "Sun, Sand & Sea" },
        { name: "Rajasthan", type: "culture", description: "Land of Kings" }
      ];
    }
  },

  /**
   * Get travel recommendations for a specific location
   * @param {string} location - Location name
   * @param {Object} filters - Filters for recommendations
   * @returns {Promise<Object>} Recommendations data
   */
  getLocationRecommendations: async (location, filters = {}) => {
    try {
      const requestData = {
        location,
        filters
      };
      
      return await apiRequest('/recommendations/location', 'POST', requestData);
    } catch (error) {
      console.error('Location recommendations API error:', error);
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  },

  /**
   * Save trip plan (for user accounts)
   * @param {Object} tripPlan - Trip plan to save
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Save confirmation
   */
  saveTripPlan: async (tripPlan, userId = null) => {
    try {
      const requestData = {
        trip_plan: tripPlan,
        user_id: userId
      };
      
      return await apiRequest('/trip/save', 'POST', requestData);
    } catch (error) {
      console.error('Save trip API error:', error);
      throw new Error(`Failed to save trip: ${error.message}`);
    }
  },

  /**
   * Get user's saved trips
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} Array of saved trips
   */
  getUserTrips: async (userId) => {
    try {
      return await apiRequest(`/user/${userId}/trips`, 'GET');
    } catch (error) {
      console.error('Get user trips API error:', error);
      return [];
    }
  },

  /**
   * Export trip plan in various formats
   * @param {string} tripId - Trip identifier
   * @param {string} format - Export format (pdf, json, ical)
   * @returns {Promise<Blob|Object>} Export data
   */
  exportTrip: async (tripId, format = 'json') => {
    try {
      const response = await fetch(`${API_BASE_URL}/trip/${tripId}/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'pdf' ? 'application/pdf' : 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      if (format === 'pdf') {
        return await response.blob();
      } else {
        return await response.json();
      }
    } catch (error) {
      console.error('Export trip API error:', error);
      throw new Error(`Failed to export trip: ${error.message}`);
    }
  },

  /**
   * Get weather information for locations in trip
   * @param {Array} locations - Array of location objects with lat/lng
   * @param {Date} startDate - Trip start date
   * @returns {Promise<Object>} Weather data for locations
   */
  getWeatherInfo: async (locations, startDate = new Date()) => {
    try {
      const requestData = {
        locations,
        start_date: startDate.toISOString()
      };
      
      return await apiRequest('/weather/forecast', 'POST', requestData);
    } catch (error) {
      console.error('Weather API error:', error);
      // Return default weather data
      return {
        forecast: locations.map(loc => ({
          location: loc.name,
          weather: "Pleasant",
          temperature: "20-25°C",
          conditions: "Clear skies"
        }))
      };
    }
  }
};

/**
 * Utility functions
 */
export const apiUtils = {
  /**
   * Check if API is available
   * @returns {Promise<boolean>} True if API is responding
   */
  healthCheck: async () => {
    try {
      await apiRequest('/health', 'GET', null, { timeout: 5000, retries: 0 });
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get API version and status
   * @returns {Promise<Object>} API information
   */
  getApiInfo: async () => {
    try {
      return await apiRequest('/info', 'GET');
    } catch (error) {
      return { version: 'unknown', status: 'error' };
    }
  },

  /**
   * Format error messages for user display
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  formatError: (error) => {
    if (error.name === 'AbortError') {
      return "Request timed out. Please try again.";
    }
    
    if (error.message.includes('Failed to fetch')) {
      return "Cannot connect to server. Please check your internet connection.";
    }
    
    if (error.message.includes('status 429')) {
      return "Too many requests. Please wait a moment and try again.";
    }
    
    if (error.message.includes('status 5')) {
      return "Server error. Please try again later.";
    }
    
    return error.message || "An unexpected error occurred.";
  }
};

/**
 * Booking API for accommodation, transport, and restaurant bookings
 */
export const bookingApi = {
  /**
   * Get accommodation options for a location
   * @param {Object} location - Location object with name, lat, lng
   * @param {string} checkIn - Check-in date (YYYY-MM-DD)
   * @param {string} checkOut - Check-out date (YYYY-MM-DD)
   * @param {Object} guests - Guest information
   * @param {number} rooms - Number of rooms
   * @param {Object} preferences - Booking preferences
   * @returns {Promise<Object>} Accommodation options
   */
  getAccommodations: async (location, checkIn, checkOut, guests, rooms, preferences) => {
    try {
      const requestData = {
        location,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        rooms,
        preferences
      };
      
      return await apiRequest('/booking/accommodation', 'POST', requestData);
    } catch (error) {
      console.error('Accommodation API error:', error);
      // Return mock data
      return {
        accommodation_options: [
          {
            id: 1,
            name: "Grand Hotel",
            type: "hotel",
            rating: 4.5,
            price: "₹5,000/night",
            amenities: ["wifi", "breakfast", "pool"],
            location: location.name,
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
          },
          {
            id: 2,
            name: "Comfort Inn",
            type: "hotel",
            rating: 4.2,
            price: "₹3,500/night",
            amenities: ["wifi", "breakfast"],
            location: location.name,
            image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400"
          }
        ]
      };
    }
  },

  /**
   * Get transport booking options
   * @param {Object} origin - Origin location
   * @param {Object} destination - Destination location
   * @param {string} date - Travel date (YYYY-MM-DD)
   * @param {number} passengers - Number of passengers
   * @param {string} mode - Transport mode
   * @param {string} class - Travel class
   * @returns {Promise<Object>} Transport options
   */
  getTransportBooking: async (origin, destination, date, passengers, mode, travelClass) => {
    try {
      const requestData = {
        origin,
        destination,
        date,
        passengers,
        mode,
        class: travelClass
      };
      
      return await apiRequest('/booking/transport', 'POST', requestData);
    } catch (error) {
      console.error('Transport API error:', error);
      // Return mock data
      return {
        train_options: [
          {
            id: 1,
            train_number: "12345",
            train_name: "Express Train",
            departure: "08:00",
            arrival: "12:00",
            duration: "4h",
            price: "₹800",
            class: travelClass,
            available_seats: 45
          },
          {
            id: 2,
            train_number: "67890",
            train_name: "Superfast Express",
            departure: "14:30",
            arrival: "18:30",
            duration: "4h",
            price: "₹1,200",
            class: travelClass,
            available_seats: 23
          }
        ]
      };
    }
  },

  /**
   * Get restaurant options for a location
   * @param {Object} location - Location object
   * @param {string} date - Booking date (YYYY-MM-DD)
   * @param {string} time - Booking time (HH:MM)
   * @param {number} guests - Number of guests
   * @param {Object} preferences - Dining preferences
   * @returns {Promise<Object>} Restaurant options
   */
  getRestaurants: async (location, date, time, guests, preferences) => {
    try {
      const requestData = {
        location,
        date,
        time,
        guests,
        preferences
      };
      
      return await apiRequest('/booking/restaurants', 'POST', requestData);
    } catch (error) {
      console.error('Restaurant API error:', error);
      // Return mock data
      return {
        restaurants: [
          {
            id: 1,
            name: "Spice Garden",
            cuisine: "Indian",
            rating: 4.3,
            price_range: "₹₹",
            available_times: ["19:00", "19:30", "20:00"],
            location: location.name,
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"
          },
          {
            id: 2,
            name: "Taste of India",
            cuisine: "Indian",
            rating: 4.1,
            price_range: "₹",
            available_times: ["18:30", "19:00", "19:30"],
            location: location.name,
            image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400"
          }
        ]
      };
    }
  }
};

/**
 * Route optimization API
 */
export const routeApi = {
  /**
   * Optimize route between multiple locations
   * @param {Array} locations - Array of location objects
   * @param {string} transportMode - Transport mode (car, train, bus, walking)
   * @returns {Promise<Object>} Optimized route
   */
  optimizeRoute: async (locations, transportMode) => {
    try {
      const requestData = {
        locations,
        transport_mode: transportMode
      };
      
      return await apiRequest('/route/optimize', 'POST', requestData);
    } catch (error) {
      console.error('Route API error:', error);
      // Return the original locations as fallback
      return {
        optimized_route: locations
      };
    }
  }
};

/**
 * Recommendation API
 */
export const recommendationApi = {
  /**
   * Get recommendations for a location
   * @param {Object} location - Location object
   * @param {Array} interests - User interests
   * @returns {Promise<Object>} Recommendations
   */
  getRecommendations: async (location, interests = []) => {
    try {
      const requestData = {
        location,
        interests
      };
      
      return await apiRequest('/recommendations', 'POST', requestData);
    } catch (error) {
      console.error('Recommendation API error:', error);
      // Return mock recommendations
      return {
        recommendations: [
          {
            id: 1,
            name: "Popular Attraction",
            type: "attraction",
            rating: 4.5,
            description: "A must-visit place in the area"
          },
          {
            id: 2,
            name: "Local Restaurant",
            type: "restaurant",
            rating: 4.2,
            description: "Great local cuisine"
          }
        ]
      };
    }
  }
};

export default tripApi;