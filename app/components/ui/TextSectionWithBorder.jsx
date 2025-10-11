import { motion } from 'framer-motion';

const TextSectionWithBorder = ({ 
  title, 
  description,
  background = 'bg-white',
  borderColor = 'border-blue-400',
  borderWidth = 'border-l-2',
  padding = 'py-4'
}) => {
  return (
    <motion.div 
      className={`${background}  rounded-lg p-6 md:p-8`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 0.6 }}
    >
      <div className="grid grid-cols-1  md:grid-cols-3 gap-8 items-start justify-center h-full">
        {/* Title Column */}
        <motion.div 
          className="md:pr-8"
          initial={{ x: -20 }}
          whileInView={{ x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-right font-bold text-gray-900">
            {title}
          </h1>
        </motion.div>

        {/* Border and Description Column */}
        <div className="relative">
          {/* Vertical Border */}
          <motion.div
            className={`absolute left-0 top-0 h-full ${borderWidth} ${borderColor}`}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ originY: 0 }}
          />

          {/* Description */}
          <motion.div
            className="md:pl-8 pl-4 text-lg text-gray-700"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {description}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default TextSectionWithBorder;