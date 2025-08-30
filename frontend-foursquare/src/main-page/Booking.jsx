// src/main-page/Booking.jsx
import { useState, useEffect } from "react";
import { bookingApi } from "../api/horizonApi";

export default function Booking({ tripPlan = null }) {
  const [activeTab, setActiveTab] = useState("accommodation");
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accommodations, setAccommodations] = useState([]);
  const [transportOptions, setTransportOptions] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  
  // Current location for bookings
  const [currentLocation, setCurrentLocation] = useState({
    name: "Delhi",
    lat: 28.6139,
    lng: 77.209
  });
  
  // Fetch appropriate booking options when tab changes or trip plan updates
  useEffect(() => {
    if (tripPlan && tripPlan.days && tripPlan.days.length > 0) {
      // Extract main location from trip plan
      const mainLocation = tripPlan.days[0].locations[0];
      if (mainLocation) {
        setCurrentLocation({
          name: mainLocation.name,
          lat: mainLocation.lat,
          lng: mainLocation.lng
        });
      }
    }
    
    fetchBookingOptions();
  }, [activeTab, tripPlan]);
  
  // Fetch booking options based on active tab
  const fetchBookingOptions = async () => {
    if (!currentLocation) return;
    
    setIsLoading(true);
    
    try {
      if (activeTab === "accommodation") {
        // Calculate check-in and check-out dates (today + 1 day, and 3 days after)
        const today = new Date();
        const checkIn = new Date(today);
        checkIn.setDate(today.getDate() + 1);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + 3);
        
        // Format dates as YYYY-MM-DD
        const checkInStr = checkIn.toISOString().split('T')[0];
        const checkOutStr = checkOut.toISOString().split('T')[0];
        
        const response = await bookingApi.getAccommodations(
          currentLocation,
          checkInStr,
          checkOutStr,
          { adults: 2, children: 0 },
          1,
          { type: "hotel", budget: "medium", amenities: ["wifi", "breakfast"] }
        );
        
        setAccommodations(response.accommodation_options || []);
      } 
      else if (activeTab === "transport") {
        // Only fetch if we have a trip plan with multiple locations
        if (tripPlan && tripPlan.days && tripPlan.days.length > 1) {
          const origin = tripPlan.days[0].locations[0];
          const destination = tripPlan.days[1].locations[0];
          
          if (origin && destination) {
            // Use tomorrow's date for transport
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            
            const response = await bookingApi.getTransportBooking(
              { name: origin.name, lat: origin.lat, lng: origin.lng },
              { name: destination.name, lat: destination.lat, lng: destination.lng },
              dateStr,
              2,
              "train",
              "AC Chair Car"
            );
            
            setTransportOptions(response.train_options || []);
          }
        }
      } 
      else if (activeTab === "food") {
        // Use current date and evening time for restaurant bookings
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        const response = await bookingApi.getRestaurants(
          currentLocation,
          dateStr,
          "19:30",
          2,
          { cuisine: ["Indian"], budget: "medium" }
        );
        
        setRestaurants(response.restaurants || []);
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab} options:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "accommodation", label: "Accommodation" },
    { id: "transport", label: "Transport" },
    { id: "food", label: "Food & Restaurant" },
  ];

  const transportButtons = [
    { id: "flight", label: "Book Flight" },
    { id: "train", label: "Book Train" },
    { id: "bus", label: "Book Bus" },
  ];

  return (
    <div style={{
      width: "100%",
      margin: "0 auto",
      padding: "20px",
      borderRadius: "20px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      backgroundColor: "#fff"
    }}>
      <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px", color: "#000" }}>
        Booking Options
      </h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              borderRadius: "999px",
              fontWeight: "600",
              cursor: "pointer",
              backgroundColor: activeTab === tab.id ? "#F97316" : "#E5E7EB",
              color: activeTab === tab.id ? "#fff" : "#000",
              border: "none",
              transition: "0.3s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ display: "inline-block", width: "50px", height: "50px", border: "5px solid #f3f3f3", borderTop: "5px solid #F97316", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Booking Content */}
      {!isLoading && (
        <div style={{ marginTop: "20px" }}>
          {/* Accommodation */}
          {activeTab === "accommodation" && (
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#F97316", marginBottom: "10px" }}>
                Available Hotels:
              </h3>
              {accommodations.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
                  {accommodations.map((hotel, index) => (
                    <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ height: "150px", backgroundColor: "#f3f4f6", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <span>Hotel Image</span>
                      </div>
                      <div style={{ padding: "15px" }}>
                        <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "5px" }}>{hotel.name}</h4>
                        <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "10px" }}>{hotel.description}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "bold", color: "#F97316" }}>₹{hotel.price_per_night}/night</span>
                          <a 
                            href={hotel.booking_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              backgroundColor: "#1E3A8A", 
                              color: "white", 
                              padding: "8px 12px", 
                              borderRadius: "6px", 
                              textDecoration: "none",
                              fontSize: "14px"
                            }}
                          >
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No accommodations available for this location.</p>
              )}
            </div>
          )}

          {/* Transport */}
          {activeTab === "transport" && (
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1E3A8A", marginBottom: "10px" }}>
                Choose Your Transport:
              </h3>
              <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "20px" }}>
                {transportButtons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => {
                      setSelectedTransport(btn.id);

                      // Redirect to respective booking site
                      if (btn.id === "flight") window.open("https://www.makemytrip.com/flights/", "_blank");
                      else if (btn.id === "train") window.open("https://www.irctc.co.in/", "_blank");
                      else if (btn.id === "bus") window.open("https://www.redbus.in/", "_blank");
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      border: "2px solid #1E3A8A",
                      backgroundColor: selectedTransport === btn.id ? "#1E3A8A" : "#fff",
                      color: selectedTransport === btn.id ? "#fff" : "#1E3A8A",
                      fontWeight: "600",
                      cursor: "pointer",
                      minWidth: "140px",
                      transition: "0.3s",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              
              {transportOptions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>Available Options:</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {transportOptions.map((option, index) => (
                      <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                          <div>
                            <span style={{ fontWeight: "bold" }}>{option.train_name}</span>
                            <span style={{ color: "#6b7280", marginLeft: "10px" }}>({option.train_number})</span>
                          </div>
                          <span style={{ fontWeight: "bold", color: "#F97316" }}>₹{option.price}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#4b5563", fontSize: "14px" }}>
                          <div>
                            <div>{option.departure_time}</div>
                            <div style={{ fontSize: "12px" }}>{option.departure_date}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", color: "#6b7280" }}>
                            <span style={{ margin: "0 10px" }}>{option.duration}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div>{option.arrival_time}</div>
                            <div style={{ fontSize: "12px" }}>{option.arrival_date}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#6b7280", fontSize: "14px" }}>Class: {option.class}</span>
                          <a 
                            href={option.booking_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              backgroundColor: "#1E3A8A", 
                              color: "white", 
                              padding: "8px 12px", 
                              borderRadius: "6px", 
                              textDecoration: "none",
                              fontSize: "14px"
                            }}
                          >
                            Book Now
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Food */}
          {activeTab === "food" && (
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#F97316", marginBottom: "10px" }}>
                Restaurants & Meals:
              </h3>
              {restaurants.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
                  {restaurants.map((restaurant, index) => (
                    <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ height: "120px", backgroundColor: "#f3f4f6", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <span>Restaurant Image</span>
                      </div>
                      <div style={{ padding: "15px" }}>
                        <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "5px" }}>{restaurant.name}</h4>
                        <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "5px" }}>{restaurant.cuisine}</p>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                          <span style={{ backgroundColor: "#10B981", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", marginRight: "8px" }}>
                            {restaurant.rating} ★
                          </span>
                          <span style={{ color: "#6b7280", fontSize: "14px" }}>{restaurant.price_range}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "bold", color: "#F97316" }}>₹{restaurant.average_cost}/person</span>
                          {restaurant.booking_available ? (
                            <a 
                              href={restaurant.booking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                backgroundColor: "#1E3A8A", 
                                color: "white", 
                                padding: "8px 12px", 
                                borderRadius: "6px", 
                                textDecoration: "none",
                                fontSize: "14px"
                              }}
                            >
                              Book Table
                            </a>
                          ) : (
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>No online booking</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No restaurants available for this location.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}