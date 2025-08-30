import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";
import { useNavigate } from "react-router-dom"; // ✅ import useNavigate

import bg1 from "../assets/bg1.jpg";
import bg2 from "../assets/bg2.jpg";
import bg3 from "../assets/bg3.jpg";
import bg4 from "../assets/bg4.jpg";
import horizonBg from "../assets/Horizon-Background.jpg";

export default function Hero() {
  const images = [horizonBg, bg1, bg2, bg3, bg4];
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate(); // ✅ initialize

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section
      className="relative flex flex-col items-center justify-center text-center min-h-[85vh] text-white px-6 transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: `url(${images[currentImage]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl font-extrabold mb-4"
        >
          Plan Your Perfect Trip with AI ✈️
        </motion.h1>

        <p className="text-lg max-w-2xl mb-6">
          <Typewriter
            words={[
              "Create personalized journeys effortlessly, optimized for comfort, savings, and unforgettable travel memories worldwide."
            ]}
            loop={0}
            cursor
            cursorStyle="|"
            typeSpeed={50}
            deleteSpeed={20}
            delaySpeed={2000}
          />
        </p>

        {/* ✅ Updated button */}
        <button
          onClick={() => navigate("/main")}
          className="px-10 py-4 bg-orange text-white font-bold rounded-full border border-white shadow transition-all duration-300 hover:shadow-[0_0_35px_rgba(34,211,238,1)] hover:scale-110"
        >
          Start Planning with Horizon
        </button>
      </div>
    </section>
  );
}
