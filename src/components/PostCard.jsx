import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon,
  BookmarkIcon,
  UserIcon,
  HashtagIcon,
  TagIcon,
  CodeBracketIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
  SparklesIcon,
  FireIcon,
  BeakerIcon,
  RocketLaunchIcon,
  PaintBrushIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon,
  UserIcon as UserSolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';
import UserHoverCard from './UserHoverCard';
import CommentSection from './CommentSection';
import ShareButton from './ShareButton';
import { useAuth } from '../context/AuthContext';
import { isFollowing, followUser, unfollowUser } from '../services/followService';
import { addBookmark, removeBookmark, isPostBookmarked } from '../services/bookmarkService';
import { getUserPhoto } from '../services/userPhotoService';
import { subscribeToComments } from '../firebase/realtimeServices';
import { usePosts } from '../context/PostContext';
import { subscribeToReactions, addReaction, removeReaction } from '../services/reactionService';
import ReactionPicker from './ReactionPicker';
import ReactionDisplay from './ReactionDisplay';

function PostCard({ post, onLike }) {
  const [showComments, setShowComments] = useState(false);
  const [isUserFollowed, setIsUserFollowed] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authorPhotoURL, setAuthorPhotoURL] = useState(null);
  const [commentCount, setCommentCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const { currentUser } = useAuth();
  const { deletePost } = usePosts();

  useEffect(() => {
    console.log('PostCard: Post data:', {
      authorId: post?.authorId,
      userId: post?.userId,
      authorEmail: post?.authorEmail,
      authorDisplayName: post?.authorDisplayName
    });
  }, [post]);

  useEffect(() => {
    const checkStatus = async () => {
      if (currentUser && post.id && post.authorId) {
        try {
          console.log('PostCard: Checking follow and bookmark status for post:', post.id);
          const [userFollowStatus, bookmarkStatus] = await Promise.all([
            isFollowing(currentUser.uid, post.authorId),
            isPostBookmarked(currentUser.uid, post.id)
          ]);
          console.log('PostCard: Received follow and bookmark status:', userFollowStatus, bookmarkStatus);
          setIsUserFollowed(userFollowStatus);
          setIsBookmarked(bookmarkStatus);
        } catch (error) {
          console.error('PostCard: Error checking status:', error);
        }
      }
    };

    checkStatus();
  }, [currentUser, post.id, post.authorId]);

  useEffect(() => {
    const fetchAuthorPhoto = async () => {
      console.log('PostCard: Starting photo fetch for post:', post?.id);
      const postUserId = post?.userId;
      if (!postUserId) {
        console.log('PostCard: No userId available for post:', post?.id);
        return;
      }

      try {
        console.log('PostCard: Fetching photo for userId:', postUserId);
        const photoURL = await getUserPhoto(postUserId);
        console.log('PostCard: Received photoURL:', photoURL, 'for userId:', postUserId);
        setAuthorPhotoURL(photoURL);
      } catch (error) {
        console.error('PostCard: Error fetching author photo:', error);
      }
    };

    fetchAuthorPhoto();
  }, [post?.userId, post?.id]);

  useEffect(() => {
    const unsubscribe = subscribeToComments(
      post.id,
      (comments) => {
        setCommentCount(comments.length);
      },
      (error) => {
        console.error('Error subscribing to comments:', error);
      }
    );

    return () => unsubscribe();
  }, [post.id]);

  useEffect(() => {
    if (!post.id) return;
    
    const unsubscribe = subscribeToReactions(post.id, (newReactions) => {
      setReactions(newReactions);
    });

    return () => unsubscribe();
  }, [post.id]);

  const handleFollowUser = async (e) => {
    e.stopPropagation();
    if (!currentUser || currentUser.uid === post.authorId) return;

    setLoading(true);
    try {
      console.log('PostCard: Handling follow/unfollow for post:', post.id);
      if (isUserFollowed) {
        await unfollowUser(currentUser.uid, post.authorId);
        setIsUserFollowed(false);
      } else {
        await followUser(currentUser.uid, post.authorId);
        setIsUserFollowed(true);
      }
    } catch (error) {
      console.error('PostCard: Error following/unfollowing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;

    setLoading(true);
    try {
      console.log('PostCard: Handling bookmark for post:', post.id);
      if (isBookmarked) {
        await removeBookmark(currentUser.uid, post.id);
        setIsBookmarked(false);
      } else {
        await addBookmark(currentUser.uid, post.id);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('PostCard: Error bookmarking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentUser || currentUser.uid !== post.userId) return;

    setLoading(true);
    try {
      const result = await deletePost(post.id, currentUser.uid);
      if (!result.success) {
        console.error('Error deleting post:', result.error);
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleReaction = async (reactionType) => {
    if (!currentUser) return;

    try {
      if (reactionType === userReaction) {
        await removeReaction(post.id, currentUser.uid);
        setUserReaction(null);
      } else {
        await addReaction(post.id, currentUser.uid, reactionType);
        setUserReaction(reactionType);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return 'Just now';
    
    try {
      if (createdAt.toDate) {
        return formatDistanceToNow(createdAt.toDate(), { addSuffix: true });
      }
      
      if (createdAt instanceof Date) {
        return formatDistanceToNow(createdAt, { addSuffix: true });
      }
      
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (error) {
      console.error('PostCard: Error formatting date:', error);
      return 'Just now';
    }
  };

  const tagIcons = {
    technology: BeakerIcon,
    tech: BeakerIcon,
    coding: CodeBracketIcon,
    programming: CodeBracketIcon,
    music: MusicalNoteIcon,
    art: PaintBrushIcon,
    gaming: RocketLaunchIcon,
    game: RocketLaunchIcon,
    news: GlobeAltIcon,
    trending: FireIcon,
    featured: SparklesIcon,
    default: TagIcon
  };

  const getTagIcon = (tag) => {
    return tagIcons[tag.toLowerCase()] || tagIcons.default;
  };

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="card bg-base-100 shadow-xl mb-6 max-w-3xl mx-auto w-full"
      >
        <div className="card-body py-4 px-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <UserHoverCard
                userId={post?.userId}
                username={((post?.authorEmail || post?.authorDisplayName || 'anonymous').split('@')[0] || 'anonymous').toLowerCase().replace(/\s+/g, '')}
                trigger={
                  <div className="flex items-center gap-3">
                    <img 
                      src={authorPhotoURL || '/default-avatar.png'} 
                      alt={`${post?.authorDisplayName || 'User'}'s avatar`}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      onError={(e) => {
                        console.log('PostCard: Image load error, falling back to default');
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium hover:underline cursor-pointer">
                        u/{((post?.authorEmail || post?.authorDisplayName || 'anonymous').split('@')[0] || 'anonymous').toLowerCase().replace(/\s+/g, '')}
                      </span>
                      <span className="text-xs text-base-content/70">{formatCreatedAt(post.createdAt)}</span>
                    </div>
                  </div>
                }
              />
              <div className="flex items-center gap-3 ml-auto">
                {post.tags?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {post.tags.map((tag, index) => {
                      const TagIconComponent = getTagIcon(tag);
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/explore?tag=${tag}`;
                          }}
                        >
                          <TagIconComponent className="w-4 h-4 mr-1" />
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}
                {currentUser && currentUser.uid !== post.authorId && (
                  <button 
                    onClick={handleFollowUser}
                    disabled={loading}
                    className={`btn btn-ghost btn-sm gap-2 min-h-0 h-7 px-2 ${loading ? 'loading' : ''}`}
                    title={isUserFollowed ? 'Unfollow user' : 'Follow user'}
                  >
                    {isUserFollowed ? (
                      <UserSolidIcon className="w-4 h-4 text-primary" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
                {currentUser?.uid === post.userId && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDeleteClick}
                    className="btn btn-ghost btn-sm text-error"
                    disabled={loading}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="post-title">{post.title}</h2>
              <div className="break-words whitespace-pre-wrap">
                <p className="post-content">{post.content}</p>
              </div>
            </div>
            {post.imageUrl && (
              <div className="relative group cursor-zoom-in w-full mt-4">
                <div className="aspect-square w-full overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full h-full object-cover"
                    onClick={() => window.open(post.imageUrl, '_blank')}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="text-white text-sm">Click to view full size</span>
                  </div>
                </div>
              </div>
            )}
            <div className="post-actions">
              <ReactionPicker
                onSelect={handleReaction}
                currentReaction={userReaction}
              />
              <ReactionDisplay reactions={reactions} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(!showComments);
                }}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                <span className="text-sm">{commentCount}</span>
              </button>
              <ShareButton postId={post.id} />
              <button
                onClick={handleBookmark}
                className="btn btn-ghost btn-sm"
              >
                {isBookmarked ? (
                  <BookmarkSolidIcon className="w-5 h-5" />
                ) : (
                  <BookmarkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CommentSection postId={post.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-base-100 p-6 rounded-lg w-full max-w-sm border border-base-300"
          >
            <div className="flex items-start gap-3 text-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-base-content">Delete Post</h3>
                <div className="text-sm text-base-content/80 mt-1">Are you sure you want to delete this post? This action cannot be undone.</div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-ghost btn-sm px-4 hover:bg-base-200 normal-case" 
                onClick={handleDeleteCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error btn-sm px-4 normal-case border-0" 
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default PostCard;
