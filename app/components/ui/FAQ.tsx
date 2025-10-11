"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type FAQ = {
  q: string;
  a: string;
};

interface FAQSectionProps {
  title?: string;
  faqs: FAQ[];
}

const FAQSection: React.FC<FAQSectionProps> = ({
  title = "Frequently Asked Questions",
  faqs,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gradient-to-b from-gray-50 to-gray-100 dark:bg-gradient-to-b dark:text-white dark:from-gray-900 dark:to-gray-900 py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-4xl font-extrabold text-center mb-12">
          {title}
        </h2>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              onClick={() => toggleFAQ(i)}
              className=" rounded-2xl shadow-md border border-gray-200 p-5 cursor-pointer hover:shadow-xl transition"
              whileHover={{ scale: 1.01 }}
            >
              {/* Question Row */}
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  {faq.q}
                </h3>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl text-blue-600 select-none"
                >
                  {openIndex === i ? "−" : "+"}
                </motion.span>
              </div>

              {/* Answer with Collapse Animation */}
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className=" mt-3 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
