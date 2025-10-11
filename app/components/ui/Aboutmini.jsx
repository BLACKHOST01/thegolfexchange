import { motion } from 'framer-motion';
import React from 'react';


const Aboutmini = ({ 
  image, 
  title, 
  description,
  background = 'bg-gradient-to-b from-blue-200/50 to-white',
  GridStyle = 'grid grid-cols-1 md:grid-cols-2',
  imageMaxHeight = '400px',
  hoverEffect = true
}) => {
  return (
    <motion.div 
      className={`${GridStyle}  gap-8 items-center justify-center sm:px-0 lg:px-0 ${background} rounded-lg shadow-lg`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 0.6 }}
    >
      {/* Image Section with Text Overlay */}
      <motion.div 
        className="relative w-full h-98 overflow-hidden shadow-lg"
        initial={{ scale: 0.95 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.img 
          src={image} 
          alt="Mission visual" 
          className={`w-full h-auto object-cover transition-transform duration-300 ${
            hoverEffect ? 'transform hover:scale-105' : ''
          }`}
          style={{ maxHeight: imageMaxHeight }}
          loading="lazy"
          whileHover={{ scale: hoverEffect ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        
        {/* Mobile Overlay */}
        <motion.div 
          className="absolute inset-0 md:hidden flex items-center justify-center bg-black/30 p-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div 
            className="text-center space-y-4"
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
          >
            <h1 className="text-3xl font-bold text-blue-400 ">
              {title}
            </h1>
            <p className="text-lg text-white leading-relaxed ">
              {description}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Desktop Text Content */}
      <motion.div 
        className="hidden md:block space-y-6 md:px-8"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 md:text-left">
          {title}
        </h1>
        <p className="text-lg text-gray-700 bg-white/50 rounded-e-4xl rounded-bl-4xl p-6 backdrop-blur-sm leading-relaxed md:text-left">
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
};


export default Aboutmini;