import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { TrashIcon } from '@heroicons/react/24/outline';
import { getUserPhoto } from '../services/userPhotoService';
import { subscribeToComments, addRealtimeComment, deleteRealtimeComment } from '../firebase/realtimeServices';

export default function CommentSection({ postId, onClose }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPhotos, setUserPhotos] = useState({});

  // Subscribe to real-time comments
  useEffect(() => {
    const unsubscribe = subscribeToComments(
      postId,
      (updatedComments) => {
        setComments(updatedComments);
        setLoading(false);
      },
      (error) => {
        console.error('Error in comments subscription:', error);
        setCommentError('Failed to load comments');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [postId]);

  // Fetch user photos for all comments
  useEffect(() => {
    const fetchUserPhotos = async () => {
      console.log('CommentSection: Fetching photos for comments:', comments);
      const photoPromises = comments.map(async (comment) => {
        console.log('CommentSection: Fetching photo for comment userId:', comment.userId);
        const photoURL = await getUserPhoto(comment.userId);
        console.log('CommentSection: Received photoURL for comment:', photoURL);
        return [comment.userId, photoURL];
      });
      
      const photos = await Promise.all(photoPromises);
      const photoMap = Object.fromEntries(photos.filter(([_, url]) => url !== null));
      console.log('CommentSection: Final photo map:', photoMap);
      setUserPhotos(photoMap);
    };

    if (comments.length > 0) {
      fetchUserPhotos();
    }
  }, [comments]);

  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return 'Just now';
    
    // Handle Firestore Timestamp
    if (createdAt.toDate) {
      return formatDistanceToNow(createdAt.toDate(), { addSuffix: true });
    }
    
    // Handle regular Date object
    if (createdAt instanceof Date) {
      return formatDistanceToNow(createdAt, { addSuffix: true });
    }
    
    // Handle date string
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isAddingComment) return;

    setIsAddingComment(true);
    setCommentError(null);

    try {
      const result = await addRealtimeComment(postId, {
        content: newComment.trim(),
        userId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorEmail: currentUser.email
      });

      if (result.success) {
        setNewComment('');
      } else {
        setCommentError(result.error);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentError('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const result = await deleteRealtimeComment(postId, commentId);
      if (!result.success) {
        console.error('Failed to delete comment:', result.error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-base-300 bg-base-200/50"
    >
      <div className="px-3 py-2">
        {/* Comment Form */}
        {currentUser && (
          <form onSubmit={handleAddComment} className="mb-3">
            <div className="flex gap-2">
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img
                    src={currentUser?.photoURL || '/default-avatar.png'}
                    alt="Your avatar"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.log('CommentSection: Current user image load error, falling back to default');
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="form-control">
                  <textarea
                    className="textarea textarea-bordered textarea-sm w-full min-h-[2.5rem] text-sm"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isAddingComment}
                  ></textarea>
                </div>
                {commentError && (
                  <div className="text-error text-xs mt-1">{commentError}</div>
                )}
                <div className="flex justify-end mt-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`btn btn-primary btn-xs ${isAddingComment ? 'loading' : ''}`}
                    type="submit"
                    disabled={!newComment.trim() || isAddingComment}
                  >
                    {isAddingComment ? 'Commenting...' : 'Comment'}
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        <AnimatePresence>
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2"
                >
                  <div className="avatar">
                    <div className="w-6 h-6 rounded-full">
                      <img
                        src={userPhotos[comment.userId] || '/default-avatar.png'}
                        alt={comment.authorName}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          console.log('CommentSection: Comment image load error, falling back to default');
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium hover:underline cursor-pointer">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {formatCreatedAt(comment.createdAt)}
                        </span>
                        {currentUser?.uid === comment.userId && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-auto p-1 hover:bg-base-300 rounded transition-colors"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>
                      <div className="text-base-content/80">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-4 text-base-content/60">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
