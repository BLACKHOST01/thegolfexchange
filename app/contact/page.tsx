"use client";

import React, { useState } from "react";
import Image from "next/image";
import contact from "@/public/many-golf.webp";
import { HeroSection } from "../components/ui/HeroSection";
import Divider from "../components/ui/Divider";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";

const ContactPage = () => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setStatus("success");
      e.currentTarget.reset();
    } else {
      setStatus("error");
    }
  };

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
            detail: "+1 801 234 5678",
          },
          {
            icon: <Mail className="w-8 h-8 text-green-600 mx-auto mb-4" />,
            title: "Email Us",
            detail: "support@thegolfexchange.com",
          },
          {
            icon: <MapPin className="w-8 h-8 text-green-600 mx-auto mb-4" />,
            title: "Visit Us",
            detail: "Golf House, Florida, USA",
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

      {/* Contact Form */}
      <section className="flex-1 max-w-4xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-10"
        >
          Send Us a Message
        </motion.h2>

        <motion.form
          onSubmit={handleSubmit}
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
              name="name"
              type="text"
              required
              placeholder="Enter your full name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="Enter your email address"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              name="message"
              required
              placeholder="Write your message here..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            {status === "loading" ? "Sending..." : "Send Message"}
          </button>

          {status === "success" && (
            <p className="text-green-600 text-center pt-2">
              ✅ Message sent! We’ll get back to you soon.
            </p>
          )}
          {status === "error" && (
            <p className="text-red-600 text-center pt-2">
              ❌ Something went wrong. Please try again.
            </p>
          )}
        </motion.form>
      </section>

      {/* Map */}
      {/* Map */}
      <section className="w-full h-[400px]">
        <iframe
          title="Golf Exchange Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3585874.252906039!2d-84.2783!3d27.9944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e77b4fdfddf5ad%3A0xbee5cf6d1a6390d3!2sFlorida%2C%20USA!5e0!3m2!1sen!2sus!4v1698765432100!5m2!1sen!2sus"
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        ></iframe>
      </section>
    </div>
  );
};

export default ContactPage;
