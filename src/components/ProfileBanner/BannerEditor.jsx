import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function BannerEditor({ previewUrl, onSave, onClose, loading, onGenerateRandom }) {
  const handleSave = () => {
    if (!previewUrl) return;
    
    onSave({
      imageUrl: previewUrl,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-base-300/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-base-100 rounded-box p-4 max-w-2xl w-full shadow-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Profile Banner</h3>
          <button
            className="btn btn-ghost btn-circle btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="relative w-full h-48 md:h-64 rounded-box overflow-hidden mb-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Banner Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-base-200 flex items-center justify-center">
              <span className="text-base-content/50">No image selected</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            className="btn btn-ghost gap-2"
            onClick={onGenerateRandom}
            disabled={loading}
          >
            <ArrowPathIcon className="w-5 h-5" />
            Generate Random
          </button>
          <button
            className="btn btn-primary gap-2"
            onClick={handleSave}
            disabled={loading || !previewUrl}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <CheckIcon className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
