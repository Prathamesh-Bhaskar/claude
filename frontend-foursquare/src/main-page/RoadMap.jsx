// src/main-page/RoadMap.jsx
import React from "react";
import { MapPin, Calendar, Clock, Star } from "lucide-react";

export default function RoadMap({ title, days = [] }) {
  if (!days || days.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No itinerary available yet. Plan your trip to see the details!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">{title}</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-orange-500 ml-1"></div>
        
        {/* Days */}
        <div className="space-y-8">
          {days.map((day, index) => (
            <div key={index} className="relative pl-12">
              {/* Day marker */}
              <div className="absolute left-0 top-0 rounded-full bg-orange-500 text-white w-10 h-10 flex items-center justify-center shadow-md">
                <span className="text-sm font-medium">{day.day}</span>
              </div>
              
              {/* Day content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h4 className="font-bold text-gray-800 flex items-center">
                  <Calendar className="mr-2 text-orange-500" size={16} />
                  {day.title}
                </h4>
                
                {day.description && (
                  <p className="text-gray-600 text-sm mt-1 mb-3">{day.description}</p>
                )}
                
                {/* Locations */}
                <div className="space-y-3 mt-3">
                  {day.locations.map((location, locIndex) => (
                    <div key={locIndex} className="pl-4 border-l-2 border-orange-200">
                      <h5 className="font-medium text-gray-800 flex items-center">
                        <MapPin className="mr-1 text-orange-500 flex-shrink-0" size={14} />
                        {location.name}
                      </h5>
                      
                      {location.description && (
                        <p className="text-gray-600 text-sm mt-1">{location.description}</p>
                      )}
                      
                      {/* Activities */}
                      {location.activities && location.activities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {location.activities.map((activity, actIndex) => (
                            <div
                              key={actIndex}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"
                            >
                              <Star className="mr-1" size={10} />
                              {activity}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}