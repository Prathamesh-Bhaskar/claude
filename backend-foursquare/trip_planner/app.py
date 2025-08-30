"""
backend/trip_planner/app.py
Trip Planner Service - Core planning logic using Gemini 2.5 Pro
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai import types
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

# Router service URL for route optimization
ROUTER_URL = os.getenv("ROUTER_URL", "http://localhost:5002")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "trip-planner"})

@app.route('/plan', methods=['POST'])
def plan_trip():
    """
    Create a comprehensive trip plan based on user requirements
    Expected input:
    {
        "query": "Plan a 5-day Kerala trip: backwaters, beaches, budget ₹20K",
        "preferences": {
            "budget": 20000,
            "duration": 5,
            "interests": ["nature", "beaches", "relaxation"],
            "dietary": ["vegetarian"],
            "transportation": ["train", "bus"]
        },
        "user_id": "user123"
    }
    """
    data = request.json
    query = data.get('query', '')
    preferences = data.get('preferences', {})
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    # Structured prompt for Gemini
    prompt = f"""
    You are a travel planning expert AI assistant for Horizon - an end-to-end journey planner.
    
    USER QUERY: "{query}"
    
    USER PREFERENCES:
    - Budget: {preferences.get('budget', 'Not specified')}
    - Duration: {preferences.get('duration', 'Not specified')} days
    - Interests: {', '.join(preferences.get('interests', []))}
    - Dietary Restrictions: {', '.join(preferences.get('dietary', []))}
    - Preferred Transportation: {', '.join(preferences.get('transportation', []))}
    
    Based on this information, create a detailed travel itinerary. Format your response as a JSON object with the following structure:
    
    ```json
    {{
        "title": "Trip title",
        "duration": "X days",
        "overview": "Brief trip description",
        "total_budget": estimated_cost,
        "days": [
            {{
                "day": 1,
                "title": "Day title",
                "locations": [
                    {{
                        "name": "Location name",
                        "lat": latitude,
                        "lng": longitude,
                        "description": "Brief description",
                        "activities": ["Activity 1", "Activity 2"],
                        "food": "Recommended food/restaurant",
                        "accommodation": "Recommended hotel"
                    }}
                ],
                "transport": {{
                    "mode": "train/bus/car",
                    "from": "Origin",
                    "to": "Destination",
                    "duration": "X hours",
                    "cost": estimated_cost
                }}
            }}
        ],
        "recommendations": [
            "Additional recommendation 1",
            "Additional recommendation 2"
        ],
        "notes": "Important notes about the trip"
    }}
    ```
    
    Ensure all locations have realistic latitude and longitude coordinates. The plan should be optimized for time and cost efficiency. Be creative but realistic in your suggestions.
    """
    
    try:
        # Generate trip plan using Gemini
        generation_config = {
            "temperature": 0.4,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Extract the JSON response from Gemini
        json_start = response.text.find('```json') + 7
        json_end = response.text.find('```', json_start)
        json_str = response.text[json_start:json_end].strip()
        
        trip_plan = json.loads(json_str)
        
        # Optional: Route optimization using Router service
        try:
            locations = []
            for day in trip_plan['days']:
                for location in day['locations']:
                    locations.append({
                        "name": location['name'],
                        "lat": location['lat'],
                        "lng": location['lng']
                    })
            
            if locations:
                route_data = {"locations": locations}
                route_response = requests.post(f"{ROUTER_URL}/optimize", json=route_data)
                if route_response.status_code == 200:
                    optimized_route = route_response.json()
                    trip_plan['optimized_route'] = optimized_route
        except requests.RequestException:
            # Continue even if route optimization fails
            pass
        
        return jsonify(trip_plan), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handle conversational interactions with the AI
    Expected input:
    {
        "message": "What places should I visit in Delhi?",
        "conversation_history": [
            {"role": "user", "content": "I want to plan a trip to Delhi"},
            {"role": "assistant", "content": "Great! Delhi is a wonderful destination..."}
        ],
        "trip_id": "trip123"  // Optional, if referring to an existing trip
    }
    """
    data = request.json
    message = data.get('message', '')
    conversation_history = data.get('conversation_history', [])
    trip_id = data.get('trip_id', None)
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    # Fetch trip context if trip_id is provided
    trip_context = ""
    if trip_id:
        # In a real implementation, you would fetch trip details from a database
        trip_context = f"This is regarding trip plan {trip_id}."
    
    # Prepare conversation for Gemini
    formatted_history = []
    for msg in conversation_history:
        role = "user" if msg['role'] == 'user' else "model"
        formatted_history.append(types.Content(role=role, parts=[types.Part.from_text(msg['content'])]))
    
    # Add travel agent system prompt
    system_prompt = """
    You are a travel planning AI assistant for Horizon - an end-to-end journey planner.
    Your purpose is to help users plan their trips, recommend destinations, and answer travel-related questions.
    Be friendly, knowledgeable, and helpful. Provide specific, actionable advice rather than generic information.
    When recommending places, include details about attractions, activities, local cuisine, and practical travel tips.
    For planning advice, consider factors like budget, timeframe, interests, and practicalities.
    
    You can:
    1. Suggest destinations based on user preferences
    2. Create detailed travel itineraries
    3. Provide information about attractions, accommodations, and transportation
    4. Offer budget planning advice
    5. Answer travel-related questions about locations worldwide
    
    Remember that you're helping real people plan meaningful experiences, so be thoughtful in your recommendations.
    """
    
    # Add context about existing trip plan if available
    if trip_context:
        system_prompt += f"\n\nCONTEXT: {trip_context}"
    
    try:
        # Generate response using Gemini
        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(
            message,
            system_instruction=system_prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4096,
            }
        )
        
        response_text = response.text
        
        # Check if the response contains any actionable instructions
        actionable = False
        action_type = None
        
        if "book" in message.lower() or "reserve" in message.lower():
            actionable = True
            action_type = "booking"
        elif "plan" in message.lower() and ("itinerary" in message.lower() or "route" in message.lower()):
            actionable = True
            action_type = "planning"
        
        return jsonify({
            "response": response_text,
            "actionable": actionable,
            "action_type": action_type
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=True)