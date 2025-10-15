"use client";

import { motion } from "framer-motion";

const stats = [
  {
    number: "750+",
    label: "Active Members",
    desc: "Join a thriving community of passionate golfers and friendly seekers.",
  },
  {
    number: "180+",
    label: "Scenic Acres",
    desc: "Enjoy the game across beautifully maintained and expansive grounds.",
  },
  {
    number: "42+",
    label: "Annual Events",
    desc: "From tournaments to socials—there’s always something happening here.",
  },
  {
    number: "56+",
    label: "Monthly Lessons",
    desc: "Sharpen your skills with expert-led golf instruction all month long.",
  },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-neutral-50 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">
            By the Numbers, What Sets Us Apart
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {stats.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col items-center space-y-3"
            >
              <h3 className="text-5xl font-bold text-gray-900">{item.number}</h3>
              <h4 className="text-lg font-semibold text-gray-800">
                {item.label}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
