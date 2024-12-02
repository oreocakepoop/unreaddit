import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from './config';

const POSTS_PER_PAGE = 10;

export const getExplorePosts = async (sortBy = 'trending', lastVisible = null) => {
  try {
    let q;
    const constraints = [];

    // Add sorting constraints based on category
    switch (sortBy) {
      case 'trending':
        constraints.push(
          where('draft', '==', false),
          where('visibility', '==', 'public'),
          orderBy('stats.likes', 'desc'),
          orderBy('lastActivityAt', 'desc'),
          orderBy('__name__', 'desc')
        );
        if (lastVisible) {
          constraints.push(startAfter(
            lastVisible.stats.likes,
            lastVisible.lastActivityAt,
            lastVisible.id
          ));
        }
        break;
      case 'discussed':
        constraints.push(
          where('draft', '==', false),
          where('visibility', '==', 'public'),
          orderBy('commentCount', 'desc'),
          orderBy('__name__', 'desc')
        );
        if (lastVisible) {
          constraints.push(startAfter(
            lastVisible.commentCount,
            lastVisible.id
          ));
        }
        break;
      case 'featured':
        constraints.push(
          where('draft', '==', false),
          where('visibility', '==', 'public'),
          where('featured', '==', true),
          orderBy('lastActivityAt', 'desc'),
          orderBy('__name__', 'desc')
        );
        if (lastVisible) {
          constraints.push(startAfter(
            lastVisible.lastActivityAt,
            lastVisible.id
          ));
        }
        break;
      case 'latest':
      default:
        constraints.push(
          where('draft', '==', false),
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          orderBy('__name__', 'desc')
        );
        if (lastVisible) {
          constraints.push(startAfter(
            lastVisible.createdAt,
            lastVisible.id
          ));
        }
    }

    constraints.push(limit(POSTS_PER_PAGE));

    // Create and execute query
    q = query(collection(db, 'posts'), ...constraints);
    const snapshot = await getDocs(q);
    const posts = [];

    snapshot.forEach((doc) => {
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
      lastVisible: posts[posts.length - 1],
      hasMore: posts.length === POSTS_PER_PAGE
    };
  } catch (error) {
    console.error('Error getting explore posts:', error);
    return { success: false, error: error.message };
  }
};
