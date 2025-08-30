import { useEffect, useState } from "react";

// Import images
import a1 from "../assets/a1.jpg";
import a2 from "../assets/a2.jpg";
import a3 from "../assets/a3.jpg";

import r1 from "../assets/r1.jpg";
import r2 from "../assets/r2.jpg";
import r3 from "../assets/r3.jpg";

import s1 from "../assets/s1.jpg";
import s2 from "../assets/s2.jpg";
import s3 from "../assets/s3.jpg";

const testimonials = [
  {
    name: "Aditi",
    role: "Travel Enthusiast",
    images: [a1, a2, a3],
    interval: 3000, // 3 sec
    text: "Horizon made my trip planning effortless. From hotels to activities, everything was smooth!",
  },
  {
    name: "Rohan",
    role: "Adventure Seeker",
    images: [r1, r2, r3],
    interval: 3200, // 3.2 sec
    text: "Loved the AI recommendations! Found hidden gems I would’ve missed otherwise.",
  },
  {
    name: "Sophia",
    role: "Explorer",
    images: [s1, s2, s3],
    interval: 3100, // 3.1 sec
    text: "Honestly the best tool I’ve used for travel. Horizon made my journey stress-free!",
  },
  {
    name: "Arjun",
    role: "Globetrotter",
    images: [a2, s2, r3],
    interval: 3300, // 3.3 sec
    text: "Planning with Horizon felt like having a personal travel assistant with me all the time!",
  },
];

const TestimonialCard = ({ name, role, images, interval, text }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const slider = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(slider);
  }, [images.length, interval]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center max-w-sm w-full hover:shadow-2xl transition-shadow duration-300">
      {/* Sliding Image Carousel */}
      <div className="w-64 h-44 overflow-hidden rounded-lg border-2 border-orange-200 shadow-md">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${name}-${i}`}
              className="w-50 h-44 object-cover flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Name + Role */}
      <h3 className="mt-4 text-xl font-bold text-gray-800">{name}</h3>
      <p className="text-gray-500 text-sm">{role}</p>

      {/* Quote */}
      <p className="mt-4 text-gray-600 text-center text-sm italic">“{text}”</p>
    </div>
  );
};

export default function Testimonial() {
  return (
    <section className="py-16 bg-gradient-to-r from-orange-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          See How Horizon Transforms Travel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
