import { Routes, Route } from "react-router-dom";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar"
import MainPage from "./main-page/MainPage"; // Chat + Map page
import 'leaflet/dist/leaflet.css';


function App() {
  return (
    <Routes>
      {/* Home page */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Hero />          {/* Hero will contain the redirect button */}
            <Features />
            <HowItWorks />
            <Testimonials />
            <CTA />
            <Footer />
          </>
        }
      />

      {/* MainPage with Chat and Map */}
      <Route path="/main" element={<MainPage />} />
    </Routes>
  );
}

export default App;
