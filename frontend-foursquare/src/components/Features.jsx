import { motion } from "framer-motion";
import { Map, Clock, Utensils } from "lucide-react";

export default function Features() {
  const features = [
    { icon: <Map size={44} />, title: "Smart Routes", desc: "Get personalized routes designed to maximize your travel experience." },
    { icon: <Clock size={44} />, title: "Save Time", desc: "Cut hours of planning into minutes with instant smart suggestions." },
    { icon: <Utensils size={44} />, title: "Local Cuisine", desc: "Taste the city like a local with curated dining picks." },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-14"
        >
          Why Choose Us?
        </motion.h2>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2, duration: 0.01 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-center mb-6 text-orange-500">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">{f.title}</h3>
              <p className="text-gray-600 mt-3 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
