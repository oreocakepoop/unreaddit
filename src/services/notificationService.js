import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Create a notification
export const createNotification = async ({ type, recipientId, senderId, senderName, postId = null, message = null }) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const notification = {
      type,
      recipientId,
      senderId,
      senderName,
      postId,
      message: message || generateDefaultMessage(type, senderName),
      read: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(notificationsRef, notification);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to generate default notification messages
const generateDefaultMessage = (type, senderName) => {
  switch (type) {
    case 'follow':
      return `${senderName} started following you`;
    case 'like':
      return `${senderName} liked your post`;
    case 'comment':
      return `${senderName} commented on your post`;
    case 'newPost':
      return `${senderName} created a new post`;
    case 'mention':
      return `${senderName} mentioned you in a comment`;
    default:
      return `New notification from ${senderName}`;
  }
};

// Get user notifications
export const getUserNotifications = async (userId) => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Subscribe to notifications
export const subscribeToNotifications = (userId, callback, errorCallback) => {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    },
    errorCallback
  );
};

// Get unread notifications count
export const getUnreadCount = async (userId) => {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(unreadQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(notificationsQuery);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Mark multiple notifications as read
export const markMultipleAsRead = async (notificationIds) => {
  try {
    const batch = writeBatch(db);
    
    notificationIds.forEach(id => {
      const notificationRef = doc(db, 'notifications', id);
      batch.update(notificationRef, { read: true });
    });

    await batch.commit();
    return { success: true, count: notificationIds.length };
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};
