import { db } from '../firebase/config';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  collection, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp,
  increment 
} from 'firebase/firestore';

// Follow a post
export const followPost = async (userId, postId) => {
  if (!userId || !postId) {
    throw new Error('Invalid user ID or post ID');
  }

  const batch = writeBatch(db);
  const followId = `${userId}_${postId}`;
  
  try {
    // Check if already following
    const followRef = doc(db, 'postFollows', followId);
    const followDoc = await getDoc(followRef);
    
    if (followDoc.exists()) {
      throw new Error('Already following this post');
    }

    // Update post follow document
    batch.set(followRef, {
      userId,
      postId,
      createdAt: serverTimestamp()
    });

    // Update post's follower count
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      followersCount: increment(1)
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error following post:', error);
    throw error;
  }
};

// Unfollow a post
export const unfollowPost = async (userId, postId) => {
  if (!userId || !postId) {
    throw new Error('Invalid user ID or post ID');
  }

  const batch = writeBatch(db);
  const followId = `${userId}_${postId}`;

  try {
    const followRef = doc(db, 'postFollows', followId);
    const followDoc = await getDoc(followRef);

    if (!followDoc.exists()) {
      throw new Error('Not following this post');
    }

    // Delete post follow document
    batch.delete(followRef);

    // Update post's follower count
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      followersCount: increment(-1)
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing post:', error);
    throw error;
  }
};

// Check if user is following a post
export const isFollowingPost = async (userId, postId) => {
  if (!userId || !postId) return false;

  try {
    const followRef = doc(db, 'postFollows', `${userId}_${postId}`);
    const followDoc = await getDoc(followRef);
    return followDoc.exists();
  } catch (error) {
    console.error('Error checking post follow status:', error);
    return false;
  }
};

// Get all posts that a user is following
export const getFollowedPosts = async (userId) => {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, 'postFollows'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().postId);
  } catch (error) {
    console.error('Error getting followed posts:', error);
    return [];
  }
};
