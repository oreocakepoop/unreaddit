import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REACTION_TYPES } from '../services/reactionService';

export default function ReactionPicker({ onSelect, currentReaction, position = 'top' }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (reactionType) => {
    onSelect(reactionType);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-ghost btn-sm p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xl">
          {currentReaction 
            ? REACTION_TYPES[currentReaction.toUpperCase()]?.emoji 
            : REACTION_TYPES.LIKE.emoji}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50`}
          >
            <div className="bg-base-200 rounded-full shadow-lg p-1 flex gap-1">
              {Object.values(REACTION_TYPES).map((reaction) => (
                <motion.button
                  key={reaction.type}
                  type="button"
                  className="btn btn-ghost btn-sm btn-circle"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSelect(reaction.type)}
                  title={reaction.label}
                >
                  <span className="text-xl">{reaction.emoji}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
