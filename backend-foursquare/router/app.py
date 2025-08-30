"""
backend/router/app.py
Router Service - Optimizes routes between destinations
"""

import os
import math
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from geopy.distance import great_circle
import requests

# Load environment variables
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization"], supports_credentials=True)

# Initialize Gemini AI with API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("No GOOGLE_API_KEY found in environment variables")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel(model_name="gemini-2.5-pro")

# Constants
EARTH_RADIUS_KM = 6371  # Earth radius in kilometers

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "router"})

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two points on Earth"""
    return great_circle((lat1, lon1), (lat2, lon2)).kilometers

def calculate_duration(distance, mode="car"):
    """Estimate travel duration based on distance and mode of transport"""
    # Average speeds in km/h
    speeds = {
        "car": 60,
        "bus": 40,
        "train": 80,
        "walking": 5,
        "cycling": 15
    }
    
    speed = speeds.get(mode.lower(), 50)  # Default to 50 km/h if mode not found
    hours = distance / speed
    
    # Round to nearest 5 minutes
    minutes = round(hours * 60 / 5) * 5
    
    if minutes < 60:
        return f"{minutes} minutes"
    else:
        h = minutes // 60
        m = minutes % 60
        return f"{h} hour{'s' if h > 1 else ''} {m} minutes"

@app.route('/optimize', methods=['POST'])
def optimize_route():
    """
    Optimize the route for a set of locations
    Expected input:
    {
        "locations": [
            {"name": "Location 1", "lat": 28.6139, "lng": 77.209},
            {"name": "Location 2", "lat": 27.1751, "lng": 78.0421},
            ...
        ],
        "mode": "car",  // Optional: car, bus, train, walking, cycling
        "start_location": {"name": "Start", "lat": 28.5, "lng": 77.1}  // Optional
    }
    """
    data = request.json
    locations = data.get('locations', [])
    mode = data.get('mode', 'car')
    start_location = data.get('start_location', None)
    
    if not locations or len(locations) < 2:
        return jsonify({"error": "At least two locations are required"}), 400
    
    try:
        # If start location is provided, add it to the beginning
        if start_location:
            # Check if start location is already in the list
            if not any(loc['name'] == start_location['name'] for loc in locations):
                locations = [start_location] + locations
        
        # For small number of locations, use Nearest Neighbor algorithm
        if len(locations) <= 10:
            optimized_route = nearest_neighbor_algorithm(locations, start_location is not None)
        else:
            # For larger sets, use Gemini to get a better route
            optimized_route = gemini_optimize_route(locations, mode)
        
        # Calculate distances and durations
        total_distance = 0
        route_with_details = []
        
        for i in range(len(optimized_route)):
            loc = optimized_route[i]
            route_detail = {
                "name": loc["name"],
                "lat": loc["lat"],
                "lng": loc["lng"],
                "order": i
            }
            
            # Calculate distance and duration to next location
            if i < len(optimized_route) - 1:
                next_loc = optimized_route[i + 1]
                distance = calculate_distance(loc["lat"], loc["lng"], next_loc["lat"], next_loc["lng"])
                total_distance += distance
                
                route_detail["distance_to_next"] = round(distance, 2)
                route_detail["duration_to_next"] = calculate_duration(distance, mode)
            
            route_with_details.append(route_detail)
        
        response = {
            "optimized_route": route_with_details,
            "total_distance_km": round(total_distance, 2),
            "total_duration": calculate_duration(total_distance, mode),
            "mode": mode
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def nearest_neighbor_algorithm(locations, preserve_start=False):
    """
    Implement the Nearest Neighbor algorithm for route optimization.
    If preserve_start is True, keep the first location fixed.
    """
    if len(locations) <= 1:
        return locations
    
    # Make a copy of locations to avoid modifying the original
    remaining = locations.copy()
    
    # Start with the first location if preserve_start is True
    optimized_route = []
    if preserve_start:
        optimized_route.append(remaining.pop(0))
    else:
        # Start with a random location (using the first one for simplicity)
        optimized_route.append(remaining.pop(0))
    
    # Build route by finding the nearest unvisited location
    while remaining:
        current = optimized_route[-1]
        nearest_idx = 0
        min_dist = calculate_distance(
            current["lat"], current["lng"],
            remaining[0]["lat"], remaining[0]["lng"]
        )
        
        # Find the nearest location
        for i in range(1, len(remaining)):
            dist = calculate_distance(
                current["lat"], current["lng"],
                remaining[i]["lat"], remaining[i]["lng"]
            )
            if dist < min_dist:
                min_dist = dist
                nearest_idx = i
        
        # Add the nearest location to the route
        optimized_route.append(remaining.pop(nearest_idx))
    
    return optimized_route

def gemini_optimize_route(locations, mode):
    """
    Use Gemini to optimize the route for complex scenarios
    """
    # Prepare locations data
    locations_str = "\n".join([
        f"{i+1}. {loc['name']}: Latitude {loc['lat']}, Longitude {loc['lng']}"
        for i, loc in enumerate(locations)
    ])
    
    prompt = f"""
    You are an expert route optimizer. I need to optimize a travel route between the following locations using {mode} as the transportation mode:
    
    {locations_str}
    
    Please analyze these locations and provide the optimal order to visit them to minimize total travel distance and time.
    
    Your response should be a numbered list showing the optimal visiting order of these locations.
    For each location, include only the original index number from the list above (1 to {len(locations)}).
    
    For example:
    1. [Original index 3]
    2. [Original index 1]
    3. [Original index 4]
    ...
    
    The response should ONLY contain the ordered indices in this format, nothing else.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
        )
        
        # Parse the response to get the ordered indices
        lines = response.text.strip().split('\n')
        ordered_indices = []
        
        for line in lines:
            if not line.strip():
                continue
            
            # Extract the original index
            try:
                parts = line.split('[Original index ')
                if len(parts) > 1:
                    idx_str = parts[1].split(']')[0].strip()
                    idx = int(idx_str) - 1  # Convert to 0-based index
                    if 0 <= idx < len(locations):
                        ordered_indices.append(idx)
            except (IndexError, ValueError):
                # If parsing fails, try another approach
                try:
                    idx = int(line.split('.')[0].strip()) - 1
                    if 0 <= idx < len(locations):
                        ordered_indices.append(idx)
                except (IndexError, ValueError):
                    continue
        
        # If we couldn't parse the indices or didn't get enough, fall back to nearest neighbor
        if len(ordered_indices) < len(locations) / 2:
            return nearest_neighbor_algorithm(locations)
        
        # Create the optimized route using the ordered indices
        optimized_route = []
        for idx in ordered_indices:
            if idx < len(locations):
                optimized_route.append(locations[idx])
        
        # Add any missing locations (in case the AI missed some)
        added_indices = set(ordered_indices)
        for i, loc in enumerate(locations):
            if i not in added_indices:
                optimized_route.append(loc)
        
        return optimized_route
    
    except Exception as e:
        # Fall back to nearest neighbor if Gemini fails
        print(f"Gemini route optimization failed: {str(e)}")
        return nearest_neighbor_algorithm(locations)

