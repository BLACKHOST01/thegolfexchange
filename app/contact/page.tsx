"use client";

import React from "react";
import Image from "next/image";
import contact from "@/public/many-golf.webp";
import { HeroSection } from "../components/ui/HeroSection";
import Divider from "../components/ui/Divider";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";

const ContactPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection
        title="Get in Touch"
        description="We’re always here to help — whether you’re looking for the perfect golf gear, need assistance with an order, or want to collaborate with The Golf Exchange. Reach out anytime!"
        backgroundImages={[contact]}
      >
        <Divider />
      </HeroSection>

      {/* Contact Info Cards */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8 text-center">
        {[
          {
            icon: <Phone className="w-8 h-8 text-green-600 mx-auto mb-4" />,
            title: "Call Us",
            detail: "+234 801 234 5678",
          },
          {
            icon: <Mail className="w-8 h-8 text-green-600 mx-auto mb-4" />,
            title: "Email Us",
            detail: "support@thegolfexchange.com",
          },
          {
            icon: <MapPin className="w-8 h-8 text-green-600 mx-auto mb-4" />,
            title: "Visit Us",
            detail: "Golf House, Jos, Nigeria",
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white shadow-lg rounded-2xl p-8 hover:shadow-xl transition"
          >
            {item.icon}
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.detail}</p>
          </motion.div>
        ))}
      </section>

      {/* Contact Form Section */}
      <section className="flex-1 max-w-4xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-10"
        >
          Send Us a Message
        </motion.h2>

        <motion.form
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 bg-white shadow-lg rounded-2xl p-8"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              placeholder="Write your message here..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Send Message
          </button>
        </motion.form>
      </section>

      {/* Optional Map Section */}
      <section className="w-full h-[400px]">
        <iframe
          title="Golf Exchange Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.091807761987!2d8.8793!3d9.9301!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104b8d78b44b9c47%3A0x6d9e3e5b3c54632a!2sJos%2C%20Nigeria!5e0!3m2!1sen!2sng!4v1698765432100!5m2!1sen!2sng"
          className="w-full h-full border-0"
          loading="lazy"
        ></iframe>
      </section>
    </div>
  );
};

export default ContactPage;
