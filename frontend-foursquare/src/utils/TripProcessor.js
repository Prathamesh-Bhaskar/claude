// src/utils/TripProcessor.js

/**
 * Extracts locations from the AI text response and generates a structured trip plan
 * @param {string} responseText - The text response from the API
 * @returns {Object} A structured trip plan object with coordinates
 */
export function processTripResponse(responseText) {
    // Extract locations mentioned in the response
    const locations = extractLocations(responseText);
    
    // Create a structured trip plan
    return createTripPlan(locations, responseText);
  }
  
  /**
   * Extract location names from the API response text
   */
  function extractLocations(text) {
    // Known Goa locations with their coordinates
    const knownLocations = {
      // North Goa
      "Anjuna": { lat: 15.5686, lng: 73.7408 },
      "Vagator": { lat: 15.5969, lng: 73.7445 },
      "Baga": { lat: 15.5566, lng: 73.7542 },
      "Calangute": { lat: 15.5440, lng: 73.7527 },
      "Chapora Fort": { lat: 15.6009, lng: 73.7369 },
      "Thalassa": { lat: 15.5975, lng: 73.7445 },
      "Ozran Beach": { lat: 15.5972, lng: 73.7396 },
      "Anjuna Flea Market": { lat: 15.5697, lng: 73.7399 },
      "Arpora": { lat: 15.5711, lng: 73.7664 },
      "Tito's Lane": { lat: 15.5575, lng: 73.7514 },
      "Curlies": { lat: 15.5698, lng: 73.7388 },
      
      // Central Goa
      "Old Goa": { lat: 15.5022, lng: 73.9129 },
      "Basilica of Bom Jesus": { lat: 15.5009, lng: 73.9126 },
      "Sé Cathedral": { lat: 15.5033, lng: 73.9114 },
      "Ponda": { lat: 15.4027, lng: 74.0138 },
      "Sahakari Spice Farm": { lat: 15.3969, lng: 74.0223 },
      
      // South Goa
      "Palolem": { lat: 15.0100, lng: 73.9973 },
      "Agonda": { lat: 15.0462, lng: 73.9856 },
      "Butterfly Beach": { lat: 15.0164, lng: 74.0073 },
      "Neptune's Point": { lat: 15.0098, lng: 74.0022 },
      
      // Airports
      "Dabolim Airport": { lat: 15.3803, lng: 73.8314 },
      "Mopa Airport": { lat: 15.7217, lng: 73.9172 }
    };
    
    // Extract days and locations
    const extractedLocations = [];
    
    // Check for Day sections
    const dayRegex = /Day\s+(\d+):.*?\((.*?)\)/g;
    let dayMatch;
    
    while ((dayMatch = dayRegex.exec(text)) !== null) {
      const dayNumber = parseInt(dayMatch[1]);
      const locations = dayMatch[2].split('/');
      
      locations.forEach(location => {
        const trimmedLocation = location.trim();
        if (knownLocations[trimmedLocation]) {
          extractedLocations.push({
            name: trimmedLocation,
            day: dayNumber,
            ...knownLocations[trimmedLocation],
            description: `Visit on Day ${dayNumber}`
          });
        }
      });
    }
    
    // If no days found in the usual format, extract all known locations
    if (extractedLocations.length === 0) {
      // Find all mentions of known locations
      Object.keys(knownLocations).forEach(locationName => {
        if (text.includes(locationName)) {
          // Try to determine which day it belongs to
          let day = 1;
          for (let i = 1; i <= 5; i++) {
            if (text.includes(`Day ${i}`) && 
                text.substring(text.indexOf(`Day ${i}`)).includes(locationName)) {
              day = i;
              break;
            }
          }
          
          extractedLocations.push({
            name: locationName,
            day: day,
            ...knownLocations[locationName],
            description: `Visit on Day ${day}`
          });
        }
      });
    }
    
    // Sort by day
    return extractedLocations.sort((a, b) => a.day - b.day);
  }
  
  /**
   * Create a structured trip plan from extracted locations
   */
  function createTripPlan(locations, responseText) {
    // Group locations by day
    const locationsByDay = {};
    
    locations.forEach(location => {
      if (!locationsByDay[location.day]) {
        locationsByDay[location.day] = [];
      }
      locationsByDay[location.day].push(location);
    });
    
    // Create days array
    const days = Object.keys(locationsByDay).map(day => {
      return {
        day: parseInt(day),
        title: `Day ${day}`,
        locations: locationsByDay[day].map(loc => {
          // Try to extract additional info about this location from the text
          const description = extractLocationDetails(responseText, loc.name);
          
          return {
            ...loc,
            description: description || loc.description,
            activities: extractActivities(responseText, loc.name),
            accommodation: extractAccommodation(responseText, loc.name, loc.day),
            food: extractFood(responseText, loc.name, loc.day)
          };
        })
      };
    });
    
    // Create the trip plan
    return {
      title: "Goa Trip",
      duration: `${days.length} days`,
      overview: "Experience the best of North and South Goa",
      days: days
    };
  }
  
  /**
   * Extract more detailed description for a location
   */
  function extractLocationDetails(text, locationName) {
    // Simple extraction - look for sentences containing the location name
    const sentences = text.split('. ');
    
    for (let sentence of sentences) {
      if (sentence.includes(locationName) && sentence.length > locationName.length + 10) {
        return sentence.trim() + '.';
      }
    }
    
    return null;
  }
  
  /**
   * Extract potential activities for a location
   */
  function extractActivities(text, locationName) {
    const activities = [];
    
    // Common activities in Goa
    const potentialActivities = [
      'swimming', 'sunset', 'sunrise', 'party', 'nightlife', 
      'water sports', 'parasailing', 'jet-skiing', 'dolphin', 'kayaking',
      'shopping', 'market', 'tour', 'cruise', 'boat trip'
    ];
    
    // Find sentences containing the location name
    const sentences = text.split('. ');
    const relevantSentences = sentences.filter(s => s.includes(locationName));
    
    // Check for activities in those sentences
    relevantSentences.forEach(sentence => {
      potentialActivities.forEach(activity => {
        if (sentence.toLowerCase().includes(activity) && !activities.includes(activity)) {
          activities.push(activity.charAt(0).toUpperCase() + activity.slice(1));
        }
      });
    });
    
    return activities;
  }
  
  /**
   * Extract potential accommodation info
   */
  function extractAccommodation(text, locationName, day) {
    // List of accommodation keywords
    const accommodationKeywords = ['hotel', 'resort', 'stay', 'beach hut', 'accommodation'];
    
    // Find sentences about staying in this location
    const sentences = text.split('. ');
    
    for (let sentence of sentences) {
      if (sentence.includes(locationName) && 
          accommodationKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        return `Accommodation near ${locationName}`;
      }
    }
    
    // Return generic accommodation based on the region
    if (['Anjuna', 'Vagator', 'Baga', 'Calangute'].includes(locationName)) {
      return 'North Goa Hotel';
    } else if (['Palolem', 'Agonda'].includes(locationName)) {
      return 'South Goa Beach Hut';
    }
    
    return null;
  }
  
  /**
   * Extract potential food recommendations
   */
  function extractFood(text, locationName, day) {
    // List of food-related keywords
    const foodKeywords = ['restaurant', 'eat', 'dinner', 'lunch', 'breakfast', 'food', 'cuisine'];
    
    // Find sentences about food in this location
    const sentences = text.split('. ');
    
    for (let sentence of sentences) {
      if (sentence.includes(locationName) && 
          foodKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        // Extract restaurant names - they're often in quotes or bold
        const restaurantMatch = sentence.match(/"([^"]+)"|Thalassa|Brittos|St\. Anthony's|Curlies/);
        if (restaurantMatch) {
          return restaurantMatch[1] || restaurantMatch[0];
        }
        return `Local restaurant in ${locationName}`;
      }
    }
    
    // Return generic food recommendation based on the region
    if (['Anjuna', 'Vagator', 'Baga', 'Calangute'].includes(locationName)) {
      return 'Beachside Seafood';
    } else if (['Palolem', 'Agonda'].includes(locationName)) {
      return 'Authentic Goan Curry';
    }
    
    return null;
  }
  
  // Default export
  export default { processTripResponse };