"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StaticImageData } from "next/image";

interface HeroSectionProps {
  backgroundImages?: (string | StaticImageData)[];
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const HeroSection = ({
  backgroundImages = [],
  title,
  description,
  children,
}: HeroSectionProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cycle through background images
  useEffect(() => {
    if (backgroundImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % backgroundImages.length
        );
      }, 10000); // 10s cycle (5 zoom + 5 hold)
      return () => clearInterval(interval);
    }
  }, [backgroundImages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
      className="h-[100vh] flex items-center justify-center md:justify-start relative overflow-hidden"
    >
      <AnimatePresence mode="popLayout">
        {backgroundImages.map(
          (image, index) =>
            index === currentImageIndex && (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: 1,
                  scale: 1.1,
                  transition: { duration: 5, ease: "linear", delay: 0.5 },
                }}
                exit={{
                  opacity: 0,
                  scale: 1.2,
                  transition: { duration: 1.5, ease: [0.4, 0, 0.2, 1] },
                }}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${
                    typeof image === "string" ? image : image.src
                  })`,
                  backgroundColor: "transparent",
                  willChange: "transform, opacity",
                }}
              />
            )
        )}
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />

      {/* Content */}
      <div className="p-6 md:p-8 rounded-lg mx-auto md:mx-0 md:ml-[10%] lg:ml-[15%] max-w-[90%] md:max-w-2xl relative z-10 text-center md:text-left">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.8,
            ease: [0.6, -0.05, 0.01, 0.99],
          }}
          className="text-3xl bg-blue-900/50 p-4 md:text-3xl lg:text-6xl font-extrabold text-white mb-4 md:mb-6"
        >
          {title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.4,
            duration: 1,
            ease: [0.6, -0.05, 0.01, 0.99],
          }}
        >
          <p className="text-base leading-loose font-bold md:text-lg bg-black/50 p-4 rounded-md text-gray-200 mb-4 md:mb-6 md:text-justify">
            {description}
          </p>
          <motion.div
            className="flex flex-col md:flex-row gap-4 justify-center md:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
