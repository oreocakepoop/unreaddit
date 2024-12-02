import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';

function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAllRead } = useNotifications();

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={toggleOpen}
        className="btn btn-ghost btn-circle relative"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            <div className="bg-primary text-primary-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </div>
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={handleClose}
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute right-0 mt-2 w-80 max-h-[32rem] overflow-hidden rounded-box bg-base-100 shadow-lg z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-base-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllRead}
                      className="btn btn-ghost btn-sm gap-2"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[calc(32rem-4rem)]">
                {loading ? (
                  <div className="p-4 text-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : notifications.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClose={handleClose}
                      />
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="p-8 text-center text-base-content/60">
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;
