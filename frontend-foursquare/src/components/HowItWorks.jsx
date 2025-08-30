import { Settings, Bot, Plane } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    { 
      step: "01", 
      title: "Tell us your preferences", 
      desc: "Choose destinations, budget, and travel style that match your dreams.",
      icon: Settings
    },
    { 
      step: "02", 
      title: "AI builds your trip", 
      desc: "Our smart AI crafts a personalized itinerary just for you.",
      icon: Bot
    },
    { 
      step: "03", 
      title: "Enjoy your journey", 
      desc: "Travel stress-free with everything perfectly planned and organized.",
      icon: Plane
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h3 className="text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Turn your travel dreams into reality with a fast, easy, and three-step process.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={index}
                className="relative group flex-1 max-w-sm"
              >
                {/* Connection arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 -right-8 w-6 h-6">
                    <div className="w-full h-0.5 bg-gradient-to-r from-orange-300 to-red-300 absolute top-1/2 transform -translate-y-1/2"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-red-300 border-y-2 border-y-transparent"></div>
                  </div>
                )}
                
                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                      {/* gradient text applied to icons */}
                      <IconComponent className="w-8 h-8  bg-clip-text bg-gradient-to-br from-white-400 to-white-500" />
                    </div>
                    
                    <div className="text-sm font-bold text-red-600 mb-2">
                      STEP {step.step}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
