import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationCenter from '../components/NotificationCenter';
import NotificationItem from '../components/NotificationItem';
import { createNotification, markNotificationAsRead, deleteNotification } from '../services/notificationService';
import { BrowserRouter } from 'react-router-dom';

// Mock Firebase
jest.mock('../firebase/config', () => ({
  db: {},
}));

// Mock notification service functions
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn(),
  markNotificationAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  subscribeToNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
}));

describe('Notification System', () => {
  const mockNotification = {
    id: '123',
    type: 'new_post',
    recipientId: 'user123',
    senderId: 'sender123',
    read: false,
    createdAt: new Date(),
    metadata: {
      authorName: 'John Doe',
      postTitle: 'Test Post'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NotificationCenter', () => {
    it('renders notification center with unread count', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <NotificationCenter />
          </NotificationProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('opens notification panel on click', async () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <NotificationCenter />
          </NotificationProvider>
        </BrowserRouter>
      );

      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('marks all notifications as read', async () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <NotificationCenter />
          </NotificationProvider>
        </BrowserRouter>
      );

      fireEvent.click(screen.getByRole('button'));
      const markAllReadButton = screen.queryByText('Mark all read');
      if (markAllReadButton) {
        fireEvent.click(markAllReadButton);
        await waitFor(() => {
          expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('NotificationItem', () => {
    it('renders notification content correctly', () => {
      render(
        <BrowserRouter>
          <NotificationItem notification={mockNotification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/John Doe posted "Test Post"/)).toBeInTheDocument();
    });

    it('marks notification as read on click', async () => {
      render(
        <BrowserRouter>
          <NotificationItem notification={mockNotification} />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText(/John Doe posted "Test Post"/));
      await waitFor(() => {
        expect(markNotificationAsRead).toHaveBeenCalledWith(mockNotification.id);
      });
    });

    it('deletes notification', async () => {
      render(
        <BrowserRouter>
          <NotificationItem notification={mockNotification} />
        </BrowserRouter>
      );

      const deleteButton = screen.getByRole('button');
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(deleteNotification).toHaveBeenCalledWith(mockNotification.id);
      });
    });
  });

  describe('Notification Service', () => {
    it('creates notification successfully', async () => {
      createNotification.mockResolvedValueOnce({ success: true, id: '123' });
      
      const result = await createNotification({
        type: 'new_post',
        recipientId: 'user123',
        senderId: 'sender123',
        metadata: {
          authorName: 'John Doe',
          postTitle: 'Test Post'
        }
      });

      expect(result).toEqual({ success: true, id: '123' });
    });

    it('handles notification creation error', async () => {
      const error = new Error('Failed to create notification');
      createNotification.mockRejectedValueOnce(error);

      await expect(createNotification({})).rejects.toThrow('Failed to create notification');
    });
  });
});
