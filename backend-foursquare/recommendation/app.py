"""
backend/recommendation/app.py
Recommendation Service - Personalized location and activity recommendations
"""

import os
import json
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
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

# Foursquare API credentials (for future implementation)
FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "recommendation"})

@app.route('/recommend', methods=['POST'])
def recommend():
    """
    Get personalized recommendations based on location and preferences
    Expected input:
    {
        "location": {
            "name": "Delhi",
            "lat": 28.6139,
            "lng": 77.209
        },
        "preferences": {
            "interests": ["history", "food", "shopping"],
            "budget": "medium",  // low, medium, high
            "dietary": ["vegetarian"],
            "accessibility": false  // wheelchair accessibility required
        },
        "trip_context": {
            "duration": 3,  // days
            "with_children": false,
            "with_elderly": false
        },
        "count": 5  // Number of recommendations to return
    }
    """
    data = request.json
    location = data.get('location', {})
    preferences = data.get('preferences', {})
    trip_context = data.get('trip_context', {})
    count = data.get('count', 5)
    
    if not location:
        return jsonify({"error": "Location is required"}), 400
    
    try:
        # First, try to get recommendations using Foursquare API (if available)
        if FOURSQUARE_API_KEY:
            foursquare_recs = get_foursquare_recommendations(location, preferences, count)
            if foursquare_recs:
                return jsonify({"recommendations": foursquare_recs}), 200
        
        # Fall back to Gemini for recommendations
        gemini_recs = get_gemini_recommendations(location, preferences, trip_context, count)
        return jsonify({"recommendations": gemini_recs}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_foursquare_recommendations(location, preferences, count):
    """
    Get recommendations from Foursquare API
    """
    # This is a placeholder for future implementation
    # In a real implementation, you would call the Foursquare API here
    return None

def get_gemini_recommendations(location, preferences, trip_context, count):
    """
    Get recommendations using Gemini AI
    """
    # Extract preferences
    interests = preferences.get('interests', [])
    budget = preferences.get('budget', 'medium')
    dietary = preferences.get('dietary', [])
    accessibility = preferences.get('accessibility', False)
    
    # Extract trip context
    duration = trip_context.get('duration', 1)
    with_children = trip_context.get('with_children', False)
    with_elderly = trip_context.get('with_elderly', False)
    
    # Build preference strings
    interests_str = ', '.join(interests) if interests else 'general tourism'
    dietary_str = ', '.join(dietary) if dietary else 'no specific dietary restrictions'
    
    # Additional context strings
    accessibility_str = "The recommendations must be wheelchair accessible." if accessibility else ""
    children_str = "The recommendations should be suitable for children." if with_children else ""
    elderly_str = "The recommendations should be suitable for elderly travelers." if with_elderly else ""
    
    prompt = f"""
    You are a travel recommendation expert. I need recommendations for places to visit in {location['name']} (coordinates: {location['lat']}, {location['lng']}).
    
    Here are the details:
    - Interests: {interests_str}
    - Budget level: {budget}
    - Dietary preferences: {dietary_str}
    - Trip duration: {duration} days
    {accessibility_str}
    {children_str}
    {elderly_str}
    
    Please provide {count} specific recommendations. Format your response as a JSON array of objects with the following structure:
    
    ```json
    [
      {{
        "name": "Place name",
        "type": "museum/restaurant/landmark/park/etc",
        "description": "Brief description",
        "lat": latitude,
        "lng": longitude,
        "estimated_cost": cost_in_INR,
        "estimated_time": "time_to_spend",
        "ideal_time_of_day": "morning/afternoon/evening",
        "kid_friendly": true/false,
        "wheelchair_accessible": true/false,
        "image_query": "search query to find image of this place"
      }}
    ]
    ```
    
    Ensure all recommendations have realistic latitude and longitude coordinates close to the location specified. The estimated cost should be in Indian Rupees (INR). The estimated time should be the recommended time to spend at the location.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            }
        )
        
        # Extract the JSON response from Gemini
        json_start = response.text.find('```json') + 7
        if json_start < 7:  # If no ```json marker is found
            json_start = response.text.find('[')
            json_end = response.text.rfind(']') + 1
        else:
            json_end = response.text.find('```', json_start)
        
        json_str = response.text[json_start:json_end].strip()
        recommendations = json.loads(json_str)
        
        # Ensure we have the requested number of recommendations
        if len(recommendations) < count:
            # If we have fewer recommendations than requested, duplicate some with variations
            while len(recommendations) < count:
                # Choose a random recommendation to duplicate
                rec = random.choice(recommendations)
                # Create a variation
                variation = rec.copy()
                variation['name'] = f"Alternative to {rec['name']}"
                variation['description'] = f"Similar to {rec['name']}. {rec['description']}"
                # Slightly modify coordinates
                variation['lat'] = rec['lat'] + (random.random() - 0.5) * 0.01
                variation['lng'] = rec['lng'] + (random.random() - 0.5) * 0.01
                # Add to recommendations
                recommendations.append(variation)
        
        # Add image URLs if we had real image services
        for rec in recommendations:
            # In a real implementation, you would fetch images from an API
            # For now, we'll add a placeholder image query
            if 'image_query' not in rec:
                rec['image_query'] = f"{rec['name']} {location['name']} tourist attraction"
        
        return recommendations
    
    except Exception as e:
        # If JSON parsing fails, return a simple fallback response
        print(f"Gemini recommendation generation failed: {str(e)}")
        return generate_fallback_recommendations(location, count)

def generate_fallback_recommendations(location, count):
    """
    Generate fallback recommendations when Gemini fails
    """
    # Generic recommendations based on location type
    recommendations = []
    
    # Common attractions in most cities
    attractions = [
        {"name": f"{location['name']} Museum", "type": "museum"},
        {"name": f"{location['name']} Central Park", "type": "park"},
        {"name": f"Historic {location['name']}", "type": "landmark"},
        {"name": f"{location['name']} Market", "type": "shopping"},
        {"name": f"{location['name']} Food Street", "type": "restaurant"},
        {"name": f"{location['name']} Temple", "type": "religious site"},
        {"name": f"{location['name']} Zoo", "type": "zoo"},
        {"name": f"{location['name']} Lake", "type": "nature"},
        {"name": f"{location['name']} Fort", "type": "historical"},
        {"name": f"{location['name']} Gardens", "type": "park"}
    ]
    
    # Take a subset of attractions based on requested count
    for i in range(min(count, len(attractions))):
        # Create a simple recommendation
        lat_offset = (random.random() - 0.5) * 0.05
        lng_offset = (random.random() - 0.5) * 0.05
        
        rec = {
            "name": attractions[i]["name"],
            "type": attractions[i]["type"],
            "description": f"A popular {attractions[i]['type']} in {location['name']}.",
            "lat": location["lat"] + lat_offset,
            "lng": location["lng"] + lng_offset,
            "estimated_cost": random.randint(2, 10) * 100,  # 200-1000 INR
            "estimated_time": f"{random.randint(1, 3)} hours",
            "ideal_time_of_day": random.choice(["morning", "afternoon", "evening"]),
            "kid_friendly": random.choice([True, False]),
            "wheelchair_accessible": random.choice([True, False]),
            "image_query": f"{attractions[i]['name']} tourist attraction"
        }
        
        recommendations.append(rec)
    
    return recommendations

@app.route('/weather', methods=['POST'])
def get_weather():
    """
    Get weather forecast for a location
    Expected input:
    {
        "location": {
            "name": "Delhi",
            "lat": 28.6139,
            "lng": 77.209
        },
        "date": "2025-09-10"  // Optional, defaults to current date
    }
    """
    data = request.json
    location = data.get('location', {})
    date = data.get('date')
    
    if not location:
        return jsonify({"error": "Location is required"}), 400
    
    try:
        # In a real implementation, you would call a weather API here
        # For now, we'll generate a mock response
        
        # Generate random weather data
        weather_types = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Thunderstorm"]
        temperature = random.randint(15, 35)  # Celsius
        weather = random.choice(weather_types)
        humidity = random.randint(40, 90)
        wind_speed = random.randint(5, 25)
        
        response = {
            "location": location["name"],
            "date": date or "today",
            "weather": weather,
            "temperature_c": temperature,
            "humidity_percent": humidity,
            "wind_speed_kmh": wind_speed,
            "forecast": [
                {
                    "time": "Morning",
                    "weather": random.choice(weather_types),
                    "temperature_c": temperature - random.randint(0, 5)
                },
                {
                    "time": "Afternoon",
                    "weather": random.choice(weather_types),
                    "temperature_c": temperature + random.randint(0, 5)
                },
                {
                    "time": "Evening",
                    "weather": random.choice(weather_types),
                    "temperature_c": temperature - random.randint(0, 3)
                }
            ]
        }
        
        # Add recommendations based on weather
        if weather in ["Sunny", "Partly Cloudy"]:
            response["recommended_activities"] = ["Outdoor sightseeing", "Park visits", "Walking tours"]
        elif weather in ["Cloudy"]:
            response["recommended_activities"] = ["Both indoor and outdoor activities", "Photography", "City walks"]
        else:
            response["recommended_activities"] = ["Indoor museums", "Shopping malls", "Cultural performances"]
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5003))
    app.run(host='0.0.0.0', port=port, debug=True)