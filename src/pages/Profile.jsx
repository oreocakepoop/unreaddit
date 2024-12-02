import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { getUserProfile, createUserProfile } from '../firebase/services';
import { getFollowers, getFollowing } from '../services/followService';
import PostCard from '../components/PostCard';
import CreatePostForm from '../components/CreatePostForm';
import ProfilePhoto from '../components/ProfilePhoto';
import ProfileBanner from '../components/ProfileBanner/ProfileBanner';
import {
  PencilSquareIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, userStats } = useAuth();
  const { posts, loading: postsLoading, hasMore, fetchUserPosts, createNewPost, togglePostLike } = usePosts();
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    joined: 'Recently'
  });
  const [profileUserId, setProfileUserId] = useState(null);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const initializeProfile = async () => {
      if (!authLoading && !currentUser) {
        navigate('/login');
        return;
      }

      if (currentUser?.uid) {
        setProfileLoading(true);
        try {
          // Set the profile user ID
          setProfileUserId(currentUser.uid);
          
          const profileResult = await getUserProfile(currentUser.uid);
          if (profileResult.data) {
            setUserProfile(profileResult.data);
            setDisplayName(profileResult.data.displayName || currentUser.displayName || '');
            setBio(profileResult.data.bio || '');
          } else {
            await createUserProfile(currentUser.uid, {
              displayName: currentUser.displayName || '',
              bio: '',
              email: currentUser.email || '',
              followersCount: 0,
              followingCount: 0
            });
          }

          // Set up real-time listener for user stats
          const userRef = doc(db, 'users', currentUser.uid);
          const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setStats(prev => ({
                ...prev,
                followers: data.followersCount || 0,
                following: data.followingCount || 0
              }));
            }
          });

          return () => unsubscribe();
        } catch (error) {
          console.error('Error initializing profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    initializeProfile();
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (profileUserId) {
      fetchUserPosts(profileUserId);
    }
  }, [profileUserId]);

  useEffect(() => {
    const handleIntersection = async (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore && !postsLoading && profileUserId) {
        setIsLoadingMore(true);
        try {
          await fetchUserPosts(profileUserId, true);
        } finally {
          setIsLoadingMore(false);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });

    if (loadMoreRef.current && hasMore && !isLoadingMore && !postsLoading) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, postsLoading, posts.length, profileUserId]);

  useEffect(() => {
    if (userProfile) {
      setStats(prev => ({
        ...prev,
        posts: userProfile.postCount || 0,
        joined: userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        }) : 'Recently'
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (userStats) {
      setStats(prev => ({
        ...prev,
        followers: userStats.followersCount || 0,
        following: userStats.followingCount || 0
      }));
    }
  }, [userStats]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const loadMorePosts = async () => {
    if (!profileUserId || postsLoading || !hasMore || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      await fetchUserPosts(profileUserId, true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    const result = await updateUserProfile(currentUser.uid, {
      displayName,
      bio
    });

    if (result.success) {
      setUserProfile(prev => ({
        ...prev,
        displayName,
        bio
      }));
      setIsEditing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Redirect will happen in useEffect if not authenticated
  if (!currentUser) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Profile Banner */}
      <ProfileBanner
        profileUserId={profileUserId}
        bannerUrl={userProfile?.bannerImageURL}
        isEditable={currentUser?.uid === profileUserId}
      />

      {/* Profile Info */}
      <div className="relative px-4 pb-4">
        {/* Profile Photo with User Info */}
        <div className="flex items-end gap-6 -mt-16 mb-6">
          <div className="relative">
            <ProfilePhoto
              size="xl"
              userId={profileUserId}
              editable={currentUser?.uid === profileUserId}
            />
          </div>
          
          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-base-content">
                  {currentUser?.displayName || 'Anonymous User'}
                </h1>
                <p className="text-base-content/60">
                  @{currentUser?.email?.split('@')[0] || 'anonymous'}
                </p>
              </div>
              
              {currentUser?.uid === profileUserId && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats shadow bg-base-200 w-full">
          <div className="stat place-items-center">
            <div className="stat-title">Posts</div>
            <div className="stat-value text-primary">{stats.posts}</div>
          </div>
          
          <div className="stat place-items-center">
            <div className="stat-title">Followers</div>
            <div className="stat-value text-secondary">{stats.followers}</div>
          </div>

          <div className="stat place-items-center">
            <div className="stat-title">Following</div>
            <div className="stat-value text-accent">{stats.following}</div>
          </div>

          <div className="stat place-items-center">
            <div className="stat-title">Joined</div>
            <div className="stat-value text-sm">{stats.joined}</div>
            <div className="stat-desc"><CalendarDaysIcon className="w-4 h-4 inline mr-1" /></div>
          </div>
        </div>
      </div>

      {/* Create Post Card */}
      <motion.div
        variants={itemVariants}
        className="card bg-base-100 shadow-xl"
      >
        <div className="card-body">
          <CreatePostForm 
            createNewPost={createNewPost} 
            isPosting={isPosting} 
            postError={postError} 
          />
        </div>
      </motion.div>

      {/* Content Tabs */}
      <motion.div variants={itemVariants} className="tabs tabs-boxed justify-center">
        <a 
          className={`tab ${activeTab === 'posts' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </a>
        <a 
          className={`tab ${activeTab === 'comments' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments
        </a>
        <a 
          className={`tab ${activeTab === 'saved' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved
        </a>
      </motion.div>

      {/* Content Area */}
      <motion.div
        variants={itemVariants}
        className="space-y-4"
      >
        {activeTab === 'posts' && (
          <>
            {postsLoading && posts.length === 0 ? (
              <div className="text-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : posts.length > 0 ? (
              <>
                <AnimatePresence>
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={togglePostLike}
                    />
                  ))}
                </AnimatePresence>
                <div ref={loadMoreRef} className="h-10 mt-4">
                  {isLoadingMore && (
                    <div className="text-center">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  )}
                  {!isLoadingMore && hasMore && posts.length > 0 && (
                    <div className="text-center text-base-content/60">
                      <p className="text-sm">Scroll to load more</p>
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <div className="text-center text-base-content/60">
                      <p className="text-sm">No more posts to load</p>
                      <div className="divider"></div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 card bg-base-100 shadow-xl">
                <div className="card-body">
                  <ChatBubbleLeftIcon className="w-16 h-16 mx-auto text-base-content/20" />
                  <p className="mt-4 text-base-content/60">No posts yet</p>
                  <p className="text-sm text-base-content/40">
                    Share your thoughts with the community!
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === 'comments' && (
          <div className="text-center py-8">
            <UserGroupIcon className="w-16 h-16 mx-auto text-base-content/20" />
            <p className="mt-4 text-base-content/60">No comments yet</p>
            <button className="btn btn-primary mt-4">Start Engaging</button>
          </div>
        )}
        {activeTab === 'saved' && (
          <div className="text-center py-8">
            <BookmarkIcon className="w-16 h-16 mx-auto text-base-content/20" />
            <p className="mt-4 text-base-content/60">No saved items</p>
            <button className="btn btn-primary mt-4">Explore Content</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
