import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon 
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { formatDistanceToNow } from 'date-fns';
import { TagIcon } from '@heroicons/react/24/outline';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Post({ post }) {
  const { currentUser } = useAuth();
  const { togglePostLike, addNewComment } = usePosts();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [authorData, setAuthorData] = useState(null);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        // Get user directly by ID
        const userRef = doc(db, 'users', post.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setAuthorData({
            ...userData,
            id: userSnap.id
          });
        }
      } catch (error) {
        console.error('Error fetching author data:', error);
      }
    };

    if (post.userId) {
      fetchAuthorData();
    }
  }, [post.userId]);

  const isLiked = post.likes?.includes(currentUser?.uid);
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  const handleLike = async () => {
    await togglePostLike(post.id);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const result = await addNewComment(post.id, commentText.trim());
    if (result.success) {
      setCommentText('');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save functionality
  };

  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return '';
    
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card bg-base-100 shadow-xl mb-4"
    >
      <div className="card-body">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="tooltip tooltip-right" data-tip={`${authorData?.displayName || post.authorName} • ${authorData?.email || post.authorEmail}`}>
            <Link to={`/profile/${post.userId}`} className="avatar">
              <div className="w-10 h-10 rounded-full">
                <img 
                  src={authorData?.photoURL || `https://api.dicebear.com/6.x/avataaars/svg?seed=${post.authorEmail}`} 
                  alt={authorData?.displayName || post.authorName} 
                />
              </div>
            </Link>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.userId}`} className="font-semibold hover:underline">
                {authorData?.displayName || post.authorName}
              </Link>
              <span className="text-sm text-base-content/60">·</span>
              <p className="text-sm text-base-content/60">
                {formatCreatedAt(post.createdAt)}
              </p>
              {post.tags?.length > 0 && (
                <>
                  <span className="text-sm text-base-content/60">·</span>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/explore?tag=${tag}`}
                        className="text-sm text-primary hover:text-primary-focus"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-base-content/80 whitespace-pre-wrap">{post.content}</p>

        {/* Post Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="btn btn-ghost btn-sm gap-2"
              onClick={handleLike}
            >
              {isLiked ? (
                <HeartIconSolid className="w-5 h-5 text-error" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              {likeCount > 0 && <span>{likeCount}</span>}
            </motion.button>

            {/* Comment Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => setShowComments(!showComments)}
            >
              <ChatBubbleLeftIcon className="w-5 h-5" />
              {commentCount > 0 && <span>{commentCount}</span>}
            </motion.button>

            {/* Share Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="btn btn-ghost btn-sm"
            >
              <ShareIcon className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="btn btn-ghost btn-sm"
            onClick={handleSave}
          >
            {isSaved ? (
              <BookmarkIconSolid className="w-5 h-5" />
            ) : (
              <BookmarkIcon className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="divider my-2"></div>
              
              {/* Comment Form */}
              <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="input input-bordered flex-1"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!commentText.trim()}
                >
                  Post
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {post.comments?.map((comment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full">
                        <img
                          src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${comment.userId}`}
                          alt="avatar"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <Link to={`/profile/${comment.userId}`} className="font-semibold hover:underline">
                          {comment.userId}
                        </Link>
                        <span className="text-xs text-base-content/60">
                          {formatCreatedAt(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-base-content/80">{comment.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
