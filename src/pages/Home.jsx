import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import PostCard from '../components/PostCard';
import CreatePostForm from '../components/CreatePostForm';
import FeedToggle from '../components/FeedToggle';
import FollowSuggestions from '../components/FollowSuggestions';
import { getFollowing } from '../services/followService';
import { getFollowedPosts } from '../services/postFollowService';
import { getBookmarkedPosts } from '../services/bookmarkService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function Home() {
  const { currentUser } = useAuth();
  const { posts, loading, error, hasMore, fetchPosts } = usePosts();
  const [activeTab, setActiveTab] = useState('all');
  const [followedUsers, setFollowedUsers] = useState([]);
  const [followedPosts, setFollowedPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading) return;

      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000;

      if (scrolledToBottom) {
        console.log('Home: Loading more posts...');
        fetchPosts(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, fetchPosts]);

  // Initial posts fetch
  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch following list and bookmarks
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      if (activeTab === 'followed') {
        setFollowingLoading(true);
        try {
          const [followedUsersList, followedPostsList] = await Promise.all([
            getFollowing(currentUser.uid),
            getFollowedPosts(currentUser.uid)
          ]);
          
          setFollowedUsers(followedUsersList);
          setFollowedPosts(followedPostsList);
        } catch (error) {
          console.error('Error fetching following:', error);
        } finally {
          setFollowingLoading(false);
        }
      }

      if (activeTab === 'bookmarked') {
        setBookmarksLoading(true);
        try {
          // Get all bookmarked post IDs
          const bookmarksRef = collection(db, 'bookmarks');
          const bookmarkQuery = query(
            bookmarksRef,
            where('userId', '==', currentUser.uid)
          );
          const bookmarkDocs = await getDocs(bookmarkQuery);
          const bookmarkedPostIds = bookmarkDocs.docs.map(doc => doc.data().postId);
          setBookmarkedPosts(bookmarkedPostIds);
        } catch (error) {
          console.error('Error fetching bookmarks:', error);
        } finally {
          setBookmarksLoading(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser, activeTab]);

  // Filter posts based on active tab
  useEffect(() => {
    if (!currentUser) {
      setFilteredPosts(posts);
      return;
    }

    switch (activeTab) {
      case 'followed':
        setFilteredPosts(posts.filter(post => 
          followedUsers.includes(post.userId) || 
          followedPosts.includes(post.id)
        ));
        break;
      case 'bookmarked':
        setFilteredPosts(posts.filter(post => 
          bookmarkedPosts.includes(post.id)
        ));
        break;
      default:
        setFilteredPosts(posts);
    }
  }, [posts, activeTab, followedUsers, followedPosts, bookmarkedPosts, currentUser]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const isLoading = loading || followingLoading || bookmarksLoading;
  const displayPosts = filteredPosts;

  return (
    <div>
      {/* Header with sticky background */}
      <header className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="max-w-[680px] ml-20">
          <div className="p-4">
            <h1 className="text-xl font-bold">Home</h1>
          </div>
          {currentUser && (
            <FeedToggle 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
            />
          )}
        </div>
      </header>

      {/* Content area with fixed width */}
      <div className="max-w-[680px] ml-20 pt-4">
        {/* Create post */}
        {currentUser && <CreatePostForm />}

        {/* Follow suggestions */}
        {currentUser && activeTab === 'all' && <FollowSuggestions />}

        {/* Posts feed */}
        {error && (
          <div className="p-4 text-error text-center">
            Error loading posts: {error}
          </div>
        )}
        
        {isLoading && displayPosts.length === 0 && (
          <div className="p-4 text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {!isLoading && displayPosts.length === 0 && (
          <div className="p-8 text-center text-base-content/60">
            {activeTab === 'bookmarked' ? (
              <p>No bookmarked posts yet. Save posts to see them here!</p>
            ) : activeTab === 'followed' ? (
              <p>No posts from followed users yet. Follow more users to see their posts!</p>
            ) : (
              <p>No posts available. Be the first to create one!</p>
            )}
          </div>
        )}

        <AnimatePresence>
          {displayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              className="mb-4"
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Home;
