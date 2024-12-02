import { motion } from 'framer-motion';
import { BookmarkIcon, UsersIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

function FeedToggle({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'all', label: 'All Posts', icon: GlobeAltIcon },
    { id: 'followed', label: 'Following', icon: UsersIcon },
    { id: 'bookmarked', label: 'Bookmarked', icon: BookmarkIcon }
  ];

  return (
    <div className="flex gap-2 p-4 border-b border-base-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange(tab.id)}
            className={`btn btn-sm gap-2 ${
              activeTab === tab.id 
                ? 'btn-primary' 
                : 'btn-ghost'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export default FeedToggle;
