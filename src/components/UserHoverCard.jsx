import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import { getUserPhoto } from '../services/userPhotoService';
import FollowButton from './FollowButton';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function UserHoverCard({ userId, username, trigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const { currentUser } = useAuth();
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Reset states when userId changes
  useEffect(() => {
    setProfile(null);
    setLoading(false);
    setUserPhotoURL(null);
    setError(null);
  }, [userId]);

  // Fetch user photo
  useEffect(() => {
    const fetchUserPhoto = async () => {
      if (!userId) return;
      
      try {
        console.log('UserHoverCard: Fetching photo for userId:', userId);
        const photoURL = await getUserPhoto(userId);
        console.log('UserHoverCard: Received photoURL:', photoURL);
        setUserPhotoURL(photoURL);
      } catch (error) {
        console.error('UserHoverCard: Error fetching user photo:', error);
      }
    };

    if (isOpen && !userPhotoURL) {
      fetchUserPhoto();
    }
  }, [userId, isOpen, userPhotoURL]);

  // Subscribe to real-time user profile updates
  useEffect(() => {
    if (!userId || !isOpen) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setProfile(prev => ({
            ...prev,
            ...data,
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0
          }));
        }
      },
      (error) => {
        console.error('Error in user profile subscription:', error);
        setError('Failed to load user profile');
      }
    );

    return () => unsubscribe();
  }, [userId, isOpen]);

  const handleMouseEnter = async () => {
    console.log('UserHoverCard: Mouse enter for userId:', userId);
    
    // Clear any pending close timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // Don't show the card if there's no userId
    if (!userId) {
      console.log('UserHoverCard: No userId provided, not showing card');
      setError('User profile not available');
      return;
    }
    
    // Show the card immediately
    setIsOpen(true);
    setError(null);
    
    // Only fetch profile if we don't have it yet
    if (!profile) {
      setLoading(true);
      try {
        console.log('UserHoverCard: Fetching user profile');
        const result = await getUserProfile(userId);
        console.log('UserHoverCard: Profile fetch result:', result);
        
        if (result.success) {
          setProfile(result.data);
        } else {
          setError(result.error || 'Failed to load user profile');
          console.error('UserHoverCard: Failed to fetch profile:', result.error);
        }
      } catch (error) {
        setError('Failed to load user profile');
        console.error('UserHoverCard: Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsOpen(false);
    }, 300);
    setHoverTimeout(timeout);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-72 bg-base-100 shadow-xl rounded-xl p-4 mt-2"
          >
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : error ? (
              <div className="text-error text-center p-4">{error}</div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img
                        src={userPhotoURL || '/default-avatar.png'}
                        alt={profile.displayName || 'User avatar'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Link 
                      to={`/profile/${userId}`}
                      className="text-lg font-semibold hover:text-primary transition-colors"
                    >
                      {profile.displayName || 'Anonymous User'}
                    </Link>
                    <p className="text-sm text-base-content/70">{profile.email}</p>
                    {currentUser && currentUser.uid !== userId && (
                      <div className="mt-2">
                        <FollowButton targetUserId={userId} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Link
                    to={`/profile/${userId}`}
                    className="stats shadow stats-vertical cursor-pointer hover:bg-base-200 transition-colors"
                  >
                    <div className="stat p-2">
                      <div className="stat-title text-xs">Posts</div>
                      <div className="stat-value text-lg">{profile.postsCount || 0}</div>
                    </div>
                  </Link>
                  <Link
                    to={`/profile/${userId}?tab=followers`}
                    className="stats shadow stats-vertical cursor-pointer hover:bg-base-200 transition-colors"
                  >
                    <div className="stat p-2">
                      <div className="stat-title text-xs">Followers</div>
                      <div className="stat-value text-lg">{profile.followersCount || 0}</div>
                    </div>
                  </Link>
                  <Link
                    to={`/profile/${userId}?tab=following`}
                    className="stats shadow stats-vertical cursor-pointer hover:bg-base-200 transition-colors"
                  >
                    <div className="stat p-2">
                      <div className="stat-title text-xs">Following</div>
                      <div className="stat-value text-lg">{profile.followingCount || 0}</div>
                    </div>
                  </Link>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
