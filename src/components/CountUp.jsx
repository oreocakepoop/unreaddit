import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CountUp = ({ value = 0, className = '' }) => {
  const previousValue = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    // Ensure value is a number
    const numericValue = Number(value) || 0;
    const numericPrevValue = Number(previousValue.current) || 0;
    
    if (numericValue !== numericPrevValue) {
      setIsAnimating(true);
      const duration = 2000; // 2 seconds
      const frames = 60;
      const increment = (numericValue - numericPrevValue) / frames;
      let currentFrame = 0;
      
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const newValue = Math.round(
          numericPrevValue + (numericValue - numericPrevValue) * easeOutQuart
        );
        
        setDisplayValue(newValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          previousValue.current = numericValue;
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [value]);

  const formattedValue = Number(displayValue).toLocaleString() || '0';

  return (
    <div className={`${className} relative overflow-hidden h-[1.5em]`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={displayValue}
          initial={{ y: value > previousValue.current ? 20 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: value > previousValue.current ? -20 : 20, opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 100, damping: 15, duration: 0.5 },
            opacity: { duration: 0.2 }
          }}
          className="absolute w-full text-center"
        >
          {formattedValue}
        </motion.div>
      </AnimatePresence>
      <div className="invisible">{formattedValue}</div>
    </div>
  );
};

export default CountUp;
