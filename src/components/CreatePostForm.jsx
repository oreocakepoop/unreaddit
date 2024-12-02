import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosts } from '../context/PostContext';
import { 
  PhotoIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { extractImageUrl, isValidImageUrl } from '../utils/imageUtils';

export default function CreatePostForm({ onSuccess }) {
  const { createNewPost } = usePosts();
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    media: [],
    imageUrl: '',
    visibility: 'public',
    draft: false,
    nsfw: false,
    currentTag: ''
  });

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = formData.currentTag.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag],
          currentTag: ''
        }));
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    );

    if (validFiles.length + formData.media.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    const newMedia = validFiles.map(file => ({
      file,
      type: file.type,
      preview: URL.createObjectURL(file),
      alt: ''
    }));

    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...newMedia]
    }));
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const updateMediaAlt = (index, alt) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.map((item, i) => 
        i === index ? { ...item, alt } : item
      )
    }));
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setFormData(prev => ({ ...prev, content: newContent }));

    // Try to extract image URL from content
    const extractedUrl = extractImageUrl(newContent);
    if (extractedUrl && isValidImageUrl(extractedUrl)) {
      setFormData(prev => ({ 
        ...prev, 
        content: newContent.replace(extractedUrl, '').trim(),
        imageUrl: extractedUrl 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPosting) return;

    setIsPosting(true);
    setError(null);

    try {
      // Validate image URL if provided
      if (formData.imageUrl && !isValidImageUrl(formData.imageUrl)) {
        setError('Invalid image URL format');
        setIsPosting(false);
        return;
      }

      const result = await createNewPost(
        formData.title,
        formData.content,
        {
          media: formData.media,
          imageUrl: formData.imageUrl,
          tags: formData.tags,
          visibility: formData.visibility,
          draft: formData.draft,
          nsfw: formData.nsfw
        }
      );

      if (result.error) {
        setError(result.error);
      } else {
        setFormData({
          title: '',
          content: '',
          tags: [],
          media: [],
          imageUrl: '',
          visibility: 'public',
          draft: false,
          nsfw: false,
          currentTag: ''
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl mb-6"
    >
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="form-control mb-4">
            <input
              type="text"
              placeholder="Post title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input input-bordered w-full"
              maxLength={300}
            />
          </div>

          {/* Content Input */}
          <div className="form-control mb-4">
            <textarea
              placeholder="What's on your mind? Paste an image URL and it will be automatically detected!"
              value={formData.content}
              onChange={handleContentChange}
              className="textarea textarea-bordered w-full"
              rows={4}
              maxLength={40000}
            />
          </div>

          {/* Image URL display and preview */}
          {formData.imageUrl && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-success">Image URL detected!</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                >
                  Remove
                </button>
              </div>
              <div className="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-base-200">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    setFormData(prev => ({ ...prev, imageUrl: '' }));
                  }}
                />
              </div>
            </div>
          )}

          {/* Tags Input */}
          <div className="form-control mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="badge badge-primary gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs px-1"
                    onClick={() => removeTag(tag)}
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tags (max 5) - Press Enter or comma to add"
              value={formData.currentTag}
              onChange={(e) => setFormData(prev => ({ ...prev, currentTag: e.target.value }))}
              onKeyDown={handleTagKeyDown}
              className="input input-bordered w-full"
              disabled={formData.tags.length >= 5}
            />
          </div>

          {/* Media Preview */}
          <AnimatePresence>
            {formData.media.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4 mb-4"
              >
                {formData.media.map((item, index) => (
                  <div key={index} className="relative">
                    <img
                      src={item.preview}
                      alt={item.alt}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="btn btn-circle btn-sm absolute top-2 right-2"
                      onClick={() => removeMedia(index)}
                    >
                      ×
                    </button>
                    <input
                      type="text"
                      placeholder="Add alt text"
                      value={item.alt}
                      onChange={(e) => updateMediaAlt(index, e.target.value)}
                      className="input input-bordered input-sm w-full mt-2"
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Post Options */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Media Upload */}
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={formData.media.length >= 4}
            >
              <PhotoIcon className="w-5 h-5" />
              Add Images
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleMediaChange}
            />

            {/* Visibility Toggle */}
            <button
              type="button"
              className={`btn btn-sm gap-2 ${formData.visibility === 'private' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFormData(prev => ({
                ...prev,
                visibility: prev.visibility === 'public' ? 'private' : 'public'
              }))}
            >
              {formData.visibility === 'public' ? (
                <EyeIcon className="w-5 h-5" />
              ) : (
                <EyeSlashIcon className="w-5 h-5" />
              )}
              {formData.visibility === 'public' ? 'Public' : 'Private'}
            </button>

            {/* Draft Toggle */}
            <button
              type="button"
              className={`btn btn-sm gap-2 ${formData.draft ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFormData(prev => ({ ...prev, draft: !prev.draft }))}
            >
              {formData.draft ? 'Draft' : 'Publish'}
            </button>

            {/* NSFW Toggle */}
            <button
              type="button"
              className={`btn btn-sm gap-2 ${formData.nsfw ? 'btn-error' : 'btn-ghost'}`}
              onClick={() => setFormData(prev => ({ ...prev, nsfw: !prev.nsfw }))}
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
              NSFW
            </button>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="alert alert-error mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="card-actions justify-end">
            <motion.button
              type="submit"
              disabled={isPosting || !formData.title.trim() || !formData.content.trim()}
              className={`btn btn-primary ${isPosting ? 'loading' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPosting ? 'Posting...' : formData.draft ? 'Save Draft' : 'Post'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
