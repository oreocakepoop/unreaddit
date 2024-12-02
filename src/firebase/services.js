import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../services/notificationService';

// User Services
const createUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        ...data,
        followers: [],
        following: [],
        postCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { error: error.message };
  }
};

const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { error: error.message };
  }
};

const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { data: { id: userSnap.id, ...userSnap.data() } };
    }
    return { error: 'User not found' };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { error: error.message };
  }
};

const followUser = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId)
    });

    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { error: error.message };
  }
};

const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId)
    });

    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { error: error.message };
  }
};

// Post Services
const addPost = async (postData) => {
  try {
    const { 
      userId, 
      title, 
      content, 
      imageUrl = '', 
      media = [], 
      tags = [], 
      visibility = 'public', 
      draft = false, 
      nsfw = false 
    } = postData;

    // Get user data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data();

    const newPost = {
      userId,
      title: title.trim(),
      content: content.trim(),
      imageUrl,
      media,
      tags: tags.map(tag => tag.toLowerCase().trim()),
      visibility,
      draft,
      nsfw,
      authorName: userData.displayName || 'Anonymous User',
      authorEmail: userData.email,
      likes: [],
      comments: [],
      commentCount: 0,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp()
    };

    // Add post to Firestore
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, newPost);

    // Update user's post count
    await updateDoc(userRef, {
      postCount: increment(1)
    });

    return {
      success: true,
      data: {
        id: docRef.id,
        ...newPost
      }
    };
  } catch (error) {
    console.error('Error adding post:', error);
    return { error: error.message };
  }
};

const deletePost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const userRef = doc(db, 'users', userId);
    
    // Use a batch to update both post and user's postCount atomically
    const batch = writeBatch(db);
    
    // Delete the post
    batch.delete(postRef);
    
    // Decrement the user's postCount
    batch.update(userRef, {
      postCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    // Commit the batch
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { error: error.message };
  }
};

const getPosts = async (userId = null, lastVisible = null, postsLimit = 10) => {
  try {
    let postsQuery = collection(db, 'posts');
    let constraints = [];
    
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (lastVisible) {
      constraints.push(startAfter(lastVisible.createdAt));
    }
    
    constraints.push(limit(postsLimit));
    
    const q = query(postsQuery, ...constraints);
    const snapshot = await getDocs(q);
    const posts = [];
    
    snapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      });
    });
    
    return {
      success: true,
      data: posts,
      hasMore: posts.length === postsLimit
    };
  } catch (error) {
    console.error('Error getting posts:', error);
    return { error: error.message };
  }
};

const likePost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const postData = postDoc.data();
    await updateDoc(postRef, {
      likes: arrayUnion(userId)
    });

    // Get the user who liked the post
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Create notification for post author
    if (postData.userId !== userId) {  // Don't notify if user likes their own post
      await createNotification({
        type: 'like',
        recipientId: postData.userId,
        senderId: userId,
        senderName: userData?.displayName || 'Anonymous',
        postId,
        message: `${userData?.displayName || 'Anonymous'} liked your post: "${postData.title || 'Untitled Post'}"`
      });
    }

    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

const unlikePost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayRemove(userId)
    });
    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

const getUserPosts = async (userId, lastPost = null, postsPerPage = 5) => {
  try {
    let constraints = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ];

    if (lastPost) {
      constraints.push(startAfter(lastPost.createdAt));
    }

    constraints.push(limit(postsPerPage));

    const postsQuery = query(
      collection(db, 'posts'),
      ...constraints
    );

    const postsSnap = await getDocs(postsQuery);
    const posts = [];
    
    postsSnap.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastActivityAt: data.lastActivityAt?.toDate?.() || new Date()
      });
    });

    return { 
      success: true,
      data: posts,
      hasMore: posts.length === postsPerPage,
      lastVisible: posts[posts.length - 1]
    };
  } catch (error) {
    console.error('Error getting user posts:', error);
    return { error: error.message };
  }
};

