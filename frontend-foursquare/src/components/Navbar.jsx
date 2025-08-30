import { useState, useEffect } from "react";
import bikeVideo from "../assets/Traveler.mp4";
import shipVideo from "../assets/Traveler.mp4";
import planVideo from "../assets/Traveler.mp4";

export default function Navbar() {
  const videos = [bikeVideo, shipVideo, planVideo];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 3000); // change video every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-md fixed w-full z-50">
      <h2 className="text-2xl font-bold text-red-600">Horizon</h2>

      {/* Video Slideshow */}
      <div className="hidden md:flex w-15 h-8 overflow-hidden rounded-md">
        <video
          key={currentIndex}
          src={videos[currentIndex]}
          autoPlay
          muted
          loop={false}
          className="w-full h-full object-cover rounded-md"
        />
      </div>
    </nav>
  );
}
