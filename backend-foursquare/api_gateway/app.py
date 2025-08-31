"""
backend/api_gateway/app.py
API Gateway Service - Entry point for frontend requests
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, 
     origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=False)

# Service URLs - use Render URLs as defaults (override with environment variables if needed)
TRIP_PLANNER_URL = os.getenv("TRIP_PLANNER_URL", "https://trip-planner-vysn.onrender.com")
ROUTER_URL = os.getenv("ROUTER_URL", "https://router-xrs1.onrender.com")
RECOMMENDATION_URL = os.getenv("RECOMMENDATION_URL", "https://recommendation-4raf.onrender.com")
BOOKING_URL = os.getenv("BOOKING_URL", "https://booking-d95d.onrender.com")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the API gateway"""
    return jsonify({"status": "healthy", "service": "api-gateway"})

@app.route('/api/trip/plan', methods=['POST'])
def plan_trip():
    """Create a new trip plan based on user requirements"""
    data = request.json
    try:
        response = requests.post(f"{TRIP_PLANNER_URL}/plan", json=data)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/trip/optimize', methods=['POST'])
def optimize_route():
    """Optimize the route for a given trip plan"""
    data = request.json
    try:
        response = requests.post(f"{ROUTER_URL}/optimize", json=data)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """Get personalized recommendations for a trip"""
    data = request.json
    try:
        response = requests.post(f"{RECOMMENDATION_URL}/recommend", json=data)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/booking/<service_type>', methods=['POST'])
def booking(service_type):
    """Handle booking requests for different services"""
    valid_services = ['accommodation', 'transport', 'food']
    if service_type not in valid_services:
        return jsonify({"error": "Invalid service type"}), 400
    
    data = request.json
    try:
        response = requests.post(f"{BOOKING_URL}/{service_type}", json=data)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/message', methods=['POST'])
def chat_message():
    """Handle chat messages from the frontend"""
    data = request.json
    try:
        response = requests.post(f"{TRIP_PLANNER_URL}/chat", json=data)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
