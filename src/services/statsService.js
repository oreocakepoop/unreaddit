import { db } from '../firebase/config';
import { collection, query, where, getDocs, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';

export const subscribeToStats = (callback) => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));

  console.log('Setting up real-time stats listeners...');

  // Subscribe to all posts
  const postsRef = collection(db, 'posts');
  const allPostsQuery = query(postsRef, orderBy('createdAt', 'desc'));
  
  // Subscribe to monthly posts
  const monthlyPostsQuery = query(
    collection(db, 'posts'),
    where('createdAt', '>=', Timestamp.fromDate(firstDayOfMonth)),
    where('createdAt', '<=', Timestamp.fromDate(lastDayOfMonth))
  );

  // Subscribe to recent posts (24h)
  const recentPostsQuery = query(
    collection(db, 'posts'),
    where('createdAt', '>=', Timestamp.fromDate(last24Hours))
  );

  // Subscribe to users
  const usersRef = collection(db, 'users');
  const usersQuery = query(usersRef);

  let totalPosts = 0;
  let monthlyPosts = 0;
  let totalUsers = 0;
  let monthlyActiveUsers = new Set();
  let recentActiveUsers = new Set();

  // Set up listeners
  const unsubscribeTotalPosts = onSnapshot(allPostsQuery, (snapshot) => {
    totalPosts = snapshot.size;
    updateStats();
  });

  const unsubscribeMonthlyPosts = onSnapshot(monthlyPostsQuery, (snapshot) => {
    monthlyPosts = snapshot.size;
    monthlyActiveUsers = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId || data.authorId;
      if (userId) monthlyActiveUsers.add(userId);
    });
    updateStats();
  });

  const unsubscribeRecentPosts = onSnapshot(recentPostsQuery, (snapshot) => {
    recentActiveUsers = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId || data.authorId;
      if (userId) recentActiveUsers.add(userId);
    });
    updateStats();
  });

  const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
    totalUsers = snapshot.size;
    updateStats();
  });

  function updateStats() {
    const postPercentage = totalPosts > 0 ? ((monthlyPosts / totalPosts) * 100).toFixed(1) : 0;
    const userPercentage = totalUsers > 0 ? ((monthlyActiveUsers.size / totalUsers) * 100).toFixed(1) : 0;
    const activePercentage = totalUsers > 0 ? ((recentActiveUsers.size / totalUsers) * 100).toFixed(1) : 0;

    const stats = {
      posts: {
        total: Number(totalPosts),
        monthly: Number(monthlyPosts),
        percentage: Number(postPercentage),
        trend: monthlyPosts > totalPosts/12 ? 'up' : monthlyPosts < totalPosts/12 ? 'down' : 'neutral'
      },
      users: {
        total: Number(totalUsers),
        monthly: Number(monthlyActiveUsers.size),
        percentage: Number(userPercentage),
        trend: monthlyActiveUsers.size > totalUsers/12 ? 'up' : monthlyActiveUsers.size < totalUsers/12 ? 'down' : 'neutral'
      },
      active: {
        total: Number(recentActiveUsers.size),
        percentage: Number(activePercentage),
        trend: recentActiveUsers.size > totalUsers/30 ? 'up' : recentActiveUsers.size < totalUsers/30 ? 'down' : 'neutral'
      }
    };

    console.log('Real-time stats update:', stats);
    callback(stats);
  }

  // Return unsubscribe function
  return () => {
    console.log('Unsubscribing from real-time stats...');
    unsubscribeTotalPosts();
    unsubscribeMonthlyPosts();
    unsubscribeRecentPosts();
    unsubscribeUsers();
  };
};

// Keep the old function for backwards compatibility
export const getMonthlyStats = async () => {
  return new Promise((resolve) => {
    const unsubscribe = subscribeToStats((stats) => {
      unsubscribe();
      resolve(stats);
    });
  });
};
