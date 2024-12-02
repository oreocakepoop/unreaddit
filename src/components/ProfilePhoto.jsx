import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';

// Add gradient animation styles
const gradientStyles = document.createElement('style');
gradientStyles.textContent = `
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

// Add styles to document head if in browser environment
if (typeof document !== 'undefined' && !document.getElementById('gradient-animation')) {
  gradientStyles.id = 'gradient-animation';
  document.head.appendChild(gradientStyles);
}

const avatarStyles = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral'
];

export default function ProfilePhoto({ size = 'md', editable = true, className = '' }) {
  const { currentUser, updateUserProfile, updateUserPhotoInContent } = useAuth();
  const { updatePhotoUrlInPosts } = usePosts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('adventurer');
  const [hovering, setHovering] = useState(false);
  const [randomSeed, setRandomSeed] = useState(currentUser?.uid || 'default');
  const [isGenerating, setIsGenerating] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const generateAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  const generateRandomAvatar = () => {
    setIsGenerating(true);
    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    setSelectedStyle(randomStyle);
    setRandomSeed(randomSeed);
    setIsGenerating(false);
  };

  const handleStyleSelect = async (style) => {
    try {
      setIsGenerating(true);
      const newAvatarUrl = generateAvatarUrl(style, randomSeed);
      
      // Update user profile
      const result = await updateUserProfile({
        photoURL: newAvatarUrl
      });

      if (result.success) {
        // Update photo URL in all posts and comments in Firestore
        await updateUserPhotoInContent(currentUser.uid, newAvatarUrl);
        
        // Update local state for immediate UI update
        updatePhotoUrlInPosts(currentUser.uid, newAvatarUrl);
        
        setSelectedStyle(style);
        setIsModalOpen(false);
      } else {
        console.error('Failed to update profile:', result.error);
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <motion.div
        className={`relative group ${sizeClasses[size]} ${className}`}
        onHoverStart={() => editable && setHovering(true)}
        onHoverEnd={() => editable && setHovering(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-full" 
             style={{
               backgroundSize: '200% 200%',
               animation: 'gradient 8s ease infinite'
             }}
        />
        
        {/* Outer glow effect */}
        <div className="absolute -inset-[3px] bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-sm opacity-40 group-hover:opacity-75 transition duration-500" />
        
        {/* Main container with border */}
        <div className="absolute inset-[2px] rounded-full bg-gradient-to-r from-base-100 to-base-200">
          {/* Image wrapper */}
          <div className="relative rounded-full overflow-hidden w-full h-full ring-2 ring-base-content/10">
            <img
              src={currentUser?.photoURL || generateAvatarUrl('adventurer', currentUser?.uid)}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            
            {/* Hover overlay */}
            {editable && hovering && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-base-content/30 backdrop-blur-sm cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="flex items-center gap-2 text-base-100">
                  <PencilIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Edit</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-base-100" />
        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-base-100" />
      </motion.div>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-box max-w-3xl w-full bg-base-100 p-6 rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Choose Your Avatar Style</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`btn btn-circle btn-ghost ${isGenerating ? 'loading' : ''}`}
                  onClick={generateRandomAvatar}
                  disabled={isGenerating}
                >
                  <ArrowPathIcon className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2">
                {avatarStyles.map((style) => (
                  <motion.div
                    key={style}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative cursor-pointer rounded-lg p-2 border-2 ${
                      selectedStyle === style ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => handleStyleSelect(style)}
                  >
                    <img
                      src={generateAvatarUrl(style, randomSeed)}
                      alt={style}
                      className="w-full aspect-square rounded-lg"
                    />
                    <p className="text-center text-sm mt-2">{style.replace(/-/g, ' ')}</p>
                  </motion.div>
                ))}
              </div>
              <div className="modal-action">
                <button className="btn" onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
