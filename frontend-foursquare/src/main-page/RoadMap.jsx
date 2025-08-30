// src/main-page/RoadMap.jsx
import React, { useState, useEffect, useRef } from 'react';

const AnimatedRoadmap = ({ title = "Your Journey", days = [] }) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const itemRefs = useRef([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, days.length);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => {
              if (!prev.includes(index)) {
                return [...prev, index];
              }
              return prev;
            });
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of the card is visible
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      itemRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [days]);

  return (
    <div className="min-h-50 bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-black mb-4">
            {title} {/* Roadmap title */}
          </h1>
        </div>

        {/* Horizontal Roadmap */}
        <div className="relative overflow-x-auto pb-8">
          <div className="flex space-x-4 md:space-x-8 min-w-max">
            {days.map((day, index) => {
              const isVisible = visibleItems.includes(index);

              return (
                <div
                  key={index}
                  className="relative flex-shrink-0"
                  ref={(el) => (itemRefs.current[index] = el)}
                >
                  {/* Day Card */}
                  <div
                    className={`w-64 md:w-80 transition-all duration-1000 ${
                      isVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className={`bg-orange-500 rounded-lg p-6 shadow-2xl transform transition-all duration-700 hover:scale-105 ${
                      isVisible ? 'scale-100' : 'scale-95'
                    }`}>
                      {/* Day Number */}
                      <div className="flex items-center justify-center mb-4">
                        <span className="bg-white text-orange-500 px-4 py-2 rounded-full text-lg font-bold">
                          Day {index + 1}
                        </span>
                      </div>
                      
                      {/* Day Title */}
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3 text-center">
                        {day.title} {/* Day title */}
                      </h3>
                      
                      {/* Day Subtitle */}
                      <p className="text-white text-center text-sm md:text-base leading-relaxed">
                        {day.subtitle} {/* Day subtitle */}
                      </p>
                      
                      {/* Animated Progress Bar */}
                      <div className="w-full bg-orange-300 rounded-full h-2 mt-6">
                        <div 
                          className={`bg-white h-2 rounded-full transition-all duration-1000 ${
                            isVisible ? 'w-full' : 'w-0'
                          }`}
                          style={{ transitionDelay: `${index * 200 + 500}ms` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  {index < days.length - 1 && (
                    <div className="absolute top-1/2 -right-4 md:-right-8 transform -translate-y-1/2 z-10">
                      <div className={`w-8 h-8 transition-all duration-500 ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <svg className="w-full h-full text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Roadmap component that receives props
const RoadMap = ({ title, days }) => {
  // Use provided data or fallback to defaults
  const roadmapTitle = title || "Your Journey Plan";
  const roadmapDays = days && days.length > 0 ? days : [
    { title: "Starting Point", subtitle: "Begin your adventure" },
    { title: "Exploration", subtitle: "Discover new places" },
    { title: "Relaxation", subtitle: "Enjoy and unwind" }
  ];

  return <AnimatedRoadmap title={roadmapTitle} days={roadmapDays} />;
};

export default RoadMap;