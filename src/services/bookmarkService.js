import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Add a bookmark
export const addBookmark = async (userId, postId) => {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const bookmarkQuery = query(
      bookmarksRef,
      where('userId', '==', userId),
      where('postId', '==', postId)
    );
    
    const existingBookmark = await getDocs(bookmarkQuery);
    if (!existingBookmark.empty) {
      throw new Error('Post already bookmarked');
    }

    const bookmark = {
      userId,
      postId,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(bookmarksRef, bookmark);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
};

// Remove a bookmark
export const removeBookmark = async (userId, postId) => {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const bookmarkQuery = query(
      bookmarksRef,
      where('userId', '==', userId),
      where('postId', '==', postId)
    );
    
    const bookmarkDocs = await getDocs(bookmarkQuery);
    if (bookmarkDocs.empty) {
      throw new Error('Bookmark not found');
    }

    // Delete the bookmark document
    await deleteDoc(doc(db, 'bookmarks', bookmarkDocs.docs[0].id));
    return { success: true };
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};

// Get user's bookmarked posts
export const getBookmarkedPosts = async (userId) => {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const bookmarkQuery = query(
      bookmarksRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const bookmarkDocs = await getDocs(bookmarkQuery);
    return bookmarkDocs.docs.map(doc => doc.data().postId);
  } catch (error) {
    console.error('Error getting bookmarked posts:', error);
    throw error;
  }
};

// Check if a post is bookmarked by user
export const isPostBookmarked = async (userId, postId) => {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const bookmarkQuery = query(
      bookmarksRef,
      where('userId', '==', userId),
      where('postId', '==', postId)
    );
    
    const bookmarkDocs = await getDocs(bookmarkQuery);
    return !bookmarkDocs.empty;
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    throw error;
  }
};
