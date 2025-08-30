"""
backend/booking/app.py
Booking Service - Handles all booking related operations
"""

import os
import json
from datetime import datetime, timedelta
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

# External API URLs (mock for now)
MAKEMYTRIP_API = os.getenv("MAKEMYTRIP_API", "https://api.makemytrip.com")
IRCTC_API = os.getenv("IRCTC_API", "https://api.irctc.co.in")
REDBUS_API = os.getenv("REDBUS_API", "https://api.redbus.in")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "booking"})

@app.route('/accommodation', methods=['POST'])
def book_accommodation():
    """
    Book accommodation
    Expected input:
    {
        "location": {
            "name": "Delhi",
            "lat": 28.6139,
            "lng": 77.209
        },
        "check_in": "2025-09-10",
        "check_out": "2025-09-15",
        "guests": {
            "adults": 2,
            "children": 0
        },
        "rooms": 1,
        "preferences": {
            "type": "hotel", // hotel, hostel, apartment, etc.
            "budget": "medium", // low, medium, high
            "amenities": ["wifi", "breakfast", "pool"]
        }
    }
    """
    data = request.json
    location = data.get('location', {})
    check_in = data.get('check_in')
    check_out = data.get('check_out')
    guests = data.get('guests', {})
    rooms = data.get('rooms', 1)
    preferences = data.get('preferences', {})
    
    if not location or not check_in or not check_out:
        return jsonify({"error": "Location, check-in, and check-out dates are required"}), 400
    
    try:
        # In a real implementation, you would call external APIs for hotel availability
        # For now, we'll use Gemini to generate realistic accommodation options
        
        accommodation_options = generate_accommodation_options(
            location, check_in, check_out, guests, rooms, preferences
        )
        
        response = {
            "location": location,
            "check_in": check_in,
            "check_out": check_out,
            "guests": guests,
            "rooms": rooms,
            "accommodation_options": accommodation_options
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_accommodation_options(location, check_in, check_out, guests, rooms, preferences):
    """
    Generate accommodation options using Gemini
    """
    # Extract preferences
    accom_type = preferences.get('type', 'hotel')
    budget = preferences.get('budget', 'medium')
    amenities = preferences.get('amenities', [])
    
    # Build preference strings
    amenities_str = ', '.join(amenities) if amenities else 'no specific amenities'
    
    # Calculate number of nights
    try:
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
        nights = (check_out_date - check_in_date).days
    except:
        nights = 1  # Default if date parsing fails
    
    prompt = f"""
    You are a travel booking expert. I need recommendations for {accom_type} accommodations in {location['name']} (coordinates: {location['lat']}, {location['lng']}).
    
    Here are the details:
    - Check-in: {check_in}
    - Check-out: {check_out} ({nights} nights)
    - Number of adults: {guests.get('adults', 1)}
    - Number of children: {guests.get('children', 0)}
    - Number of rooms: {rooms}
    - Budget level: {budget}
    - Desired amenities: {amenities_str}
    
    Please provide 5 specific accommodation options. Format your response as a JSON array of objects with the following structure:
    
    ```json
    [
      {{
        "name": "Accommodation name",
        "type": "{accom_type}",
        "description": "Brief description",
        "address": "Full address",
        "lat": latitude,
        "lng": longitude,
        "rating": rating_out_of_5,
        "price_per_night": price_in_INR,
        "total_price": total_price_for_stay,
        "amenities": ["amenity1", "amenity2", ...],
        "image_query": "search query to find image",
        "cancellation_policy": "Free cancellation until [date]"
      }}
    ]
    ```
    
    Ensure all options have realistic latitude and longitude coordinates close to the location specified. The prices should be in Indian Rupees (INR) and should reflect the {budget} budget level. Each option should have at least 3-5 amenities listed.
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
        accommodation_options = json.loads(json_str)
        
        # Add booking information
        for option in accommodation_options:
            option["check_in"] = check_in
            option["check_out"] = check_out
            option["rooms"] = rooms
            option["availability"] = "Available"
            
            # Add a mock booking URL
            hotel_name_slug = option["name"].lower().replace(' ', '-')
            option["booking_url"] = f"https://www.makemytrip.com/hotels/{hotel_name_slug}"
        
        return accommodation_options
    
    except Exception as e:
        # If JSON parsing fails, return a simple fallback response
        print(f"Accommodation generation failed: {str(e)}")
        return generate_fallback_accommodations(location, budget, nights, rooms)

def generate_fallback_accommodations(location, budget, nights, rooms):
    """
    Generate fallback accommodation options when Gemini fails
    """
    # Set price ranges based on budget
    if budget == "low":
        price_range = (1000, 3000)
    elif budget == "high":
        price_range = (8000, 20000)
    else:  # medium
        price_range = (3000, 8000)
    
    # Generic accommodation types
    accommodation_types = [
        {"name": f"Hotel {location['name']} Palace", "type": "hotel"},
        {"name": f"{location['name']} Grand Resort", "type": "resort"},
        {"name": f"{location['name']} Luxury Suites", "type": "hotel"},
        {"name": f"Budget Stay {location['name']}", "type": "hostel"},
        {"name": f"{location['name']} Apartment Rental", "type": "apartment"}
    ]
    
    # Common amenities
    all_amenities = [
        "Free WiFi", "Breakfast included", "Swimming pool", "Air conditioning",
        "Room service", "Gym", "Spa", "Restaurant", "Bar", "Parking",
        "24-hour front desk", "Airport shuttle", "Laundry service"
    ]
    
    accommodations = []
    
    for i in range(min(5, len(accommodation_types))):
        # Generate a random price within the budget range
        price_per_night = random.randint(price_range[0], price_range[1])
        total_price = price_per_night * nights * rooms
        
        # Random coordinates near the location
        lat_offset = (random.random() - 0.5) * 0.05
        lng_offset = (random.random() - 0.5) * 0.05
        
        # Random amenities (3-5)
        num_amenities = random.randint(3, 5)
        amenities = random.sample(all_amenities, num_amenities)
        
        # Random rating (3-5 stars)
        rating = round(random.uniform(3.0, 5.0), 1)
        
        # Cancellation date (2 days before check-in)
        cancellation_date = (datetime.now() + timedelta(days=random.randint(1, 5))).strftime("%Y-%m-%d")
        
        accommodation = {
            "name": accommodation_types[i]["name"],
            "type": accommodation_types[i]["type"],
            "description": f"A comfortable {accommodation_types[i]['type']} in {location['name']} with {amenities[0].lower()} and {amenities[1].lower()}.",
            "address": f"{random.randint(1, 100)} Main Street, {location['name']}",
            "lat": location["lat"] + lat_offset,
            "lng": location["lng"] + lng_offset,
            "rating": rating,
            "price_per_night": price_per_night,
            "total_price": total_price,
            "amenities": amenities,
            "image_query": f"{accommodation_types[i]['name']} exterior",
            "cancellation_policy": f"Free cancellation until {cancellation_date}",
            "availability": "Available",
            "booking_url": f"https://www.makemytrip.com/hotels/{accommodation_types[i]['name'].lower().replace(' ', '-')}"
        }
        
        accommodations.append(accommodation)
    
    return accommodations

@app.route('/transport', methods=['POST'])
def book_transport():
    """
    Book transportation
    Expected input:
    {
        "origin": {
            "name": "Delhi",
            "lat": 28.6139,
            "lng": 77.209
        },
        "destination": {
            "name": "Jaipur",
            "lat": 26.9124,
            "lng": 75.7873
        },
        "date": "2025-09-10",
        "passengers": 2,
        "mode": "train",  // train, bus, flight
        "class": "AC Chair Car"  // Optional, for trains
    }
    """
    data = request.json
    origin = data.get('origin', {})
    destination = data.get('destination', {})
    date = data.get('date')
    passengers = data.get('passengers', 1)
    mode = data.get('mode', 'train')
    travel_class = data.get('class')
    
    if not origin or not destination or not date:
        return jsonify({"error": "Origin, destination, and date are required"}), 400
    
    try:
        # In a real implementation, you would call external APIs for transportation options
        # For now, we'll generate realistic options based on the mode of transport
        
        if mode == "train":
            options = generate_train_options(origin, destination, date, passengers, travel_class)
        elif mode == "bus":
            options = generate_bus_options(origin, destination, date, passengers)
        elif mode == "flight":
            options = generate_flight_options(origin, destination, date, passengers)
        else:
            return jsonify({"error": f"Unsupported transport mode: {mode}"}), 400
        
        response = {
            "origin": origin,
            "destination": destination,
            "date": date,
            "passengers": passengers,
            "mode": mode,
            f"{mode}_options": options
        }
        
        if travel_class:
            response["class"] = travel_class
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_train_options(origin, destination, date, passengers, travel_class=None):
    """
    Generate train options
    """
    # Mock train classes
    train_classes = ["Sleeper", "AC 3 Tier", "AC 2 Tier", "AC First Class", "AC Chair Car"]
    if travel_class and travel_class not in train_classes:
        train_classes.append(travel_class)
    
    # Mock train operators
    train_operators = ["Indian Railways", "Rajdhani Express", "Shatabdi Express", "Duronto Express", "Vande Bharat Express"]
    
    # Calculate distance
    try:
        import math
        lat1, lon1 = origin["lat"], origin["lng"]
        lat2, lon2 = destination["lat"], destination["lng"]
        
        # Rough distance calculation using Haversine formula
        R = 6371  # Earth radius in km
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        # Rough travel time calculation (50 km/h average speed)
        travel_hours = distance / 50
    except:
        # Default values if calculation fails
        distance = 300
        travel_hours = 6
    
    options = []
    
    # Generate 3-5 train options
    num_options = random.randint(3, 5)
    
    for i in range(num_options):
        # Random departure time between 5 AM and 10 PM
        departure_hour = random.randint(5, 22)
        departure_minute = random.choice([0, 15, 30, 45])
        departure_time = f"{departure_hour:02d}:{departure_minute:02d}"
        
        # Calculate arrival time
        departure_datetime = datetime.strptime(f"{date} {departure_time}", "%Y-%m-%d %H:%M")
        arrival_datetime = departure_datetime + timedelta(hours=travel_hours)
        arrival_time = arrival_datetime.strftime("%H:%M")
        arrival_date = arrival_datetime.strftime("%Y-%m-%d")
        
        # Random train class if not specified
        if travel_class:
            selected_class = travel_class
        else:
            selected_class = random.choice(train_classes)
        
        # Price calculation based on distance and class
        base_price = distance * 0.8  # Base price per km
        
        # Adjust price based on class
        class_factors = {
            "Sleeper": 1.0,
            "AC 3 Tier": 1.5,
            "AC 2 Tier": 2.0,
            "AC First Class": 3.0,
            "AC Chair Car": 1.3
        }
        class_factor = class_factors.get(selected_class, 1.5)
        
        price = int(base_price * class_factor)
        total_price = price * passengers
        
        # Generate train number
        train_number = f"{random.randint(10000, 99999)}"
        
        # Generate train name
        operator = random.choice(train_operators)
        train_name = f"{operator} ({origin['name']} - {destination['name']})"
        
        option = {
            "train_number": train_number,
            "train_name": train_name,
            "departure_date": date,
            "departure_time": departure_time,
            "arrival_date": arrival_date,
            "arrival_time": arrival_time,
            "duration": f"{int(travel_hours)}h {int((travel_hours % 1) * 60)}m",
            "class": selected_class,
            "price": price,
            "total_price": total_price,
            "availability": random.choice(["Available", "Few Seats Left", "Waitlist"]),
            "booking_url": f"https://www.irctc.co.in/nget/train-search?trainNo={train_number}"
        }
        
        options.append(option)
    
    return options

def generate_bus_options(origin, destination, date, passengers):
    """
    Generate bus options
    """
    # Mock bus operators
    bus_operators = ["RedBus", "Volvo Express", "Shrinath Travels", "Neeta Tours", "Prasanna Purple"]
    
    # Mock bus types
    bus_types = ["AC Sleeper", "Non-AC Sleeper", "AC Seater", "Non-AC Seater", "Deluxe"]
    
    # Calculate distance
    try:
        import math
        lat1, lon1 = origin["lat"], origin["lng"]
        lat2, lon2 = destination["lat"], destination["lng"]
        
        # Rough distance calculation using Haversine formula
        R = 6371  # Earth radius in km
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        # Rough travel time calculation (40 km/h average speed)
        travel_hours = distance / 40
    except:
        # Default values if calculation fails
        distance = 200
        travel_hours = 5
    
    options = []
    
    # Generate 3-5 bus options
    num_options = random.randint(3, 5)
    
    for i in range(num_options):
        # Random departure time between 6 AM and 11 PM
        departure_hour = random.randint(6, 23)
        departure_minute = random.choice([0, 15, 30, 45])
        departure_time = f"{departure_hour:02d}:{departure_minute:02d}"
        
        # Calculate arrival time
        departure_datetime = datetime.strptime(f"{date} {departure_time}", "%Y-%m-%d %H:%M")
        arrival_datetime = departure_datetime + timedelta(hours=travel_hours)
        arrival_time = arrival_datetime.strftime("%H:%M")
        arrival_date = arrival_datetime.strftime("%Y-%m-%d")
        
        # Random bus type
        bus_type = random.choice(bus_types)
        
        # Price calculation based on distance and bus type
        base_price = distance * 1.2  # Base price per km
        
        # Adjust price based on bus type
        type_factors = {
            "AC Sleeper": 1.5,
            "Non-AC Sleeper": 1.2,
            "AC Seater": 1.3,
            "Non-AC Seater": 1.0,
            "Deluxe": 1.8
        }
        type_factor = type_factors.get(bus_type, 1.2)
        
        price = int(base_price * type_factor)
        total_price = price * passengers
        
        # Generate bus ID
        bus_id = f"BUS{random.randint(10000, 99999)}"
        
        # Generate bus operator
        operator = random.choice(bus_operators)
        
        option = {
            "bus_id": bus_id,
            "operator": operator,
            "bus_type": bus_type,
            "departure_date": date,
            "departure_time": departure_time,
            "arrival_date": arrival_date,
            "arrival_time": arrival_time,
            "duration": f"{int(travel_hours)}h {int((travel_hours % 1) * 60)}m",
            "price": price,
            "total_price": total_price,
            "seats_available": random.randint(5, 40),
            "boarding_point": f"{origin['name']} Bus Stand",
            "dropping_point": f"{destination['name']} Bus Stand",
            "amenities": random.sample(["WiFi", "Charging Point", "Water Bottle", "Blanket", "TV"], random.randint(2, 4)),
            "booking_url": f"https://www.redbus.in/search?fromCityName={origin['name']}&toCityName={destination['name']}&busId={bus_id}"
        }
        
        options.append(option)
    
    return options

def generate_flight_options(origin, destination, date, passengers):
    """
    Generate flight options
    """
    # Mock airlines
    airlines = ["IndiGo", "Air India", "SpiceJet", "Vistara", "GoAir", "AirAsia India"]
    
    # Mock flight classes
    flight_classes = ["Economy", "Premium Economy", "Business"]
    
    # Calculate distance
    try:
        import math
        lat1, lon1 = origin["lat"], origin["lng"]
        lat2, lon2 = destination["lat"], destination["lng"]
        
        # Rough distance calculation using Haversine formula
        R = 6371  # Earth radius in km
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        # Rough flight time calculation (500 km/h average speed)
        travel_hours = distance / 500
        if travel_hours < 1:
            travel_hours = 1  # Minimum flight time
    except:
        # Default values if calculation fails
        distance = 800
        travel_hours = 2
    
    options = []
    
    # Generate 3-5 flight options
    num_options = random.randint(3, 5)
    
    for i in range(num_options):
        # Random departure time between 6 AM and 10 PM
        departure_hour = random.randint(6, 22)
        departure_minute = random.choice([0, 15, 30, 45])
        departure_time = f"{departure_hour:02d}:{departure_minute:02d}"
        
        # Calculate arrival time
        departure_datetime = datetime.strptime(f"{date} {departure_time}", "%Y-%m-%d %H:%M")
        arrival_datetime = departure_datetime + timedelta(hours=travel_hours)
        arrival_time = arrival_datetime.strftime("%H:%M")
        arrival_date = arrival_datetime.strftime("%Y-%m-%d")
        
        # Random airline and flight number
        airline = random.choice(airlines)
        flight_number = f"{airline[:2]}{random.randint(100, 999)}"
        
        # Random flight class
        flight_class = random.choice(flight_classes)
        
        # Price calculation based on distance and class
        base_price = distance * 3.5  # Base price per km
        
        # Adjust price based on class
        class_factors = {
            "Economy": 1.0,
            "Premium Economy": 1.7,
            "Business": 3.0
        }
        class_factor = class_factors.get(flight_class, 1.0)
        
        price = int(base_price * class_factor)
        total_price = price * passengers
        
        option = {
            "flight_number": flight_number,
            "airline": airline,
            "departure_date": date,
            "departure_time": departure_time,
            "arrival_date": arrival_date,
            "arrival_time": arrival_time,
            "duration": f"{int(travel_hours)}h {int((travel_hours % 1) * 60)}m",
            "class": flight_class,
            "price": price,
            "total_price": total_price,
            "refundable": random.choice([True, False]),
            "baggage_allowance": {
                "cabin": "7 kg",
                "check_in": "15 kg"
            },
            "origin_airport": f"{origin['name']} Airport",
            "destination_airport": f"{destination['name']} Airport",
            "booking_url": f"https://www.makemytrip.com/flight/search?itinerary={origin['name']}-{destination['name']}-{date}&tripType=O&paxType=A-{passengers}_C-0_I-0&intl=false&cabinClass={flight_class.lower()}"
        }
        
        options.append(option)
    
    return options

@app.route('/food', methods=['POST'])
def book_food():
    """
    Get restaurant recommendations and booking options
    Expected input:
    {
        "location": {
            "name": "Delhi",
            "lat": 28.6139,
            "lng": 77.209
        },
        "date": "2025-09-10",
        "time": "19:30",
        "guests": 2,
        "preferences": {
            "cuisine": ["Indian", "Chinese"],
            "budget": "medium",  // low, medium, high
            "dietary": ["vegetarian"]
        }
    }
    """
    data = request.json
    location = data.get('location', {})
    date = data.get('date')
    time = data.get('time')
    guests = data.get('guests', 1)
    preferences = data.get('preferences', {})
    
    if not location:
        return jsonify({"error": "Location is required"}), 400
    
    try:
        # Generate restaurant recommendations
        restaurants = generate_restaurant_recommendations(
            location, date, time, guests, preferences
        )
        
        response = {
            "location": location,
            "date": date,
            "time": time,
            "guests": guests,
            "restaurants": restaurants
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_restaurant_recommendations(location, date, time, guests, preferences):
    """
    Generate restaurant recommendations using Gemini
    """
    # Extract preferences
    cuisines = preferences.get('cuisine', [])
    budget = preferences.get('budget', 'medium')
    dietary = preferences.get('dietary', [])
    
    # Build preference strings
    cuisines_str = ', '.join(cuisines) if cuisines else 'any cuisine'
    dietary_str = ', '.join(dietary) if dietary else 'no specific dietary restrictions'
    
    prompt = f"""
    You are a restaurant recommendation expert. I need recommendations for restaurants in {location['name']} (coordinates: {location['lat']}, {location['lng']}).
    
    Here are the details:
    - Date: {date}
    - Time: {time}
    - Number of guests: {guests}
    - Preferred cuisines: {cuisines_str}
    - Budget level: {budget}
    - Dietary preferences: {dietary_str}
    
    Please provide 5 specific restaurant recommendations. Format your response as a JSON array of objects with the following structure:
    
    ```json
    [
      {{
        "name": "Restaurant name",
        "cuisine": "Cuisine type",
        "description": "Brief description",
        "address": "Full address",
        "lat": latitude,
        "lng": longitude,
        "rating": rating_out_of_5,
        "price_range": "₹₹₹",
        "average_cost": cost_per_person_in_INR,
        "total_cost": estimated_total_for_group,
        "menu_highlights": ["dish1", "dish2", "dish3"],
        "image_query": "search query to find image",
        "booking_available": true/false
      }}
    ]
    ```
    
    Ensure all restaurants have realistic latitude and longitude coordinates close to the location specified. The prices should be in Indian Rupees (INR) and should reflect the {budget} budget level. Each restaurant should have 3-5 menu highlights.
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
        restaurants = json.loads(json_str)
        
        # Add booking information
        for restaurant in restaurants:
            restaurant["date"] = date
            restaurant["time"] = time
            restaurant["guests"] = guests
            
            # Price range symbols
            if budget == "low":
                restaurant["price_range"] = "₹"
            elif budget == "high":
                restaurant["price_range"] = "₹₹₹"
            else:  # medium
                restaurant["price_range"] = "₹₹"
            
            # Add a mock booking URL
            restaurant_name_slug = restaurant["name"].lower().replace(' ', '-')
            restaurant["booking_url"] = f"https://www.dineout.co.in/{location['name'].lower()}/{restaurant_name_slug}"
        
        return restaurants
    
    except Exception as e:
        # If JSON parsing fails, return a simple fallback response
        print(f"Restaurant recommendation generation failed: {str(e)}")
        return generate_fallback_restaurants(location, budget, guests)

def generate_fallback_restaurants(location, budget, guests):
    """
    Generate fallback restaurant options when Gemini fails
    """
    # Set price ranges based on budget
    if budget == "low":
        price_range = (200, 500)
        price_symbol = "₹"
    elif budget == "high":
        price_range = (1000, 2500)
        price_symbol = "₹₹₹"
    else:  # medium
        price_range = (500, 1000)
        price_symbol = "₹₹"
    
    # Generic restaurant types
    restaurant_types = [
        {"name": f"{location['name']} Spice Garden", "cuisine": "Indian"},
        {"name": f"Royal {location['name']} Kitchen", "cuisine": "North Indian"},
        {"name": f"China Town {location['name']}", "cuisine": "Chinese"},
        {"name": f"{location['name']} Pizza House", "cuisine": "Italian"},
        {"name": f"South Flavors of {location['name']}", "cuisine": "South Indian"}
    ]
    
    # Common Indian dishes
    indian_dishes = ["Butter Chicken", "Paneer Tikka", "Dal Makhani", "Biryani", "Naan", "Tandoori Roti", "Malai Kofta"]
    chinese_dishes = ["Kung Pao Chicken", "Hakka Noodles", "Manchurian", "Spring Rolls", "Fried Rice", "Chilli Paneer"]
    italian_dishes = ["Margherita Pizza", "Pasta Carbonara", "Risotto", "Tiramisu", "Bruschetta", "Lasagna"]
    south_indian_dishes = ["Dosa", "Idli", "Sambar", "Vada", "Uttapam", "Appam", "Rasam"]
    
    cuisine_dishes = {
        "Indian": indian_dishes,
        "North Indian": indian_dishes,
        "Chinese": chinese_dishes,
        "Italian": italian_dishes,
        "South Indian": south_indian_dishes
    }
    
    restaurants = []
    
    for i in range(min(5, len(restaurant_types))):
        # Generate a random price within the budget range
        price_per_person = random.randint(price_range[0], price_range[1])
        total_price = price_per_person * guests
        
        # Random coordinates near the location
        lat_offset = (random.random() - 0.5) * 0.05
        lng_offset = (random.random() - 0.5) * 0.05
        
        # Random rating (3.5-4.8 stars)
        rating = round(random.uniform(3.5, 4.8), 1)
        
        # Menu highlights based on cuisine
        cuisine = restaurant_types[i]["cuisine"]
        highlights = random.sample(cuisine_dishes.get(cuisine, indian_dishes), min(3, len(cuisine_dishes.get(cuisine, indian_dishes))))
        
        restaurant = {
            "name": restaurant_types[i]["name"],
            "cuisine": cuisine,
            "description": f"A popular {cuisine} restaurant in {location['name']} known for its {highlights[0]} and {highlights[1]}.",
            "address": f"{random.randint(1, 100)} Food Street, {location['name']}",
            "lat": location["lat"] + lat_offset,
            "lng": location["lng"] + lng_offset,
            "rating": rating,
            "price_range": price_symbol,
            "average_cost": price_per_person,
            "total_cost": total_price,
            "menu_highlights": highlights,
            "image_query": f"{restaurant_types[i]['name']} restaurant",
            "booking_available": random.choice([True, False]),
            "booking_url": f"https://www.dineout.co.in/{location['name'].lower()}/{restaurant_types[i]['name'].lower().replace(' ', '-')}"
        }
        
        restaurants.append(restaurant)
    
    return restaurants

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5004))
    app.run(host='0.0.0.0', port=port, debug=True)