@app.route('/transportation', methods=['POST'])
def get_transportation_options():
    """
    Get transportation options between two locations
    Expected input:
    {
        "origin": {"lat": 28.6139, "lng": 77.209},
        "destination": {"lat": 27.1751, "lng": 78.0421},
        "date": "2025-09-10"  // Optional
    }
    """
    data = request.json
    origin = data.get('origin')
    destination = data.get('destination')
    date = data.get('date')
    
    if not origin or not destination:
        return jsonify({"error": "Origin and destination are required"}), 400
    
    try:
        # Calculate distance between origin and destination
        distance = calculate_distance(
            origin["lat"], origin["lng"],
            destination["lat"], destination["lng"]
        )
        
        # Determine appropriate transportation modes based on distance
        transportation_options = []
        
        if distance < 5:
            transportation_options.append({
                "mode": "walking",
                "duration": calculate_duration(distance, "walking"),
                "cost": 0,
                "eco_friendly": True
            })
        
        if distance < 20:
            transportation_options.append({
                "mode": "cycling",
                "duration": calculate_duration(distance, "cycling"),
                "cost": 100 if distance > 10 else 50,  # Bike rental cost in INR
                "eco_friendly": True
            })
        
        if distance < 500:
            bus_cost = int(distance * 1.5)  # Approx bus cost in INR
            transportation_options.append({
                "mode": "bus",
                "duration": calculate_duration(distance, "bus"),
                "cost": bus_cost,
                "eco_friendly": True
            })
        
        if distance < 1000:
            train_cost = int(distance * 2)  # Approx train cost in INR
            transportation_options.append({
                "mode": "train",
                "duration": calculate_duration(distance, "train"),
                "cost": train_cost,
                "eco_friendly": True
            })
        
        car_cost = int(distance * 8)  # Approx car cost in INR (fuel + tolls)
        transportation_options.append({
            "mode": "car",
            "duration": calculate_duration(distance, "car"),
            "cost": car_cost,
            "eco_friendly": False
        })
        
        if distance > 500:
            # Very rough flight cost estimation
            base_cost = 3000
            distance_cost = int(distance * 5)
            flight_cost = base_cost + distance_cost
            
            # Flight duration (rough estimate)
            flight_duration = f"{math.ceil(distance / 800 + 1.5)} hours"
            
            transportation_options.append({
                "mode": "flight",
                "duration": flight_duration,
                "cost": flight_cost,
                "eco_friendly": False
            })
        
        response = {
            "origin": origin,
            "destination": destination,
            "distance_km": round(distance, 2),
            "transportation_options": transportation_options
        }
        
        if date:
            response["date"] = date
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5002))
    app.run(host='0.0.0.0', port=port, debug=True)