import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  startAfter,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { 
  FireIcon, 
  TagIcon,
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';

const categories = [
  { id: 'trending', icon: FireIcon, label: 'Trending' },
  { id: 'latest', icon: ClockIcon, label: 'Latest' },
  { id: 'discussed', icon: ChartBarIcon, label: 'Most Discussed' },
  { id: 'featured', icon: SparklesIcon, label: 'Featured' }
];

function Explore() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('trending');
  const [trendingTags, setTrendingTags] = useState([
    'technology', 'gaming', 'news', 'art', 'music'
  ]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (loadMore = false) => {
    if (loadMore && !hasMore) return;
    
    setLoading(true);
    setError(null);

    try {
      const postsRef = collection(db, 'posts');
      let q;

      // Base constraints
      const baseConstraints = [limit(10)];
      if (selectedTags.length > 0) {
        baseConstraints.push(where('tags', 'array-contains-any', selectedTags));
      }

      // Add category-specific constraints
      switch (activeCategory) {
        case 'latest':
          q = query(
            postsRef,
            ...baseConstraints,
            orderBy('createdAt', 'desc')
          );
          break;

        case 'discussed':
          // Order by commentCount for most discussed posts
          q = query(
            postsRef,
            ...baseConstraints,
            orderBy('commentCount', 'desc')
          );
          break;

        case 'featured':
          q = query(
            postsRef,
            ...baseConstraints,
            where('featured', '==', true),
            orderBy('createdAt', 'desc')
          );
          break;

        case 'trending':
        default:
          // Simplified trending query using only likesCount
          q = query(
            postsRef,
            ...baseConstraints,
            orderBy('likesCount', 'desc')
          );
          break;
      }

      // Add pagination if loading more
      if (loadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastActivityAt: doc.data().lastActivityAt?.toDate() || new Date()
      }));

      setPosts(prev => loadMore ? [...prev, ...newPosts] : newPosts);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(!snapshot.empty && snapshot.docs.length === 10);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when category or tags change
  useEffect(() => {
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
    fetchPosts();
  }, [activeCategory, selectedTags]);

  const handleTagSelect = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
      {/* Left Sidebar */}
      <div className="md:col-span-1 space-y-4">
        {/* Categories */}
        <div className="bg-base-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Categories</h2>
          <ul className="space-y-2">
            {categories.map(category => (
              <motion.li
                key={category.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors
                    ${activeCategory === category.id ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                >
                  <category.icon className="w-5 h-5" />
                  <span>{category.label}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Trending Tags */}
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <HashtagIcon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Trending Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map(tag => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTagSelect(tag)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
                  ${selectedTags.includes(tag) 
                    ? 'bg-primary text-primary-content' 
                    : 'bg-base-300 hover:bg-base-300/80'}`}
              >
                <TagIcon className="w-4 h-4" />
                {tag}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:col-span-3">
        {/* Content Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {categories.find(c => c.id === activeCategory)?.label || 'Explore'}
          </h1>
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">
                Filtered by tags:
              </span>
              <button
                onClick={() => setSelectedTags([])}
                className="text-sm text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Posts Grid */}
        {error && (
          <div className="text-error text-center p-4">
            Error loading posts: {error}
          </div>
        )}
        
        <AnimatePresence>
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && !loading && (
              <div className="text-center text-base-content/60 p-8">
                No posts found. Try different filters or tags.
              </div>
            )}
          </div>
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center p-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && posts.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchPosts(true)}
              className="btn btn-primary"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
