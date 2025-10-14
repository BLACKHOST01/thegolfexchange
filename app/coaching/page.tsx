// "use client";

import React from "react";
import contact from "@/public/many-golf.webp"; // ✅ replace with your actual image
import { HeroSection } from "../components/ui/HeroSection";
import Divider from "../components/ui/Divider";

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection
        title="Contact Us"
        description="We'd love to hear from you! Whether you have questions about our shipping services, need a quote, or want to discuss your logistics needs, our team is here to help. Reach out to us via the contact form below, email, or phone. We're committed to providing exceptional customer service and look forward to assisting you with all your shipping requirements."
        backgroundImages={[contact]}
      >
        <Divider />
      </HeroSection>

      {/* Contact Form Section (optional) */}
      <section className="flex-1 max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
        <form className="space-y-6">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Send Message
          </button>
        </form>
      </section>
    </div>
  );
};

export default Page;
