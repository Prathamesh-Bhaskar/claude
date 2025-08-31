# Horizon - AI-Powered Travel Planner

A comprehensive end-to-end journey planning application that leverages Google Gemini AI to create personalized travel itineraries with interactive maps, smart routing, and booking capabilities.

## 🌟 Features

- **AI-Powered Trip Planning** - Uses Google Gemini 2.5 Pro for intelligent itinerary generation
- **Interactive Maps** - MapBox GL integration with real-time location visualization
- **Smart Route Optimization** - Multi-destination route planning with various transportation modes
- **Personalized Recommendations** - Hotels, restaurants, and attractions based on preferences
- **Booking Integration** - Seamless booking for accommodations, transport, and dining
- **Chat Interface** - Conversational trip planning with AI assistance
- **Multi-Day Itineraries** - Detailed day-wise planning with activities and logistics

## 🏗️ Architecture

### Frontend (React + Vite)
```
frontend-foursquare/
├── src/
│   ├── components/          # Reusable UI components
│   ├── main-page/          # Main application pages
│   ├── assets/             # Images and static files
│   └── App.jsx             # Main application component
```

### Backend (Microservices)
```
backend-foursquare/
├── api_gateway/            # API Gateway service
├── trip_planner/           # AI trip planning service
├── router/                 # Route optimization service
├── recommendation/         # Recommendation engine
└── booking/                # Booking management service
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Google AI API Key
- MapBox API Key

### Frontend Setup

```bash
cd frontend-foursquare
npm install
npm run dev
```

### Backend Setup

```bash
# Install Python dependencies for each service
cd backend-foursquare/api_gateway
pip install -r requirements.txt

cd ../trip_planner
pip install -r requirements.txt

cd ../router
pip install -r requirements.txt

cd ../recommendation
pip install -r requirements.txt

cd ../booking
pip install -r requirements.txt
```

### Environment Variables

Create `.env` files in each backend service directory:

```bash
# Required in all backend services
GOOGLE_API_KEY=your_google_ai_api_key_here
PORT=5000

# API Gateway (.env)
TRIP_PLANNER_URL=http://localhost:5001
ROUTER_URL=http://localhost:5002
RECOMMENDATION_URL=http://localhost:5003
BOOKING_URL=http://localhost:5004

# Add MapBox token to frontend
# frontend-foursquare/.env
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## 💻 Usage Examples

### Trip Planning API

```javascript
// Plan a trip
const response = await fetch('/api/trip/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Plan a 5-day Kerala trip: backwaters, beaches, budget ₹20K",
    preferences: {
      budget: 20000,
      duration: 5,
      interests: ["nature", "beaches", "relaxation"],
      dietary: ["vegetarian"],
      transportation: ["train", "bus"]
    },
    user_id: "user123"
  })
});

const tripPlan = await response.json();
```

### Route Optimization

```javascript
// Optimize route between destinations
const optimizedRoute = await fetch('/api/trip/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locations: [
      { name: "Kochi", lat: 9.9312, lng: 76.2673 },
      { name: "Munnar", lat: 10.0889, lng: 77.0595 },
      { name: "Alleppey", lat: 9.4981, lng: 76.3388 }
    ],
    transportation_mode: "car",
    optimize_for: "time"
  })
});
```

### React Component Example

```jsx
// Trip Planning Form Component
import { useState } from 'react';
import { MapPin, Calendar, Heart, Car } from 'lucide-react';

const TripPlannerForm = ({ onPlanGenerated }) => {
  const [formData, setFormData] = useState({
    destination: '',
    duration: 3,
    budget: 15000,
    travelers: 2,
    interests: [],
    transportation: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/trip/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `Plan a ${formData.duration}-day trip to ${formData.destination} for ${formData.travelers} people with budget ₹${formData.budget}`,
        preferences: formData
      })
    });
    
    const plan = await response.json();
    onPlanGenerated(plan);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline mr-1" size={16} />
          Destination *
        </label>
        <input
          type="text"
          value={formData.destination}
          onChange={(e) => setFormData({...formData, destination: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          placeholder="e.g., Kerala, India"
          required
        />
      </div>
      
      <button 
        type="submit"
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
      >
        Generate Trip Plan
      </button>
    </form>
  );
};

export default TripPlannerForm;
```

### MapBox Integration

```jsx
// Interactive Map Component
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const MapBox = ({ locations, onLocationSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!map.current) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [77.2090, 28.6139], // Delhi coordinates
        zoom: 10
      });

      // Add markers for each location
      locations.forEach(location => {
        const marker = new mapboxgl.Marker()
          .setLngLat([location.lng, location.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h3>${location.name}</h3>`))
          .addTo(map.current);
      });
    }
  }, [locations]);

  return <div ref={mapContainer} className="w-full h-96" />;
};

export default MapBox;
```

## 📊 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trip/plan` | Generate trip plan |
| POST | `/api/trip/optimize` | Optimize route |
| POST | `/api/recommendations` | Get recommendations |
| POST | `/api/booking/accommodation` | Book hotels |
| POST | `/api/booking/transport` | Book transport |
| POST | `/api/chat/message` | Chat with AI |

### Example Response

```json
{
  "title": "5-Day Kerala Adventure",
  "duration": "5 Days",
  "total_budget": 18500,
  "days": [
    {
      "day": 1,
      "location": "Kochi",
      "activities": ["Fort Kochi", "Chinese Fishing Nets"],
      "accommodation": {
        "name": "Hotel Seagull",
        "price": 2500,
        "rating": 4.2
      },
      "transport": {
        "mode": "train",
        "cost": 450
      }
    }
  ],
  "locations": [
    {
      "name": "Kochi",
      "lat": 9.9312,
      "lng": 76.2673,
      "description": "Historic port city with colonial charm"
    }
  ]
}
```

## 🛠️ Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code

# Backend (each service)
python app.py        # Start Flask service
```

### Key Dependencies

**Frontend:**
- React 19.1.1
- Vite 6.3.5
- MapBox GL 3.14.0
- React Router 7.8.2
- Framer Motion 12.23.12
- Leaflet 1.9.4
- Lucide React 0.523.0

**Backend:**
- Flask
- Flask-CORS
- Google Generative AI
- Requests
- Geopy
- Python-dotenv

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Render/Railway)
Each microservice can be deployed independently:

```dockerfile
# Dockerfile for each service
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

## 🔧 Configuration

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google AI API key | Yes |
| `VITE_MAPBOX_ACCESS_TOKEN` | MapBox access token | Yes |
| `PORT` | Service port | No (default: 5000) |
| `*_URL` | Service URLs for microservices | Yes (in production) |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Horizon** - Making travel planning effortless with the power of AI! ✈️
