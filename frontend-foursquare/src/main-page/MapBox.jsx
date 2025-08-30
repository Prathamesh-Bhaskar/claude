// src/main-page/MapBox.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { routeApi } from "../api/horizonApi";

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

// Create custom icon with photo
const createPhotoIcon = (photoUrl) =>
  L.icon({
    iconUrl: photoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
    iconSize: [50, 50],
    className: "rounded-full border border-white shadow-lg"
  });

export default function MapBox({ initialLocations = [], tripPlan = null }) {
  const [locations, setLocations] = useState(initialLocations);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transportMode, setTransportMode] = useState("car");
  
  // Set default position to center of India
  const defaultPosition = [22.9734, 78.6569];
  
  // Process trip plan when it changes
  useEffect(() => {
    if (tripPlan && tripPlan.days) {
      // Extract locations from trip plan
      const newLocations = [];
      
      tripPlan.days.forEach(day => {
        if (day.locations && day.locations.length > 0) {
          day.locations.forEach(location => {
            newLocations.push({
              name: location.name,
              lat: location.lat,
              lng: location.lng,
              description: location.description || "",
              day: day.day
            });
          });
        }
      });
      
      if (newLocations.length > 0) {
        setLocations(newLocations);
        optimizeRoute(newLocations);
      }
    }
  }, [tripPlan]);
  
  // Optimize route when locations or transport mode changes
  const optimizeRoute = async (locs = locations) => {
    if (!locs || locs.length < 2) return;
    
    setIsLoading(true);
    
    try {
      const response = await routeApi.optimizeRoute(locs, transportMode);
      
      if (response && response.optimized_route) {
        setOptimizedRoute(response.optimized_route);
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
  
  // Prepare route line for the map
  const routeLine = optimizedRoute.length > 0 
    ? optimizedRoute.map(loc => [loc.lat, loc.lng])
    : locations.map(loc => [loc.lat, loc.lng]);
  
  return (
    <div className="relative w-full h-[750px]">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10 flex items-center justify-center text-white">
          <div className="bg-orange-500 px-6 py-3 rounded-lg shadow-lg">
            Optimizing your route...
          </div>
        </div>
      )}
      
      {/* Transport mode selection */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2">
        {["car", "train", "bus", "walking"].map(mode => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`px-3 py-1 rounded ${
              transportMode === mode 
                ? "bg-orange-500 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      
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
        <MapController locations={locations} />
        
        {/* Render markers for all locations */}
        {locations.map((loc, index) => (
          <Marker
            key={index}
            position={[loc.lat, loc.lng]}
            icon={createPhotoIcon(loc.photo)}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">{loc.name}</h3>
                {loc.day && <p className="text-sm text-gray-600">Day {loc.day}</p>}
                {loc.description && <p className="text-sm mt-1">{loc.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Connect locations with a route */}
        {routeLine.length > 1 && (
          <Polyline 
            positions={routeLine} 
            color={
              transportMode === "car" ? "blue" :
              transportMode === "train" ? "red" :
              transportMode === "bus" ? "green" :
              "purple"
            } 
            weight={3} 
            dashArray={transportMode === "train" ? "10, 10" : null}
          />
        )}
      </MapContainer>
    </div>
  );
}