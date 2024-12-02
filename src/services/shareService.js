import { db } from '../firebase/config';
import { 
  doc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  increment, 
  writeBatch
} from 'firebase/firestore';

// Track share event
export const trackShare = async (postId, userId, platform) => {
  const batch = writeBatch(db);
  
  try {
    // Add share event to analytics
    const shareRef = collection(db, 'shareAnalytics');
    const shareData = {
      postId,
      userId,
      platform,
      timestamp: serverTimestamp()
    };
    
    // Update share count in post document
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      shareCount: increment(1),
      [`sharePlatformCounts.${platform}`]: increment(1)
    });

    // Add to user's share history
    const userShareRef = collection(db, 'users', userId, 'shares');
    const userShareData = {
      ...shareData,
      id: postId
    };

    // Execute batch write
    await batch.commit();
    await addDoc(shareRef, shareData);
    await addDoc(userShareRef, userShareData);

    return { success: true };
  } catch (error) {
    console.error('Error tracking share:', error);
    throw error;
  }
};

// Get share history for a user
export const getUserShares = async (userId) => {
  try {
    const userSharesRef = collection(db, 'users', userId, 'shares');
    const snapshot = await getDocs(userSharesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting user shares:', error);
    throw error;
  }
};

// Get share analytics for a post
export const getPostShareAnalytics = async (postId) => {
  try {
    const analyticsRef = collection(db, 'shareAnalytics');
    const query = query(analyticsRef, where('postId', '==', postId));
    const snapshot = await getDocs(query);
    
    const analytics = {
      totalShares: 0,
      platformBreakdown: {},
      shareHistory: []
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      analytics.totalShares++;
      analytics.platformBreakdown[data.platform] = (analytics.platformBreakdown[data.platform] || 0) + 1;
      analytics.shareHistory.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate()
      });
    });
    
    return analytics;
  } catch (error) {
    console.error('Error getting post share analytics:', error);
    throw error;
  }
};
