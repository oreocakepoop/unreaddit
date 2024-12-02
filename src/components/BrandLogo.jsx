import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function BrandLogo() {
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-100, 100], [30, -30]);
  const rotateY = useTransform(mouseX, [-100, 100], [-30, 30]);

  useEffect(() => {
    controls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity }
    });
  }, []);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  return (
    <motion.div 
      className="flex items-center justify-center w-full h-full select-none"
      onMouseMove={handleMouseMove}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative w-32 h-32"
        animate={controls}
        whileHover="hover"
        style={{ rotateX, rotateY }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Glowing background effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary blur-xl opacity-50"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Main logo container */}
        <motion.div 
          className="absolute inset-0 rounded-2xl bg-base-100 backdrop-blur-sm border border-primary/30"
          style={{ 
            transformStyle: "preserve-3d",
            boxShadow: "0 0 20px rgba(var(--p), 0.3)"
          }}
        >
          {/* Animated rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl border-2 border-primary/30"
              animate={{
                rotate: [0, 360],
                scale: [1 - i * 0.1, 1.1 - i * 0.1, 1 - i * 0.1],
              }}
              transition={{
                duration: 8 - i * 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Central "U" with 3D effect */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: "translateZ(20px)" }}
          >
            <motion.span
              className="text-5xl font-black bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent"
              animate={{
                textShadow: isHovered 
                  ? "0 0 20px rgba(var(--p), 0.5)" 
                  : "0 0 10px rgba(var(--p), 0.3)",
              }}
            >
              U
            </motion.span>
          </motion.div>

          {/* Particle effects */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary"
              style={{
                left: `${50 + 35 * Math.cos(i * Math.PI / 4)}%`,
                top: `${50 + 35 * Math.sin(i * Math.PI / 4)}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
