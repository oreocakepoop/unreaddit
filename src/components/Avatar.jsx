import { motion } from 'framer-motion';

export default function Avatar({ size = 'md', photoURL, seed, className = '' }) {
  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  };

  const generateAvatarUrl = (seed) => {
    return `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`avatar ${className}`}
    >
      <div className={`rounded-full ${sizeClasses[size]}`}>
        <img
          src={photoURL || generateAvatarUrl(seed)}
          alt="Avatar"
          className="object-cover rounded-full"
        />
      </div>
    </motion.div>
  );
}
