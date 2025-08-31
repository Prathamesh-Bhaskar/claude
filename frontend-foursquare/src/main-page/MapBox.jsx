// src/main-page/MapBox.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { routeApi, recommendationApi, bookingApi } from "../api/horizonApi";
import { Hotel, MapPin, UtensilsCrossed, Camera, Landmark, Car, Train, Bus, User } from "lucide-react";

// Component to auto-update the map view when locations change
function MapController({ locations }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      // Create bounds that include all locations
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      
      // Fit the map to these bounds with some padding
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

// Create custom icon for a location with photo
const createPhotoIcon = (photoUrl) =>
  L.icon({
    iconUrl: photoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
    iconSize: [50, 50],
    className: "rounded-full border-2 border-white shadow-lg"
  });

// Create custom icon for different POI types
const createPoiIcon = (type) => {
  // Define icon colors based on POI type
  const colors = {
    attraction: "#FF5722", // Orange
    restaurant: "#4CAF50", // Green
    hotel: "#2196F3",      // Blue
    landmark: "#9C27B0",   // Purple
    transport: "#FFC107"   // Amber
  };
  
  // Get color based on type
  const color = colors[type] || "#607D8B"; // Default gray
  
  // Create custom icon HTML
  let html;
  switch (type) {
    case 'hotel':
      html = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2" style="border-color:${color}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>`;
      break;
    case 'restaurant':
      html = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2" style="border-color:${color}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
              </div>`;
      break;
    case 'attraction':
      html = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2" style="border-color:${color}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                </svg>
              </div>`;
      break;
    case 'landmark':
      html = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2" style="border-color:${color}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
              </div>`;
      break;
    default:
      html = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2" style="border-color:${color}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>`;
  }
  
  return L.divIcon({
    html: html,
    className: "custom-poi-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
};

export default function MapBox({ initialLocations = [], tripPlan = null }) {
  // Debug logs
  console.log("MapBox rendering with:", { initialLocations, tripPlan });
  
  // Main states
  const [locations, setLocations] = useState(initialLocations);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transportMode, setTransportMode] = useState("car");
  
  // POI states
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  
  // Filter states
  const [showAttractions, setShowAttractions] = useState(true);
  const [showHotels, setShowHotels] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  
  // Set default position to center of India
  const defaultPosition = [22.9734, 78.6569];
  
  // Process trip plan when it changes
  useEffect(() => {
    console.log("Processing trip plan:", tripPlan);
    
    if (tripPlan && tripPlan.days) {
      try {
        // Extract locations from trip plan
        const newLocations = [];
        const newHotels = [];
        const newRestaurants = [];
        
        tripPlan.days.forEach(day => {
          if (day.locations && day.locations.length > 0) {
            day.locations.forEach(location => {
              // Add to main locations
              newLocations.push({
                name: location.name,
                lat: location.lat,
                lng: location.lng,
                description: location.description || "",
                day: day.day,
                activities: location.activities || []
              });
              
              // Check for accommodation info
              if (location.accommodation) {
                newHotels.push({
                  name: location.accommodation,
                  lat: location.lat + (Math.random() * 0.01 - 0.005), // Slight offset to avoid overlap
                  lng: location.lng + (Math.random() * 0.01 - 0.005),
                  day: day.day,
                  type: "hotel",
                  price: location.accommodation_cost || "N/A"
                });
              }
              
              // Check for food info
              if (location.food) {
                newRestaurants.push({
                  name: location.food,
                  lat: location.lat + (Math.random() * 0.01 - 0.005), // Slight offset
                  lng: location.lng + (Math.random() * 0.01 - 0.005),
                  day: day.day,
                  type: "restaurant",
                  cuisine: location.cuisine || "Local cuisine"
                });
              }
            });
          }
        });
        
        console.log("Extracted locations:", newLocations);
        
        if (newLocations.length > 0) {
          setLocations(newLocations);
          setHotels(newHotels);
          setRestaurants(newRestaurants);
          
          // Get nearby attractions for each location
          fetchNearbyAttractions(newLocations);
          
          // Optimize the route
          optimizeRoute(newLocations);
        } else {
          console.warn("No locations found in trip plan days");
          
          // Use fallback if no locations found in trip plan
          if (initialLocations && initialLocations.length > 0) {
            console.log("Using initialLocations as fallback");
            setLocations(initialLocations);
            
            // Hard-coded route for demonstration
            setOptimizedRoute(initialLocations);
          } else {
            // Create some default demo locations if nothing else is available
            console.log("Using default demo locations");
            const defaultLocations = [
              { name: "Delhi", lat: 28.6139, lng: 77.209, description: "Capital city" },
              { name: "Agra", lat: 27.1751, lng: 78.0421, description: "Home of the Taj Mahal" },
              { name: "Jaipur", lat: 26.9124, lng: 75.7873, description: "The Pink City" }
            ];
            setLocations(defaultLocations);
            
            // Set default route
            setOptimizedRoute(defaultLocations);
          }
        }
      } catch (error) {
        console.error("Error processing trip plan:", error);
        // Fallback to initialLocations if there's an error
        setLocations(initialLocations);
        setOptimizedRoute(initialLocations);
      }
    } else {
      console.log("No valid trip plan, using initialLocations");
      // If no trip plan provided, use initialLocations
      setLocations(initialLocations);
      setOptimizedRoute(initialLocations);
    }
  }, [tripPlan, initialLocations]);
  
  // Fetch nearby attractions for all locations
  const fetchNearbyAttractions = async (locs) => {
    if (!locs || locs.length === 0) return;
    
    try {
      console.log("Generating attractions for locations:", locs);
      
      // For demo/development purposes, generate mock attractions
      // In a real implementation, you would call the API
      const newAttractions = [];
      
      locs.forEach((loc, index) => {
        // Generate 2-3 attractions near each main location
        const numAttractions = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < numAttractions; i++) {
          // Generate a random offset (within ~1-2km)
          const latOffset = (Math.random() * 0.02 - 0.01);
          const lngOffset = (Math.random() * 0.02 - 0.01);
          
          // Example attraction types
          const attractionTypes = ["Museum", "Park", "Temple", "Historic Site"];
          
          // Create a mock attraction
          const attraction = {
            name: `${attractionTypes[i % attractionTypes.length]} near ${loc.name}`,
            lat: loc.lat + latOffset,
            lng: loc.lng + lngOffset,
            description: `A popular attraction near ${loc.name}.`,
            type: "attraction",
            day: loc.day,
            rating: (3 + Math.random() * 2).toFixed(1), // Random rating between 3-5
            estimatedTime: `${Math.floor(Math.random() * 3) + 1} hours`
          };
          
          newAttractions.push(attraction);
        }
      });
      
      console.log("Generated attractions:", newAttractions);
      setAttractions(newAttractions);
      
    } catch (error) {
      console.error("Failed to fetch attractions:", error);
    }
  };
  
  // Optimize route when locations or transport mode changes
  const optimizeRoute = async (locs = locations) => {
    console.log("Optimizing route for locations:", locs);
    
    if (!locs || locs.length < 2) {
      console.log("Not enough locations to optimize route");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simple ordering by day number first, then by original order
      const sortedByDay = [...locs].sort((a, b) => {
        // If both have day values, sort by day
        if (a.day && b.day) {
          return a.day - b.day;
        }
        // If only one has day value, put the one with day first
        if (a.day) return -1;
        if (b.day) return 1;
        // Otherwise keep original order
        return 0;
      });
      
      console.log("Sorted locations by day:", sortedByDay);
      setOptimizedRoute(sortedByDay);
      
      // API call is optional - if it fails, we already have the day-sorted route
      try {
        // This is where you would call the API in a real implementation
        // For now, we'll just use the day-sorted route
        /*
        const response = await routeApi.optimizeRoute(locs, transportMode);
        if (response && response.optimized_route) {
          setOptimizedRoute(response.optimized_route);
        }
        */
      } catch (apiError) {
        console.warn("API optimization skipped:", apiError);
        // We already set the sorted route as a fallback above
      }
    } catch (error) {
      console.error("Failed to optimize route:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle transport mode change
  const handleModeChange = (mode) => {
    setTransportMode(mode);
    optimizeRoute();
  };
  
  // Toggle filters for different POI types
  const toggleAttractions = () => setShowAttractions(!showAttractions);
  const toggleHotels = () => setShowHotels(!showHotels);
  const toggleRestaurants = () => setShowRestaurants(!showRestaurants);
  
  // Prepare route line for the map with validation
  let routeLine = [];
  if (optimizedRoute.length > 0) {
    routeLine = optimizedRoute.map(loc => {
      // Validate coordinates to ensure they are numbers
      const lat = parseFloat(loc.lat);
      const lng = parseFloat(loc.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates in optimizedRoute:", loc);
        return null;
      }
      
      return [lat, lng];
    }).filter(point => point !== null);
  } else if (locations.length > 0) {
    routeLine = locations.map(loc => {
      // Validate coordinates to ensure they are numbers
      const lat = parseFloat(loc.lat);
      const lng = parseFloat(loc.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates in locations:", loc);
        return null;
      }
      
      return [lat, lng];
    }).filter(point => point !== null);
  }
  
  // If all points failed validation, create a simple demo route
  if (routeLine.length < 2) {
    console.warn("Route line too short, using fallback route");
    routeLine = [
      [28.6139, 77.209],   // Delhi
      [27.1751, 78.0421],  // Agra
      [26.9124, 75.7873]   // Jaipur
    ];
  }
  
  // Debug the route line
  console.log("Final route line points:", routeLine);
  
  // Get transport mode icon
  const getTransportIcon = () => {
    switch(transportMode) {
      case 'car': return <Car className="mr-1" size={14} />;
      case 'train': return <Train className="mr-1" size={14} />;
      case 'bus': return <Bus className="mr-1" size={14} />;
      case 'walking': return <User className="mr-1" size={14} />;
      default: return <Car className="mr-1" size={14} />;
    }
  };
  
  // Get transport mode color
  const getTransportColor = () => {
    switch(transportMode) {
      case 'car': return 'blue';
      case 'train': return 'red';
      case 'bus': return 'green';
      case 'walking': return 'purple';
      default: return 'blue';
    }
  };
  
  return (
    <div className="relative w-full h-[700px]">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10 flex items-center justify-center text-white">
          <div className="bg-orange-500 px-6 py-3 rounded-lg shadow-lg">
            Optimizing your route...
          </div>
        </div>
      )}
      
      {/* Map controls - transport mode */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2">
        {["car", "train", "bus", "walking"].map(mode => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`px-3 py-1 rounded flex items-center ${
              transportMode === mode 
                ? "bg-orange-500 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {mode === 'car' && <Car className="mr-1" size={14} />}
            {mode === 'train' && <Train className="mr-1" size={14} />}
            {mode === 'bus' && <Bus className="mr-1" size={14} />}
            {mode === 'walking' && <User className="mr-1" size={14} />}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Map filters */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
        <div className="text-sm font-medium text-gray-700 mb-1">Show on map:</div>
        <button
          onClick={toggleAttractions}
          className={`px-3 py-1 rounded flex items-center ${
            showAttractions 
              ? "bg-orange-500 text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Camera className="mr-1" size={14} />
          Attractions
        </button>
        <button
          onClick={toggleHotels}
          className={`px-3 py-1 rounded flex items-center ${
            showHotels 
              ? "bg-orange-500 text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Hotel className="mr-1" size={14} />
          Hotels
        </button>
        <button
          onClick={toggleRestaurants}
          className={`px-3 py-1 rounded flex items-center ${
            showRestaurants 
              ? "bg-orange-500 text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <UtensilsCrossed className="mr-1" size={14} />
          Restaurants
        </button>
      </div>
      
      {/* Route info */}
      {routeLine.length > 1 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center text-sm font-medium text-gray-700">
            {getTransportIcon()}
            {transportMode.charAt(0).toUpperCase() + transportMode.slice(1)} Route
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {routeLine.length} stops · Est. distance: {(routeLine.length * 50).toFixed(0)} km
          </div>
        </div>
      )}
      
      {/* Map container */}
      <MapContainer
        center={
          locations.length > 0 
            ? [locations[0].lat, locations[0].lng] 
            : defaultPosition
        }
        zoom={5}
        className="w-full h-full border border-gray-300 rounded-2xl shadow-2xl"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Auto-adjust map view when locations change */}
        <MapController 
          locations={[
            ...locations,
            ...(showAttractions ? attractions : []),
            ...(showHotels ? hotels : []),
            ...(showRestaurants ? restaurants : [])
          ]} 
        />
        
        {/* Basic route line - simplified for debugging */}
        {routeLine.length > 1 && (
          <Polyline 
            positions={routeLine} 
            color="blue" 
            weight={5} 
          />
        )}
        
        {/* Debug markers for route points */}
        {routeLine.map((position, index) => (
          <Marker
            key={`debug-marker-${index}`}
            position={position}
          >
            <Popup>
              <div>
                <h3 className="font-bold">Point {index + 1}</h3>
                <p>Lat: {position[0]}</p>
                <p>Lng: {position[1]}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render main itinerary locations */}
        {locations.map((loc, index) => (
          <Marker
            key={`location-${index}`}
            position={[loc.lat, loc.lng]}
            icon={createPhotoIcon(loc.photo)}
          >
            <Popup className="location-popup">
              <div className="text-center">
                <h3 className="font-bold text-lg">{loc.name}</h3>
                {loc.day && (
                  <div className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full mt-1">
                    Day {loc.day}
                  </div>
                )}
                {loc.description && (
                  <p className="text-sm mt-2 text-gray-700">{loc.description}</p>
                )}
                {loc.activities && loc.activities.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Activities:</p>
                    <ul className="text-xs text-gray-600 mt-1">
                      {loc.activities.map((activity, i) => (
                        <li key={i} className="mb-1">• {activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -20]} opacity={0.7} permanent>
              <span className="font-medium">{loc.name}</span>
            </Tooltip>
          </Marker>
        ))}
        
        {/* Render attractions if filter is on */}
        {showAttractions && attractions.map((attraction, index) => (
          <Marker
            key={`attraction-${index}`}
            position={[attraction.lat, attraction.lng]}
            icon={createPoiIcon('attraction')}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{attraction.name}</h3>
                {attraction.day && (
                  <div className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full mt-1">
                    Day {attraction.day}
                  </div>
                )}
                <p className="text-sm mt-1 text-gray-700">{attraction.description}</p>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>⭐ {attraction.rating}/5</span>
                  <span>🕒 {attraction.estimatedTime}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render hotels if filter is on */}
        {showHotels && hotels.map((hotel, index) => (
          <Marker
            key={`hotel-${index}`}
            position={[hotel.lat, hotel.lng]}
            icon={createPoiIcon('hotel')}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{hotel.name}</h3>
                {hotel.day && (
                  <div className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full mt-1">
                    Night {hotel.day}
                  </div>
                )}
                <p className="text-sm mt-1 text-gray-700">
                  <span className="font-medium">Price:</span> {hotel.price}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render restaurants if filter is on */}
        {showRestaurants && restaurants.map((restaurant, index) => (
          <Marker
            key={`restaurant-${index}`}
            position={[restaurant.lat, restaurant.lng]}
            icon={createPoiIcon('restaurant')}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{restaurant.name}</h3>
                {restaurant.day && (
                  <div className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full mt-1">
                    Day {restaurant.day}
                  </div>
                )}
                <p className="text-sm mt-1 text-gray-700">
                  <span className="font-medium">Cuisine:</span> {restaurant.cuisine}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Connect locations with a route */}
        {routeLine.length > 1 && (
          <Polyline 
            positions={routeLine} 
            color={getTransportColor()} 
            weight={4} 
            opacity={0.8}
          />
        )}
        
        {/* Add explicit debug markers for route points */}
        {routeLine.length > 1 && routeLine.map((point, index) => (
          <Circle
            key={`route-point-${index}`}
            center={point}
            radius={300}
            pathOptions={{
              fillColor: getTransportColor(),
              fillOpacity: 0.6,
              color: 'white',
              weight: 2
            }}
          >
            <Tooltip permanent>
              <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full border-2 text-xs font-bold" 
                style={{ borderColor: getTransportColor(), color: getTransportColor() }}>
                {index + 1}
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}