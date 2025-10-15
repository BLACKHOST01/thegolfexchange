"use client";

import React from "react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import coachingImg from "@/public/scene.webp";
import coach1 from "@/public/man-having.webp"; // ✅ Replace with your actual coach images
import coach2 from "@/public/man-having.webp";
import coach3 from "@/public/man-having.webp";
import { HeroSection } from "../components/ui/HeroSection";
import Divider from "../components/ui/Divider";

// ✅ Type-safe animation variant
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1], // ✅ Type-safe easing curve
    },
  },
};

// // ✅ Staggered parent container for team members
// const staggerContainer: Variants = {
//   hidden: { opacity: 0 },
//   show: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.2,
//     },
//   },
// };


const Coaching = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection
        title="Golf Coaching"
        description="Master your swing, sharpen your focus, and play with confidence. Our professional coaching programs are designed to bring out the best golfer in you — whether you’re a beginner or a pro."
        backgroundImages={[coachingImg]}
      >
        <Divider />
      </HeroSection>

      {/* Coaching Programs */}
      <section className="py-20 px-6 md:px-20 bg-gray-50 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-6 text-green-800"
        >
          Our Coaching Programs
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-gray-600 mb-12 max-w-3xl mx-auto"
        >
          Choose from flexible, structured coaching paths designed for all skill levels — each led by experienced golf professionals passionate about helping you grow.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Beginner Program",
              desc: "Learn the fundamentals — grip, posture, swing rhythm, and course awareness. Perfect for newcomers to the sport.",
            },
            {
              title: "Intermediate Program",
              desc: "Refine your techniques with advanced drills, ball control strategies, and personalized progress tracking.",
            },
            {
              title: "Professional Program",
              desc: "For competitive players — optimize performance with mental coaching, advanced analytics, and elite training routines.",
            },
          ].map((plan, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-white shadow-lg rounded-2xl p-8 hover:shadow-2xl transition-all"
            >
              <h3 className="text-xl font-semibold text-green-700 mb-3">{plan.title}</h3>
              <p className="text-gray-600">{plan.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Coaches Section */}
      <section className="py-20 px-6 md:px-20 bg-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-green-800">
          Meet Our Coaches
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              img: coach1,
              name: "James Carter",
              title: "PGA Certified Instructor",
              desc: "Over 15 years of experience coaching amateur and professional golfers with a focus on swing optimization.",
            },
            {
              img: coach2,
              name: "Samantha Li",
              title: "Performance Specialist",
              desc: "Former tour player turned coach. Specializes in short game precision and putting consistency.",
            },
            {
              img: coach3,
              name: "David Okafor",
              title: "Mental & Strategy Coach",
              desc: "Helps players strengthen focus, confidence, and game strategy for competitive play.",
            },
          ].map((coach, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-gray-50 rounded-2xl shadow-md hover:shadow-xl p-6"
            >
              <Image
                src={coach.img}
                alt={coach.name}
                className="rounded-full mx-auto mb-6 object-cover"
                width={160}
                height={160}
              />
              <h3 className="text-xl font-semibold text-green-700">{coach.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{coach.title}</p>
              <p className="text-gray-600 text-sm">{coach.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 md:px-20 bg-green-900 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">What Our Golfers Say</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              quote:
                "Coach James helped me find confidence in my swing — I went from beginner to breaking 80 in less than a year!",
              name: "Daniel Brooks",
            },
            {
              quote:
                "The personalized sessions and feedback videos made a huge difference. Highly recommend The Golf Exchange.",
              name: "Amira Bello",
            },
            {
              quote:
                "Best coaching experience ever. My consistency and short game have improved beyond expectations.",
              name: "Victor Ade",
            },
          ].map((testimonial, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-white text-green-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition"
            >
              <p className="italic mb-4">“{testimonial.quote}”</p>
              <h4 className="font-semibold">{testimonial.name}</h4>
            </motion.div>
          ))}
        </div>
      </section>

   

      {/* Call to Action */}
      <section className="py-20 bg-green-800 text-white text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-6"
        >
          Start Your Coaching Journey Today
        </motion.h2>
        <p className="max-w-2xl mx-auto mb-10 text-gray-200">
          Join The Golf Exchange Coaching Program and experience the difference
          that expert guidance makes. Let’s build your best game — together.
        </p>
        <a
          href="/signup"
          className="inline-block bg-white text-green-800 font-semibold py-3 px-8 rounded-full hover:bg-green-100 transition"
        >
          Book a Session
        </a>
      </section>

      <Divider />
    </div>
  );
};

export default Coaching;
