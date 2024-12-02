import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fetchRandomBanner, updateUserBanner } from '../../services/bannerService';
import BannerEditor from './BannerEditor';
import {
  PhotoIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function ProfileBanner({ profileUserId, bannerUrl, isEditable }) {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleGenerateRandom = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchRandomBanner();
      if (result.success) {
        setPreviewUrl(result.data.imageUrl);
        setIsEditing(true);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to generate banner');
      console.error('Error generating banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanner = async (bannerData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateUserBanner(currentUser.uid, bannerData);
      if (result.success) {
        setIsEditing(false);
        setPreviewUrl(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to save banner');
      console.error('Error saving banner:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Banner Image */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-b-xl">
        <motion.img
          src={bannerUrl || '/default-banner.jpg'}
          alt="Profile Banner"
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-base-300/50 to-transparent" />

        {/* Controls */}
        {isEditable && currentUser?.uid === profileUserId && (
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-circle btn-sm bg-base-100/80 hover:bg-base-100"
              onClick={handleGenerateRandom}
              disabled={loading}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-circle btn-sm bg-base-100/80 hover:bg-base-100"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              <PhotoIcon className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-4 bg-error text-error-content px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>{error}</span>
            <button
              className="btn btn-ghost btn-circle btn-xs"
              onClick={() => setError(null)}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <BannerEditor
            previewUrl={previewUrl}
            onSave={handleSaveBanner}
            onClose={() => {
              setIsEditing(false);
              setPreviewUrl(null);
            }}
            loading={loading}
            onGenerateRandom={handleGenerateRandom}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