const getAllPosts = async (lastPost = null, postsPerPage = 5) => {
  try {
    let constraints = [
      orderBy('createdAt', 'desc')
    ];

    if (lastPost) {
      constraints.push(startAfter(lastPost.createdAt));
    }

    constraints.push(limit(postsPerPage));

    const postsQuery = query(
      collection(db, 'posts'),
      ...constraints
    );

    const postsSnap = await getDocs(postsQuery);
    const posts = [];
    
    // Get all unique author IDs from posts
    const authorIds = new Set();
    postsSnap.forEach(doc => {
      const data = doc.data();
      if (data.authorId) {
        authorIds.add(data.authorId);
      }
    });

    // Get latest user data for all authors
    const authorData = {};
    await Promise.all(
      Array.from(authorIds).map(async (authorId) => {
        const userDoc = await getDoc(doc(db, 'users', authorId));
        if (userDoc.exists()) {
          authorData[authorId] = userDoc.data();
        }
      })
    );
    
    postsSnap.forEach((doc) => {
      const data = doc.data();
      const author = authorData[data.authorId] || {};
      
      posts.push({
        id: doc.id,
        ...data,
        // Use latest author data if available
        authorEmail: author.email || data.authorEmail,
        authorDisplayName: author.displayName || data.authorDisplayName,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastActivityAt: data.lastActivityAt?.toDate?.() || new Date()
      });
    });

    return { 
      success: true,
      data: posts,
      hasMore: posts.length === postsPerPage,
      lastVisible: posts[posts.length - 1]
    };
  } catch (error) {
    console.error('Error getting all posts:', error);
    return { error: error.message };
  }
};

// Comment Services
const extractMentions = (text) => {
  const mentions = text.match(/@\w+/g);
  return mentions ? mentions.map(mention => mention.substring(1)) : [];
};

const addComment = async (postId, commentData) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const postData = postDoc.data();

    // Create a new comment with the current timestamp
    const newComment = {
      ...commentData,
      id: uuidv4(),
      createdAt: new Date()
    };

    // First, add the comment using arrayUnion
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
      commentCount: increment(1)
    });

    // Then, update the lastActivityAt separately
    await updateDoc(postRef, {
      lastActivityAt: serverTimestamp()
    });

    // Get the user who made the comment
    const userRef = doc(db, 'users', commentData.userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Create notification for post author if it's not their own comment
    if (postData.userId !== commentData.userId) {
      await createNotification({
        type: 'comment',
        recipientId: postData.userId,
        senderId: commentData.userId,
        senderName: userData?.displayName || 'Anonymous',
        postId,
        message: `${userData?.displayName || 'Anonymous'} commented on your post: "${postData.title || 'Untitled Post'}"`
      });
    }

    // Handle mentions in the comment
    const mentions = extractMentions(commentData.content);
    if (mentions.length > 0) {
      // Get all users by their usernames
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', 'in', mentions));
      const mentionedUsersSnapshot = await getDocs(q);

      // Create notifications for mentioned users
      const notifications = mentionedUsersSnapshot.docs.map(doc => {
        const mentionedUser = doc.data();
        // Don't notify if the mentioned user is the commenter
        if (mentionedUser.uid === commentData.userId) return null;

        return createNotification({
          type: 'mention',
          recipientId: mentionedUser.uid,
          senderId: commentData.userId,
          senderName: userData?.displayName || 'Anonymous',
          postId,
          message: `${userData?.displayName || 'Anonymous'} mentioned you in a comment: "${commentData.content.substring(0, 50)}${commentData.content.length > 50 ? '...' : ''}"`
        });
      });

      // Wait for all notifications to be created
      await Promise.all(notifications.filter(Boolean));
    }

    return {
      success: true,
      data: newComment
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { error: error.message };
  }
};

const deleteComment = async (postId, commentId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const comments = postDoc.data().comments || [];
    const commentToDelete = comments.find(c => c.id === commentId);

    if (!commentToDelete) {
      throw new Error('Comment not found');
    }

    // Remove comment and decrement comment count
    await updateDoc(postRef, {
      comments: arrayRemove(commentToDelete),
      commentCount: increment(-1),
      lastActivityAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error: error.message };
  }
};

// Like Services
const toggleLike = async (postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const post = postDoc.data();
    const isLiked = post.likes.includes(userId);

    await updateDoc(postRef, {
      likes: isLiked 
        ? arrayRemove(userId)
        : arrayUnion(userId)
    });

    return { success: true, liked: !isLiked };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { error: error.message };
  }
};

// Export all functions
export {
  createUserProfile,
  updateUserProfile,
  getUserProfile,
  followUser,
  unfollowUser,
  addPost,
  deletePost,
  getPosts,
  likePost,
  unlikePost,
  getUserPosts,
  getAllPosts,
  addComment,
  deleteComment,
  toggleLike
};
