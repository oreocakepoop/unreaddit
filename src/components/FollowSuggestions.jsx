import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getFollowSuggestions } from '../services/followService';
import FollowButton from './FollowButton';
import Avatar from './Avatar';
import { Link } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function FollowSuggestions() {
  const { currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFollowStateChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const result = await getFollowSuggestions(currentUser.uid);
        setSuggestions(result.slice(0, 5)); // Limit to 5 suggestions
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError('Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser, refreshKey]);

  if (!currentUser || error || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-100 border border-base-300 rounded-box p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <UserGroupIcon className="w-5 h-5" />
        <h2 className="font-medium">Suggested Users</h2>
      </div>

      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between"
              >
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <Avatar
                    size="sm"
                    photoURL={user.photoURL}
                    seed={user.email}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {user.displayName || 'Anonymous'}
                    </div>
                    <div className="text-xs text-base-content/60 truncate">
                      {user.bio || 'No bio yet'}
                    </div>
                  </div>
                </Link>
                <FollowButton 
                  targetUserId={user.id} 
                  className="ml-2" 
                  onFollowStateChange={handleFollowStateChange} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
