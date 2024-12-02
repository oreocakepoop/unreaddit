import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const getUserPhoto = async (userId) => {
  if (!userId) {
    console.log('getUserPhoto: No userId provided');
    return null;
  }

  if (typeof userId !== 'string') {
    console.error('getUserPhoto: Invalid userId type:', typeof userId);
    return null;
  }
  
  try {
    console.log('getUserPhoto: Starting fetch for userId:', userId);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('getUserPhoto: User document does not exist for userId:', userId);
      return null;
    }

    const userData = userDoc.data();
    console.log('getUserPhoto: User data found:', {
      userId,
      hasPhotoURL: !!userData.photoURL,
      photoURL: userData.photoURL
    });

    if (!userData.photoURL) {
      console.log('getUserPhoto: No photoURL found for user:', userId);
      return null;
    }

    return userData.photoURL;
  } catch (error) {
    console.error('getUserPhoto: Error fetching user photo:', error);
    return null;
  }
};
