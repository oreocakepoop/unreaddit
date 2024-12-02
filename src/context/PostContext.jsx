import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  addPost, 
  getUserPosts,
  addComment, 
  deleteComment, 
  likePost, 
  unlikePost,
  getAllPosts,
  deletePost as firebaseDeletePost
} from '../firebase/services';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { processImage, uploadMedia, updateUserStats, extractMentions, indexPostContent, logError } from '../utils';
import { createNotification } from '../services/notificationService';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getFollowers } from '../services/followService';

const PostContext = createContext();
const POSTS_PER_PAGE = 10;

export const PostProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPost, setLastPost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Cleanup previous listener when component unmounts or query changes
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  // Function to handle real-time updates
  const setupRealtimeListener = (queryConstraints) => {
    // Cleanup previous listener if exists
    if (unsubscribe) {
      unsubscribe();
    }

    const postsQuery = query(
      collection(db, 'posts'),
      ...queryConstraints
    );

    setCurrentQuery(postsQuery);

    const listener = onSnapshot(postsQuery, 
      (snapshot) => {
        const updatedPosts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          updatedPosts.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            lastActivityAt: data.lastActivityAt?.toDate?.() || new Date()
          });
        });
        setPosts(updatedPosts);
        setLoading(false);
        setHasMore(updatedPosts.length === POSTS_PER_PAGE);
        if (updatedPosts.length > 0) {
          setLastPost(updatedPosts[updatedPosts.length - 1]);
        }
      },
      (err) => {
        console.error('Error in real-time listener:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    setUnsubscribe(() => listener);
  };

  const fetchPosts = async (loadMore = false) => {
    if (loadMore && (!hasMore || loading)) return;

    setLoading(true);
    setError(null);

    try {
      const constraints = [
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      ];

      if (loadMore && lastPost) {
        console.log('PostContext: Loading more posts after:', lastPost.createdAt);
        constraints.push(startAfter(lastPost.createdAt));
        
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, ...constraints);
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const newPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            lastActivityAt: doc.data().lastActivityAt?.toDate?.() || new Date()
          }));
          
          console.log('PostContext: Loaded', newPosts.length, 'more posts');
          setPosts(prev => [...prev, ...newPosts]);
          setLastPost(newPosts[newPosts.length - 1]);
          setHasMore(newPosts.length === POSTS_PER_PAGE);
        } else {
          console.log('PostContext: No more posts to load');
          setHasMore(false);
        }
      } else {
        // Set up real-time listener for initial load
        setupRealtimeListener(constraints);
      }
    } catch (err) {
      console.error('PostContext: Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId, loadMore = false) => {
    if (!userId || (loadMore && (!hasMore || loading))) return;

    setLoading(true);
    setError(null);

    try {
      const constraints = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      ];

      if (loadMore && lastPost) {
        constraints.push(startAfter(lastPost.createdAt));
        const result = await getUserPosts(userId, lastPost);
        if (result.success) {
          setPosts(prev => [...prev, ...result.data]);
          setLastPost(result.lastVisible);
          setHasMore(result.hasMore);
        }
      } else {
        // Set up real-time listener for initial load
        setupRealtimeListener(constraints);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const createNewPost = async (title, content, { media, imageUrl, tags = [], visibility = 'public', draft = false, nsfw = false } = {}) => {
    if (!currentUser) {
      return { error: 'Authentication required', code: 'AUTH_REQUIRED' };
    }

    // Input validation
    if (!title?.trim()) {
      return { error: 'Title is required', code: 'INVALID_TITLE' };
    }

    if (!content?.trim()) {
      return { error: 'Content is required', code: 'INVALID_CONTENT' };
    }

    if (title.length > 300) {
      return { error: 'Title must be less than 300 characters', code: 'TITLE_TOO_LONG' };
    }

    if (content.length > 40000) {
      return { error: 'Content must be less than 40,000 characters', code: 'CONTENT_TOO_LONG' };
    }

    if (imageUrl && !imageUrl.match(/\.(jpeg|jpg|gif|png)$/)) {
      return { error: 'Invalid image URL format', code: 'INVALID_IMAGE_URL' };
    }

    if (tags && !Array.isArray(tags)) {
      return { error: 'Tags must be an array', code: 'INVALID_TAGS' };
    }

    if (tags?.length > 5) {
      return { error: 'Maximum 5 tags allowed', code: 'TOO_MANY_TAGS' };
    }

    // Sanitize and process tags
    const processedTags = tags
      ?.map(tag => tag.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
      .filter(tag => tag.length > 0 && tag.length <= 20)
      .slice(0, 5) || [];

    try {
      console.log('PostContext: Creating new post for user:', currentUser.uid);
      
      // Ensure user profile exists first
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('PostContext: Creating user profile before post');
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Anonymous',
          photoURL: currentUser.photoURL || '',
          bio: '',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          followersCount: 0,
          followingCount: 0,
          postsCount: 0
        });
      }

      // Create metadata
      const metadata = {
        userId: currentUser.uid,
        authorId: currentUser.uid,
        authorDisplayName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || '',
        authorEmail: currentUser.email,
        title: title.trim(),
        content: content.trim(),
        tags: processedTags,
        visibility,
        draft,
        nsfw,
        imageUrl: imageUrl || '',
        media: []
      };

      console.log('PostContext: Post metadata:', metadata);

      // Create post with optimistic update
      const optimisticId = uuidv4();
      const optimisticPost = {
        id: optimisticId,
        ...metadata,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        likes: [],
        comments: [],
        commentCount: 0,
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        },
        flags: {
          isEdited: false,
          isPinned: false,
          isLocked: false,
          isArchived: false
        }
      };

      // Update local state immediately for better UX
      setPosts(prev => [optimisticPost, ...prev]);

      // Create the actual post
      console.log('PostContext: Creating post in Firestore');
      const result = await addPost({
        userId: currentUser.uid,
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl || '',
        tags: processedTags,
        visibility,
        draft,
        nsfw
      });

      if (result.success) {
        console.log('PostContext: Post created successfully');
        // Update user's post count
        await updateDoc(userRef, {
          postsCount: increment(1),
          lastActivityAt: serverTimestamp()
        });

        return {
          success: true,
          data: result.data,
          message: 'Post created successfully'
        };
      } else {
        console.error('PostContext: Failed to create post:', result.error);
        // Revert optimistic update
        setPosts(prev => prev.filter(p => p.id !== optimisticId));
        return { error: result.error };
      }
    } catch (error) {
      console.error('PostContext: Error creating post:', error);
      return { error: error.message };
    }
  };

  const addNewComment = async (postId, content) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      await addComment(postId, currentUser.uid, content);
      // No need to manually update posts array as the real-time listener will handle it
    } catch (error) {
      console.error('PostContext: Error adding comment:', error);
    }
  };

  const removeComment = async (postId, commentId) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      await deleteComment(postId, commentId);
      // No need to manually update posts array as the real-time listener will handle it
    } catch (error) {
      console.error('PostContext: Error removing comment:', error);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      await likePost(postId, currentUser.uid);
      // No need to manually update posts array as the real-time listener will handle it
    } catch (error) {
      console.error('PostContext: Error liking post:', error);
    }
  };

  const handleUnlike = async (postId) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      await unlikePost(postId, currentUser.uid);
      // No need to manually update posts array as the real-time listener will handle it
    } catch (error) {
      console.error('PostContext: Error unliking post:', error);
    }
  };

  const deletePost = async (postId, userId) => {
    if (!currentUser || currentUser.uid !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const result = await firebaseDeletePost(postId, userId);
      if (result.success) {
        // Optimistically remove the post from the local state
        setPosts(prev => prev.filter(p => p.id !== postId));
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('PostContext: Error deleting post:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <PostContext.Provider 
      value={{
        posts,
        loading,
        error,
        hasMore,
        lastPost,
        fetchPosts,
        createNewPost,
        addNewComment,
        removeComment,
        handleLike,
        handleUnlike,
        fetchUserPosts,
        deletePost
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  return useContext(PostContext);
};
