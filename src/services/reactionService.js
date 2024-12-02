import { db } from '../firebase/config';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';

// Available reaction types
export const REACTION_TYPES = {
  LIKE: { type: 'like', emoji: '👍', label: 'Like' },
  LOVE: { type: 'love', emoji: '❤️', label: 'Love' },
  LAUGH: { type: 'laugh', emoji: '😄', label: 'Laugh' },
  WOW: { type: 'wow', emoji: '😮', label: 'Wow' },
  SAD: { type: 'sad', emoji: '😢', label: 'Sad' },
  ANGRY: { type: 'angry', emoji: '😠', label: 'Angry' }
};

// Add or update a reaction
export const addReaction = async (postId, userId, reactionType) => {
  try {
    const reactionRef = doc(db, 'posts', postId, 'reactions', userId);
    await setDoc(reactionRef, {
      type: reactionType,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding reaction:', error);
    return { error: error.message };
  }
};

// Remove a reaction
export const removeReaction = async (postId, userId) => {
  try {
    const reactionRef = doc(db, 'posts', postId, 'reactions', userId);
    await deleteDoc(reactionRef);
    return { success: true };
  } catch (error) {
    console.error('Error removing reaction:', error);
    return { error: error.message };
  }
};

// Get current user's reaction for a post
export const getUserReaction = async (postId, userId) => {
  try {
    const reactionRef = doc(db, 'posts', postId, 'reactions', userId);
    const reactionDoc = await getDoc(reactionRef);
    return reactionDoc.exists() ? reactionDoc.data().type : null;
  } catch (error) {
    console.error('Error getting user reaction:', error);
    return null;
  }
};

// Subscribe to reactions for a post
export const subscribeToReactions = (postId, callback) => {
  const reactionsRef = collection(db, 'posts', postId, 'reactions');
  
  const unsubscribe = onSnapshot(reactionsRef, (snapshot) => {
    const reactions = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!reactions[data.type]) {
        reactions[data.type] = 0;
      }
      reactions[data.type]++;
    });
    callback(reactions);
  }, (error) => {
    console.error('Error in reactions subscription:', error);
  });

  return unsubscribe;
};
