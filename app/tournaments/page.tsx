// "use client";

import React from "react";
import contact from "@/public/many-golf.webp";
import { HeroSection } from "../components/ui/HeroSection";
import Divider from "../components/ui/Divider";

const Tournaments = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection
        title="Tournaments"
        description="Join thrilling golf tournaments, showcase your skills, and connect with passionate golfers from all over. Explore upcoming events, register, or view past tournament highlights—all in one place."
        backgroundImages={[contact]}
      />

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Upcoming Tournaments</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <img
                  src="/tournament-placeholder.jpg"
                  alt={`Tournament ${i}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Golf Masters {2025 + i}</h3>
                  <p className="text-gray-600 mb-4">
                    Join us for the {2025 + i} season’s biggest event at The Golf Exchange.
                  </p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      <section className="py-20 bg-green-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Want to Host a Tournament?</h2>
        <p className="max-w-2xl mx-auto mb-6">
          Partner with The Golf Exchange to host your own event. We'll handle registration, promotions, and logistics—so you can focus on the game.
        </p>
        <a
          href="/contact"
          className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200"
        >
          Get Started
        </a>
      </section>
    </div>
  );
};

export default Tournaments;
