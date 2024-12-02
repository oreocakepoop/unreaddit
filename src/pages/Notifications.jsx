import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markNotificationAsRead } from '../services/notificationService';
import PostCard from '../components/PostCard';
import { 
  BellIcon, 
  UserPlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPosts, setUserPosts] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      async (newNotifications) => {
        setNotifications(newNotifications);
        
        // Fetch posts for follow notifications
        const followNotifications = newNotifications.filter(n => n.type === 'follow');
        for (const notification of followNotifications) {
          if (!userPosts[notification.senderId]) {
            try {
              // Get the latest post from the followed user
              const postsRef = collection(db, 'posts');
              const q = query(
                postsRef,
                where('userId', '==', notification.senderId),
                where('draft', '==', false),
                where('visibility', '==', 'public'),
                orderBy('createdAt', 'desc'),
                limit(1)
              );
              
              const snapshot = await getDocs(q);
              if (!snapshot.empty) {
                setUserPosts(prev => ({
                  ...prev,
                  [notification.senderId]: {
                    id: snapshot.docs[0].id,
                    ...snapshot.docs[0].data()
                  }
                }));
              }
            } catch (error) {
              console.error('Error fetching user posts:', error);
            }
          }
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
        setError('Failed to load notifications');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
  };

  const renderNotificationContent = (notification) => {
    switch (notification.type) {
      case 'follow':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserPlusIcon className="w-5 h-5 text-primary" />
              <Link 
                to={`/profile/${notification.senderId}`}
                className="font-semibold hover:text-primary"
              >
                {notification.senderName}
              </Link>
              <span>started following you</span>
            </div>
            {userPosts[notification.senderId] && (
              <div className="pl-8">
                <PostCard post={userPosts[notification.senderId]} />
              </div>
            )}
          </div>
        );
      case 'like':
        return (
          <div className="flex items-center gap-3">
            <HeartIcon className="w-5 h-5 text-red-500" />
            <Link 
              to={`/profile/${notification.senderId}`}
              className="font-semibold hover:text-primary"
            >
              {notification.senderName}
            </Link>
            <span>liked your post</span>
          </div>
        );
      case 'comment':
        return (
          <div className="flex items-center gap-3">
            <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />
            <Link 
              to={`/profile/${notification.senderId}`}
              className="font-semibold hover:text-primary"
            >
              {notification.senderName}
            </Link>
            <span>commented on your post</span>
          </div>
        );
      case 'newPost':
        return (
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-5 h-5 text-primary" />
            <Link 
              to={`/profile/${notification.senderId}`}
              className="font-semibold hover:text-primary"
            >
              {notification.senderName}
            </Link>
            <span>created a new post</span>
            {notification.postId && (
              <Link 
                to={`/post/${notification.postId}`}
                className="text-primary hover:underline"
              >
                View Post
              </Link>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-error text-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <BellIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg ${notification.read ? 'bg-base-200' : 'bg-base-300'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              {renderNotificationContent(notification)}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {notifications.length === 0 && (
          <div className="text-center text-base-content/60 py-8">
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
