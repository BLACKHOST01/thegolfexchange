"use client";
import React from "react";
import { motion } from "framer-motion";

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  price,
  features,
  highlighted = false,
  buttonText,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`bg-white dark:bg-black dark:text-white rounded-2xl text-gray-900 p-6 flex flex-col items-center text-center shadow-lg transition ${
        highlighted ? "border-2 border-blue-600 shadow-2xl" : ""
      }`}
    >
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className=" mb-6">{description}</p>
      <p className="text-4xl font-bold mb-4">
        {price}
        <span className="text-lg">/mo</span>
      </p>

      <ul className=" space-y-2 mb-6">
        {features.map((feature, i) => (
          <li
            key={i}
            className="transition hover:translate-x-2 hover:text-blue-600"
          >
            ✔ {feature}
          </li>
        ))}
      </ul>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`px-6 py-3 rounded-xl transition font-medium ${
          highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
};
