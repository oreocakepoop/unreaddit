import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc, increment as firestoreIncrement } from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Image processing utility
export const processImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Max dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to Blob
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', 0.8); // 80% quality JPEG
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Media upload utility
export const uploadMedia = async (file, path) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// User stats update utility
export const updateUserStats = async (userId, field, amount) => {
  if (!userId || !field) return;

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Create new document with initial stats
    await setDoc(userRef, {
      [field]: amount,
      createdAt: new Date()
    });
  } else {
    // Update existing document
    await updateDoc(userRef, {
      [field]: firestoreIncrement(amount)
    });
  }
};

// Mention extraction utility
export const extractMentions = (content) => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map(match => match.slice(1)) : [];
};

// Search indexing utility
export const indexPostContent = async (postData) => {
  if (!import.meta.env.VITE_ENABLE_SEARCH === 'true') return;

  try {
    const searchDoc = doc(db, 'search_index', postData.id);
    await setDoc(searchDoc, {
      title: postData.title.toLowerCase(),
      content: postData.content.toLowerCase(),
      tags: postData.tags.map(tag => tag.toLowerCase()),
      createdAt: new Date(),
      type: 'post'
    });
  } catch (error) {
    console.error('Error indexing post:', error);
    // Don't throw - indexing failure shouldn't stop post creation
  }
};

// Error logging utility
export const logError = async (type, error, metadata = {}) => {
  const errorDoc = doc(db, 'errors', uuidv4());
  await setDoc(errorDoc, {
    type,
    message: error.message,
    stack: error.stack,
    metadata,
    timestamp: new Date()
  });
};
