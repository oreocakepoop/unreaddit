import { 
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from './config';
import { createNotification } from '../services/notificationService';

export const subscribeToComments = (postId, onUpdate, onError) => {
  try {
    // Create a reference to the comments subcollection
    const commentsRef = collection(db, 'posts', postId, 'comments');
    
    // Create a query to order comments by timestamp
    const commentsQuery = query(
      commentsRef,
      orderBy('createdAt', 'desc')
    );

    // Create a real-time listener
    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Update the comment count in the post document
        const postRef = doc(db, 'posts', postId);
        updateDoc(postRef, {
          commentCount: comments.length
        });
        onUpdate(comments);
      },
      (error) => {
        console.error('Error in comments subscription:', error);
        if (onError) onError(error);
      }
    );

    // Return unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up comments subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

export const addRealtimeComment = async (postId, commentData) => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const newComment = {
      ...commentData,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(commentsRef, newComment);
    return { 
      success: true, 
      data: { 
        id: docRef.id,
        ...newComment
      }
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { error: error.message };
  }
};

export const deleteRealtimeComment = async (postId, commentId) => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    await deleteDoc(commentRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error: error.message };
  }
};

// Subscribe to new posts from followed users
export const subscribeToFollowedUsersPosts = (userId, onNewPost, onError) => {
  try {
    // Get the list of users that the current user follows
    const followingRef = collection(db, 'following', userId, 'userFollowing');
    
    // Create a real-time listener for followed users
    const unsubscribeFromFollowing = onSnapshot(
      followingRef,
      async (followingSnapshot) => {
        // Get all followed user IDs
        const followedUserIds = followingSnapshot.docs.map(doc => doc.id);
        
        if (followedUserIds.length === 0) return;

        // Subscribe to posts from followed users
        const postsRef = collection(db, 'posts');
        const postsQuery = query(
          postsRef,
          where('userId', 'in', followedUserIds),
          where('draft', '==', false),
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc')
        );

        // Create a real-time listener for posts
        const unsubscribeFromPosts = onSnapshot(
          postsQuery,
          (postsSnapshot) => {
            // Process only new posts
            postsSnapshot.docChanges().forEach(async (change) => {
              if (change.type === 'added') {
                const post = {
                  id: change.doc.id,
                  ...change.doc.data()
                };
                
                // Get the author's name
                const userRef = doc(db, 'users', post.userId);
                const userSnap = await getDoc(userRef);
                const authorName = userSnap.data()?.displayName || 'Unknown User';

                // Create a notification for the new post
                await createNotification({
                  type: 'newPost',
                  recipientId: userId,
                  senderId: post.userId,
                  senderName: authorName,
                  postId: post.id,
                  message: `${authorName} created a new post: "${post.title || 'Untitled Post'}"`
                });

                // Callback with the new post
                onNewPost(post);
              }
            });
          },
          onError
        );

        // Return cleanup function
        return () => {
          unsubscribeFromFollowing();
          if (unsubscribeFromPosts) {
            unsubscribeFromPosts();
          }
        };
      },
      onError
    );

    return unsubscribeFromFollowing;
  } catch (error) {
    console.error('Error setting up followed users posts subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};
