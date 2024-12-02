import { motion } from 'framer-motion';
import { REACTION_TYPES } from '../services/reactionService';

export default function ReactionDisplay({ reactions }) {
  // Sort reactions by count in descending order
  const sortedReactions = Object.entries(reactions || {})
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0);

  if (sortedReactions.length === 0) return null;

  return (
    <motion.div 
      className="flex items-center gap-1 text-sm text-base-content/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex -space-x-1">
        {sortedReactions.slice(0, 3).map(([type]) => (
          <div 
            key={type}
            className="w-5 h-5 flex items-center justify-center bg-base-200 rounded-full"
            title={REACTION_TYPES[type.toUpperCase()]?.label}
          >
            <span className="text-sm">
              {REACTION_TYPES[type.toUpperCase()]?.emoji}
            </span>
          </div>
        ))}
      </div>
      <span className="text-xs">
        {sortedReactions.reduce((sum, [, count]) => sum + count, 0)}
      </span>
    </motion.div>
  );
}
