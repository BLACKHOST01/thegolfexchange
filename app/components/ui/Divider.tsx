"use client";

import { motion } from "framer-motion";

export const Divider = ({ variant = "horizontal", animated = false }) => {
  const dividerVariants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: { opacity: 1, scaleX: 1 }
  };

  const commonClasses = "border-gray-200 my-8 ";
  
  return (
    <motion.div
      initial={animated ? "hidden" : false}
      animate={animated ? "visible" : false}
      variants={dividerVariants}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`${
        variant === "horizontal" 
          ? `w-full border-t ${commonClasses}`
          : `h-full border-l ${commonClasses} mx-8`
      }`}
    />
  );
};

export default Divider;
