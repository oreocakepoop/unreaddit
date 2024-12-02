import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { followUser, unfollowUser } from '../services/followService';
import { motion } from 'framer-motion';

function FollowButton({ targetUserId, className = '', onFollowStateChange }) {
  const { currentUser, isFollowing: isUserFollowing } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleFollowAction = async () => {
    if (!currentUser || !targetUserId || loading) return;

    setLoading(true);
    try {
      if (isUserFollowing(targetUserId)) {
        await unfollowUser(currentUser.uid, targetUserId);
      } else {
        await followUser(currentUser.uid, targetUserId);
      }
      // Call the callback after successful follow/unfollow
      if (onFollowStateChange) {
        onFollowStateChange();
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.uid === targetUserId) {
    return null;
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleFollowAction}
      disabled={loading}
      className={`btn btn-xs min-w-[80px] ${
        isUserFollowing(targetUserId) 
          ? 'btn-outline btn-primary hover:btn-error' 
          : 'btn-primary'
      } ${loading ? 'loading' : ''} ${className}`}
    >
      {loading ? '' : isUserFollowing(targetUserId) ? 'Following' : 'Follow'}
    </motion.button>
  );
}

export default FollowButton;
