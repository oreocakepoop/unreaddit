import { motion } from 'framer-motion';
import { HeartIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

function Comment({ comment, onDelete }) {
  const [isLiked, setIsLiked] = useState(false);
  const { currentUser } = useAuth();
  const isAuthor = currentUser?.uid === comment.userId;
  const [authorData, setAuthorData] = useState({
    photoURL: comment.authorPhotoURL,
    displayName: comment.authorName || comment.authorDisplayName
  });

  useEffect(() => {
    // Subscribe to real-time updates for the comment author's profile
    if (comment.userId) {
      const unsubscribe = onSnapshot(doc(db, 'users', comment.userId), (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setAuthorData({
            photoURL: userData.photoURL || comment.authorPhotoURL,
            displayName: userData.displayName || comment.authorName || comment.authorDisplayName
          });
        }
      });

      return () => unsubscribe();
    }
  }, [comment.userId]);

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pl-12 pr-4 py-3 hover:bg-base-200/50 transition-colors"
    >
      <div className="flex space-x-2">
        <div className="avatar">
          <div className="w-6 h-6 rounded-full">
            <img 
              src={authorData.photoURL || `https://api.dicebear.com/6.x/avataaars/svg?seed=${comment.authorEmail}`} 
              alt={authorData.displayName}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm">{authorData.displayName || 'Anonymous User'}</span>
            <span className="text-base-content/60 text-sm">· {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}</span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <div className="flex items-center space-x-4 mt-2">
            <motion.button
              className={`text-sm flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-base-content/60'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleLike}
            >
              <HeartIcon className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </motion.button>
            {isAuthor && (
              <motion.button
                className="text-sm flex items-center space-x-1 text-base-content/60 hover:text-error"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete?.(comment.id)}
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Comment;
