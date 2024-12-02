import { db } from '../firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const createOrUpdateUser = async (user) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  
  try {
    // First check if the user document exists
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        bio: '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        postsCount: 0
      });
    } else {
      // Update user document with any new information
      await setDoc(userRef, {
        lastLogin: serverTimestamp(),
        displayName: user.displayName || userDoc.data().displayName || '',
        photoURL: user.photoURL || userDoc.data().photoURL || '',
        email: user.email || userDoc.data().email || ''
      }, { merge: true });
    }

    return { success: true };
  } catch (error) {
    console.error('Error managing user document:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  if (!userId) {
    console.log('getUserProfile: No userId provided');
    return { success: false, error: 'User ID is required' };
  }

  try {
    console.log('getUserProfile: Fetching profile for userId:', userId);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('getUserProfile: User document does not exist, attempting to create');
      // Create a basic profile
      const userData = {
        uid: userId,
        displayName: 'Anonymous',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        bio: ''
      };

      try {
        await setDoc(userRef, userData);
        console.log('getUserProfile: Created new user profile');
        
        // Fetch the newly created profile
        const newUserDoc = await getDoc(userRef);
        if (newUserDoc.exists()) {
          const newUserData = newUserDoc.data();
          console.log('getUserProfile: Successfully retrieved new profile:', newUserData);
          return {
            success: true,
            data: {
              ...newUserData,
              id: newUserDoc.id,
              createdAt: newUserData.createdAt?.toDate() || null,
              lastLogin: newUserData.lastLogin?.toDate() || null
            }
          };
        }
      } catch (createError) {
        console.error('getUserProfile: Error creating user profile:', createError);
      }
      return { success: false, error: 'User not found and could not create profile' };
    }

    const userData = userDoc.data();
    console.log('getUserProfile: Successfully retrieved existing profile:', userData);
    return {
      success: true,
      data: {
        ...userData,
        id: userDoc.id,
        createdAt: userData.createdAt?.toDate() || null,
        lastLogin: userData.lastLogin?.toDate() || null
      }
    };
  } catch (error) {
    console.error('getUserProfile: Error fetching user profile:', error);
    return { success: false, error: error.message };
  }
};
