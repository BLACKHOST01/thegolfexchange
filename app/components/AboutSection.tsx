"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import dbs from "@/public/details-ball-sport.webp";
import team1 from "@/public/scene.webp";
import team2 from "@/public/scene.webp";
import team3 from "@/public/scene.webp";

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

// ✅ Staggered parent container for team members
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function AboutSection() {
  return (
    <section className="py-20 px-6 md:px-12 bg-gray-50 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* --- About Us --- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="grid md:grid-cols-2 gap-10 items-center"
        >
          <div className="space-y-6">
            <h3 className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
              About Us
            </h3>

            <p className="text-gray-700 leading-relaxed">
              The Golf Exchange is your premier online destination for golf
              enthusiasts. We bring together players, equipment experts, and
              fans in one thriving community — where buying, selling, and
              connecting happen seamlessly.
            </p>

            <a
              href="#membership"
              className="inline-block text-blue-600 font-medium hover:text-blue-800 transition"
            >
              Interested in membership?
            </a>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
              A Premier Golf Destination Delivering an Unmatched Experience
            </h2>

            <div className="rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={dbs}
                alt="Golf course with tees"
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* --- Our Mission --- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-white rounded-2xl shadow-md p-8 md:p-12"
        >
          <h3 className="text-blue-600 uppercase text-sm font-semibold tracking-wide mb-2">
            Our Mission
          </h3>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Empowering Golfers with Access, Community, and Innovation
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We’re redefining how golfers engage with the sport — from finding
            the perfect clubs and accessories to connecting with a passionate
            network of players. Our mission is to make golf more inclusive,
            affordable, and enjoyable for everyone, whether you’re a beginner or
            a seasoned professional.
          </p>
        </motion.div>

        {/* --- Meet Our Team --- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h3 className="text-blue-600 uppercase text-sm font-semibold tracking-wide mb-2 text-center">
            Meet Our Team
          </h3>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            The Faces Behind The Golf Exchange
          </h2>

          {/* ✅ Stagger animation for each team card */}
          <motion.div
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {[ 
              { src: team1, name: "James Walker", role: "Founder & CEO" },
              { src: team2, name: "Sophia Green", role: "Marketing Director" },
              { src: team3, name: "Daniel Brooks", role: "Head of Operations" },
            ].map((member, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white rounded-xl shadow-md overflow-hidden text-center p-6 hover:shadow-lg transition"
              >
                <Image
                  src={member.src}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h4 className="font-semibold text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-500">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* --- Optional CTA --- */}
          <motion.div variants={fadeUp} className="text-center mt-12">
            <a
              href="/careers"
              className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition"
            >
              Join Our Team
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
