import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  followUser, 
  unfollowUser, 
  isFollowing, 
  getFollowers, 
  getFollowing 
} from '../services/followService';

// Mock Firebase
vi.mock('../firebase/config', () => {
  const mockDoc = vi.fn();
  const mockCollection = vi.fn();
  const mockGetDoc = vi.fn();
  const mockSetDoc = vi.fn();
  const mockDeleteDoc = vi.fn();
  const mockQuery = vi.fn();
  const mockWhere = vi.fn();
  const mockGetDocs = vi.fn();
  const mockWriteBatch = vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn()
  }));

  return {
    db: {
      doc: mockDoc,
      collection: mockCollection,
      writeBatch: mockWriteBatch
    },
    doc: mockDoc,
    collection: mockCollection,
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
    deleteDoc: mockDeleteDoc,
    query: mockQuery,
    where: mockWhere,
    getDocs: mockGetDocs,
    writeBatch: mockWriteBatch,
    serverTimestamp: () => new Date(),
    increment: (num) => num
  };
});

describe('Follow System Tests', () => {
  const mockCurrentUser = {
    uid: 'user1',
    displayName: 'Test User 1'
  };

  const mockTargetUser = {
    uid: 'user2',
    displayName: 'Test User 2'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('followUser Function', () => {
    it('should successfully follow a user', async () => {
      const { getDoc } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({ exists: () => false });

      const result = await followUser(mockCurrentUser.uid, mockTargetUser.uid);
      expect(result).toEqual({ success: true });
    });

    it('should throw error when trying to follow self', async () => {
      await expect(
        followUser(mockCurrentUser.uid, mockCurrentUser.uid)
      ).rejects.toThrow('Invalid user IDs');
    });

    it('should throw error when already following', async () => {
      const { getDoc } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({ exists: () => true });

      await expect(
        followUser(mockCurrentUser.uid, mockTargetUser.uid)
      ).rejects.toThrow('Already following this user');
    });
  });

  describe('unfollowUser Function', () => {
    it('should successfully unfollow a user', async () => {
      const { getDoc } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({ exists: () => true });

      const result = await unfollowUser(mockCurrentUser.uid, mockTargetUser.uid);
      expect(result).toEqual({ success: true });
    });

    it('should throw error when trying to unfollow non-followed user', async () => {
      const { getDoc } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({ exists: () => false });

      await expect(
        unfollowUser(mockCurrentUser.uid, mockTargetUser.uid)
      ).rejects.toThrow('Not following this user');
    });
  });

  describe('isFollowing Function', () => {
    it('should return true when following', async () => {
      const { getDoc } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({ exists: () => true });

      const result = await isFollowing(mockCurrentUser.uid, mockTargetUser.uid);
      expect(result).toBe(true);
    });

    it('should return false when not following', async () => {
      const { getDoc } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({ exists: () => false });

      const result = await isFollowing(mockCurrentUser.uid, mockTargetUser.uid);
      expect(result).toBe(false);
    });
  });

  describe('getFollowers Function', () => {
    it('should return list of followers', async () => {
      const { getDocs } = await import('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ followerId: 'user3' }) },
          { data: () => ({ followerId: 'user4' }) }
        ]
      });

      const followers = await getFollowers(mockCurrentUser.uid);
      expect(followers).toEqual(['user3', 'user4']);
    });
  });

  describe('getFollowing Function', () => {
    it('should return list of following users', async () => {
      const { getDocs } = await import('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ followingId: 'user5' }) },
          { data: () => ({ followingId: 'user6' }) }
        ]
      });

      const following = await getFollowing(mockCurrentUser.uid);
      expect(following).toEqual(['user5', 'user6']);
    });
  });
});

// FollowButton Component Tests
import { render, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FollowButton from '../components/FollowButton';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'user1' }
  })
}));

describe('FollowButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render follow button when not following', async () => {
    const { getByText } = render(
      <FollowButton targetUserId="user2" />
    );

    await waitFor(() => {
      expect(getByText('Follow')).toBeInTheDocument();
    });
  });

  it('should render following button when following', async () => {
    vi.mock('../services/followService', () => ({
      isFollowing: () => Promise.resolve(true)
    }));

    const { getByText } = render(
      <FollowButton targetUserId="user2" />
    );

    await waitFor(() => {
      expect(getByText('Following')).toBeInTheDocument();
    });
  });

  it('should handle follow action', async () => {
    const mockFollowUser = vi.fn(() => Promise.resolve({ success: true }));
    vi.mock('../services/followService', () => ({
      isFollowing: () => Promise.resolve(false),
      followUser: mockFollowUser
    }));

    const { getByText } = render(
      <FollowButton targetUserId="user2" />
    );

    await waitFor(() => {
      fireEvent.click(getByText('Follow'));
    });

    expect(mockFollowUser).toHaveBeenCalledWith('user1', 'user2');
  });

  it('should not render when viewing own profile', () => {
    const { container } = render(
      <FollowButton targetUserId="user1" />
    );

    expect(container.firstChild).toBeNull();
  });
});
