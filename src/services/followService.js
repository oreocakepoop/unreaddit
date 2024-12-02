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
  increment,
  limit
} from 'firebase/firestore';
import { createNotification } from './notificationService';

// Follow a user
export const followUser = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    throw new Error('Invalid user IDs');
  }

  const batch = writeBatch(db);
  const followId = `${currentUserId}_${targetUserId}`;
  
  try {
    // Create follow document
    const followRef = doc(db, 'follows', followId);
    const followDoc = await getDoc(followRef);
    
    if (followDoc.exists()) {
      throw new Error('Already following this user');
    }

    // Get current user's data for notification
    const currentUserRef = doc(db, 'users', currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    const currentUserData = currentUserDoc.data() || {};

    // Get target user data for the follow document
    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);
    const targetUserData = targetUserDoc.data() || {};

    // Create the follow document
    batch.set(followRef, {
      followerId: currentUserId,
      followingId: targetUserId,
      createdAt: serverTimestamp(),
      followerName: currentUserData.displayName || 'Anonymous',
      followingName: targetUserData.displayName || 'Anonymous'
    });

    // Update follower's following count
    batch.update(currentUserRef, {
      followingCount: increment(1)
    });

    // Update target's followers count
    batch.update(targetUserRef, {
      followersCount: increment(1)
    });

    // Add to current user's following collection
    const userFollowingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    batch.set(userFollowingRef, {
      userId: targetUserId,
      followedAt: serverTimestamp(),
      displayName: targetUserData.displayName || 'Anonymous',
      email: targetUserData.email || '',
      photoURL: targetUserData.photoURL || null
    });

    // Add to target user's followers collection
    const targetFollowersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
    batch.set(targetFollowersRef, {
      userId: currentUserId,
      followedAt: serverTimestamp(),
      displayName: currentUserData.displayName || 'Anonymous',
      email: currentUserData.email || '',
      photoURL: currentUserData.photoURL || null
    });

    // Commit the batch
    await batch.commit();

    // Create notification for the target user
    await createNotification({
      type: 'follow',
      senderId: currentUserId,
      recipientId: targetUserId,
      senderName: currentUserData.displayName || 'Someone',
      senderPhotoURL: currentUserData.photoURL || null
    });

    return { 
      success: true,
      data: {
        followersCount: (targetUserData.followersCount || 0) + 1,
        followingCount: (currentUserData.followingCount || 0) + 1
      }
    };
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

// Unfollow a user
export const unfollowUser = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) {
    throw new Error('Invalid user IDs');
  }

  const batch = writeBatch(db);
  const followId = `${currentUserId}_${targetUserId}`;

  try {
    // Get the follow document
    const followRef = doc(db, 'follows', followId);
    const followDoc = await getDoc(followRef);

    if (!followDoc.exists()) {
      throw new Error('Not following this user');
    }

    // Get user refs
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Get current counts
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    const currentUserData = currentUserDoc.data() || {};
    const targetUserData = targetUserDoc.data() || {};

    // Delete the follow document
    batch.delete(followRef);

    // Update follower's following count
    batch.update(currentUserRef, {
      followingCount: increment(-1)
    });

    // Update target's followers count
    batch.update(targetUserRef, {
      followersCount: increment(-1)
    });

    // Remove from current user's following collection
    const userFollowingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    batch.delete(userFollowingRef);

    // Remove from target user's followers collection
    const targetFollowersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
    batch.delete(targetFollowersRef);

    // Commit the batch
    await batch.commit();

    return { 
      success: true,
      data: {
        followersCount: Math.max((targetUserData.followersCount || 0) - 1, 0),
        followingCount: Math.max((currentUserData.followingCount || 0) - 1, 0)
      }
    };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is following another user
export const isFollowing = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) return false;
  
  try {
    const followId = `${currentUserId}_${targetUserId}`;
    const followRef = doc(db, 'follows', followId);
    const followDoc = await getDoc(followRef);
    return followDoc.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

// Get user's followers
export const getFollowers = async (userId) => {
  try {
    const followsQuery = query(
      collection(db, 'follows'),
      where('followingId', '==', userId)
    );
    
    const snapshot = await getDocs(followsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.data().followerId,
      displayName: doc.data().followerName,
      email: doc.data().followerEmail,
      photoURL: doc.data().followerPhotoURL,
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting followers:', error);
    throw error;
  }
};

// Get users that a user is following
export const getFollowing = async (userId) => {
  try {
    const followsQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', userId)
    );
    
    const querySnapshot = await getDocs(followsQuery);
    return querySnapshot.docs.map(doc => doc.data().followingId);
  } catch (error) {
    console.error('Error getting following:', error);
    throw error;
  }
};

// Get follow suggestions for a user
export const getFollowSuggestions = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // Get users the current user is already following
    const followingSnapshot = await getDocs(
      query(collection(db, 'follows'), where('followerId', '==', userId))
    );
    const followingIds = new Set(followingSnapshot.docs.map(doc => doc.data().followingId));
    followingIds.add(userId); // Add current user to exclude from suggestions

    // Get all users
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), limit(20))
    );

    // Filter out users already being followed and sort by activity
    const suggestions = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => !followingIds.has(user.id))
      .sort((a, b) => (b.lastActivityAt?.toMillis() || 0) - (a.lastActivityAt?.toMillis() || 0));

    return suggestions;
  } catch (error) {
    console.error('Error getting follow suggestions:', error);
    throw error;
  }
};
