import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import Avatar from './Avatar';
import { forwardRef } from 'react';

const NotificationItem = forwardRef(({ notification, onClose }, ref) => {
  const navigate = useNavigate();
  const { markAsRead, removeNotification } = useNotifications();

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        navigate(`/user/${notification.senderId}`);
        break;
      case 'new_post':
        if (notification.postId) {
          navigate(`/post/${notification.postId}`);
        }
        break;
      default:
        break;
    }

    onClose?.();
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    await removeNotification(notification.id);
  };

  const getNotificationContent = () => {
    switch (notification.type) {
      case 'new_post':
        return {
          message: notification.message || `New post from ${notification.senderName}`,
          icon: '📝',
          avatar: {
            seed: notification.senderEmail,
            photoURL: notification.senderPhotoURL
          }
        };
      case 'follow':
        return {
          message: notification.message || `${notification.senderName} started following you`,
          icon: '👥',
          avatar: {
            seed: notification.senderEmail,
            photoURL: notification.senderPhotoURL
          }
        };
      case 'mention':
        return {
          message: notification.message || `${notification.senderName} mentioned you`,
          icon: '@',
          avatar: {
            seed: notification.senderEmail,
            photoURL: notification.senderPhotoURL
          }
        };
      default:
        return {
          message: notification.message || 'New notification',
          icon: '🔔',
          avatar: null
        };
    }
  };

  const content = getNotificationContent();
  const timeAgo = notification.createdAt ? formatDistanceToNow(
    notification.createdAt instanceof Date 
      ? notification.createdAt 
      : (notification.createdAt.toDate?.() || new Date(notification.createdAt)),
    { addSuffix: true }
  ) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-base-200 ${
        !notification.read ? 'bg-base-200' : ''
      }`}
      onClick={handleClick}
    >
      {content.avatar && (
        <Avatar
          size="sm"
          photoURL={content.avatar.photoURL}
          seed={content.avatar.seed}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-base-content/90 mb-1">{content.message}</p>
        <span className="text-xs text-base-content/60">{timeAgo}</span>
      </div>
      <button
        onClick={handleRemove}
        className="btn btn-ghost btn-xs p-1 h-auto min-h-0 hover:bg-base-300"
        title="Remove notification"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
});

NotificationItem.displayName = 'NotificationItem';
export default NotificationItem;
