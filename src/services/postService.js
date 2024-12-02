import { db } from '../firebase/config';
import { collection, query, where, getDocs, getCountFromServer, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, orderBy, limit, startAfter } from 'firebase/firestore';

export const getPostsCount = async () => {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getCountFromServer(postsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting posts count:', error);
    return 0;
  }
};

export const subscribeToPostsCount = (callback) => {
  const postsRef = collection(db, 'posts');
  
  return onSnapshot(postsRef, async () => {
    const count = await getPostsCount();
    callback(count);
  });
};

// Add share-related fields when creating a new post
export const createPost = async (postData, userId) => {
  try {
    console.log('postService: Creating post for userId:', userId);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('postService: User profile does not exist, creating one');
      // Create user profile if it doesn't exist
      await setDoc(userRef, {
        uid: userId,
        displayName: 'Anonymous',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        bio: ''
      });
      
      // Fetch the newly created user profile
      const newUserDoc = await getDoc(userRef);
      if (!newUserDoc.exists()) {
        throw new Error('Failed to create user profile');
      }
      console.log('postService: Created new user profile');
    }

    const userData = (await getDoc(userRef)).data();
    console.log('postService: User data:', userData);

    const postRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      authorId: userId,
      authorDisplayName: userData?.displayName || 'Anonymous',
      authorEmail: userData?.email || null,
      createdAt: serverTimestamp(),
      likes: 0,
      comments: [],
      shareCount: 0,
      sharePlatformCounts: {
        copy: 0,
        twitter: 0,
        facebook: 0,
        whatsapp: 0,
        telegram: 0
      }
    });

    // Update user's post count
    await setDoc(userRef, {
      postsCount: (userData?.postsCount || 0) + 1,
      lastActivityAt: serverTimestamp()
    }, { merge: true });

    console.log('postService: Post created successfully');
    return { success: true, id: postRef.id };
  } catch (error) {
    console.error('postService: Error creating post:', error);
    return { success: false, error: error.message };
  }
};

export const getAllPosts = async (lastVisible = null) => {
  try {
    console.log('postService: Fetching all posts');
    const postsRef = collection(db, 'posts');
    let q = query(postsRef, orderBy('createdAt', 'desc'), limit(10));

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const posts = [];

    for (const doc of snapshot.docs) {
      const postData = doc.data();
      
      // Ensure user profile exists for each post author
      const userRef = doc(db, 'users', postData.authorId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('postService: Creating missing user profile for post author:', postData.authorId);
        await setDoc(userRef, {
          uid: postData.authorId,
          displayName: postData.authorDisplayName || 'Anonymous',
          email: postData.authorEmail || null,
          photoURL: postData.authorPhotoURL || null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          followersCount: 0,
          followingCount: 0,
          postsCount: 1,
          bio: ''
        });
      }

      posts.push({
        id: doc.id,
        ...postData,
        createdAt: postData.createdAt?.toDate() || new Date(),
        lastActivityAt: postData.lastActivityAt?.toDate() || new Date()
      });
    }

    console.log('postService: Fetched', posts.length, 'posts');
    return {
      success: true,
      data: posts,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: !snapshot.empty && snapshot.docs.length === 10
    };
  } catch (error) {
    console.error('postService: Error fetching posts:', error);
    return { success: false, error: error.message };
  }
};

export const getFollowingPosts = async (userId, lastVisible = null) => {
  try {
    console.log('postService: Fetching posts from followed users for:', userId);
    
    // First, get the list of users that the current user is following
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnapshot = await getDocs(followingRef);
    const followingIds = followingSnapshot.docs.map(doc => doc.id);
    
    console.log('postService: Found following users:', followingIds);
    
    if (followingIds.length === 0) {
      console.log('postService: User is not following anyone');
      return {
        success: true,
        data: [],
        lastVisible: null,
        hasMore: false
      };
    }

    // Query posts from followed users
    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      where('authorId', 'in', followingIds),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const posts = [];

    for (const doc of snapshot.docs) {
      const postData = doc.data();
      posts.push({
        id: doc.id,
        ...postData,
        createdAt: postData.createdAt?.toDate() || new Date(),
        lastActivityAt: postData.lastActivityAt?.toDate() || new Date()
      });
    }

    console.log('postService: Fetched', posts.length, 'posts from followed users');
    return {
      success: true,
      data: posts,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: !snapshot.empty && snapshot.docs.length === 10
    };
  } catch (error) {
    console.error('postService: Error fetching following posts:', error);
    return { success: false, error: error.message };
  }
};
