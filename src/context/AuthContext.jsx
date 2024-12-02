import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [followingList, setFollowingList] = useState(new Set());
  const [unsubscribeStats, setUnsubscribeStats] = useState(null);
  const [unsubscribeFollowing, setUnsubscribeFollowing] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        
        // Set up real-time listener for user stats
        const userRef = doc(db, 'users', user.uid);
        const statsUnsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserStats({
              followersCount: data.followersCount || 0,
              followingCount: data.followingCount || 0,
              postsCount: data.postsCount || 0
            });
          }
        });
        setUnsubscribeStats(() => statsUnsubscribe);

        // Set up real-time listener for following list
        const followingRef = collection(db, 'users', user.uid, 'following');
        const followingUnsubscribe = onSnapshot(followingRef, (snapshot) => {
          const following = new Set();
          snapshot.forEach(doc => following.add(doc.id));
          setFollowingList(following);
        });
        setUnsubscribeFollowing(() => followingUnsubscribe);
      } else {
        setCurrentUser(null);
        setUserStats(null);
        setFollowingList(new Set());
        if (unsubscribeStats) {
          unsubscribeStats();
          setUnsubscribeStats(null);
        }
        if (unsubscribeFollowing) {
          unsubscribeFollowing();
          setUnsubscribeFollowing(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeStats) {
        unsubscribeStats();
      }
      if (unsubscribeFollowing) {
        unsubscribeFollowing();
      }
    };
  }, []);

  const isFollowing = useCallback((userId) => {
    return followingList.has(userId);
  }, [followingList]);

  const createOrUpdateUser = async (userData) => {
    try {
      const userRef = doc(db, 'users', userData.uid);
      await setDoc(userRef, userData, { merge: true });
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  };

  const signup = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Create user document in Firestore
      await createOrUpdateUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName || '',
        photoURL: result.user.photoURL || ''
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update user document in Firestore
      await createOrUpdateUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || ''
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, updates);
      
      // Also update the user document in Firestore
      if (updates.photoURL !== undefined) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          photoURL: updates.photoURL
        }, { merge: true });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    loading,
    userStats,
    isFollowing,
    signup,
    login,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
