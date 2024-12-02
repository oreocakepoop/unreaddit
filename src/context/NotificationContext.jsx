import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  markMultipleAsRead,
  getUnreadCount 
} from '../services/notificationService';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to notifications
  useEffect(() => {
    let unsubscribe = null;

    if (currentUser?.uid) {
      setLoading(true);
      unsubscribe = subscribeToNotifications(
        currentUser.uid,
        (newNotifications) => {
          setNotifications(newNotifications);
          const unreadNotifications = newNotifications.filter(n => !n.read);
          setUnreadCount(unreadNotifications.length);
          setLoading(false);
          setError(null);

          // Show toast for new notifications
          const latestNotification = newNotifications[0];
          if (latestNotification && !latestNotification.read && latestNotification.createdAt > new Date(Date.now() - 5000)) {
            toast(latestNotification.message, {
              icon: latestNotification.type === 'follow' ? '👥' : '🔔',
              duration: 4000,
            });
          }
        },
        (error) => {
          console.error('Notification subscription error:', error);
          setError(error.message);
          setLoading(false);
        }
      );
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Remove a notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error removing notification:', error);
      toast.error('Failed to remove notification');
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      await markMultipleAsRead(
        unreadNotifications.map(n => n.id),
        currentUser.uid
      );

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, [currentUser?.uid, notifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    removeNotification,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
