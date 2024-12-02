import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';

export const useUserStats = (userId) => {
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    joined: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;
      
      setLoading(true);
      const db = getFirestore();
      
      try {
        // Fetch post count
        const postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', userId)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsCount = postsSnapshot.size;

        // Get user's creation date from their first post
        let joinDate = 'Recently';
        if (postsCount > 0) {
          const oldestPost = postsSnapshot.docs
            .map(doc => doc.data().createdAt)
            .sort()[0];
          if (oldestPost) {
            joinDate = new Date(oldestPost).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            });
          }
        }

        // For now, we'll use placeholder data for followers/following
        // This can be expanded later when we implement the follow system
        setStats({
          posts: postsCount,
          followers: Math.floor(postsCount * 2.5), // Placeholder calculation
          following: Math.floor(postsCount * 1.8), // Placeholder calculation
          joined: joinDate
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};
