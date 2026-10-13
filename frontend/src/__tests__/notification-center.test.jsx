import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NotificationCenter from '../components/NotificationCenter';
import { notificationApi, adminNotificationApi } from '../api';

vi.mock('../api', () => ({
  notificationApi: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
  adminNotificationApi: {
    getInAppNotifications: vi.fn(),
    getInAppUnreadCount: vi.fn(),
    markInAppAsRead: vi.fn(),
    markInAppAllAsRead: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotificationCenter Frontend Component Tests', () => {
  const customerUser = {
    id: 'user-c-1',
    fullName: 'Praveen Customer',
    role: 'ROLE_CUSTOMER',
  };

  const adminUser = {
    id: 'admin-1',
    fullName: 'Sporekart Administrator',
    role: 'ROLE_ADMIN',
  };

  const sampleNotifications = [
    {
      id: 'notif-1',
      category: 'ORDER',
      title: 'Order #101 Confirmed',
      message: 'Your mushroom spawn order has been confirmed.',
      isRead: false,
      actionUrl: '/orders/101',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      category: 'SHIPMENT',
      title: 'Package Dispatched',
      message: 'Tracking #DTDC123456 is on the way.',
      isRead: true,
      actionUrl: '/orders/101/track',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    notificationApi.getUnreadCount.mockResolvedValue({ data: { unreadCount: 1 } });
    notificationApi.getNotifications.mockResolvedValue({
      data: { content: sampleNotifications },
    });
    notificationApi.markAsRead.mockResolvedValue({ data: { id: 'notif-1', isRead: true } });
    notificationApi.markAllAsRead.mockResolvedValue({ data: { markedCount: 1 } });

    adminNotificationApi.getInAppUnreadCount.mockResolvedValue({ data: { unreadCount: 3 } });
    adminNotificationApi.getInAppNotifications.mockResolvedValue({
      data: {
        content: [
          {
            id: 'admin-notif-1',
            category: 'ORDER',
            title: 'New Order Placed: #102',
            message: 'Customer Praveen placed order #102 for ₹1,500',
            isRead: false,
            actionUrl: '/admin/orders',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    adminNotificationApi.markInAppAsRead.mockResolvedValue({ data: { id: 'admin-notif-1', isRead: true } });
    adminNotificationApi.markInAppAllAsRead.mockResolvedValue({ data: { markedCount: 3 } });
  });

  it('renders bell button and badge with accurate unread count', async () => {
    render(
      <BrowserRouter>
        <NotificationCenter user={customerUser} />
      </BrowserRouter>
    );

    const bellBtn = screen.getByTestId('notification-bell-btn');
    expect(bellBtn).toBeInTheDocument();

    await waitFor(() => {
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('1');
    });
  });

  it('opens notification panel on bell click and displays notifications feed', async () => {
    render(
      <BrowserRouter>
        <NotificationCenter user={customerUser} />
      </BrowserRouter>
    );

    const bellBtn = screen.getByTestId('notification-bell-btn');
    fireEvent.click(bellBtn);

    const panel = await screen.findByTestId('notification-panel');
    expect(panel).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Order #101 Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Package Dispatched')).toBeInTheDocument();
    });
  });

  it('marks individual notification as read and navigates to actionUrl on card click', async () => {
    render(
      <BrowserRouter>
        <NotificationCenter user={customerUser} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('notification-bell-btn'));
    await screen.findByTestId('notification-panel');

    const item = await screen.findByTestId('notification-item-notif-1');
    fireEvent.click(item);

    expect(notificationApi.markAsRead).toHaveBeenCalledWith('notif-1');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard?tab=activeTrack&orderId=101');
  });

  it('clicking "View details" button navigates directly to the specific notification details', async () => {
    notificationApi.getNotifications.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 'ticket-notif-99',
            category: 'SUPPORT',
            entityType: 'SUPPORT_TICKET',
            entityId: 'ticket-uuid-777',
            title: 'Support Ticket #TKT-888 Replied',
            message: 'Our agronomist agent responded to your query.',
            isRead: false,
            actionUrl: '/dashboard?tab=support&ticketId=ticket-uuid-777',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <NotificationCenter user={customerUser} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('notification-bell-btn'));
    await screen.findByTestId('notification-panel');

    const viewDetailsBtn = await screen.findByTestId('notification-view-details-btn-ticket-notif-99');
    expect(viewDetailsBtn).toBeInTheDocument();
    fireEvent.click(viewDetailsBtn);

    expect(notificationApi.markAsRead).toHaveBeenCalledWith('ticket-notif-99');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard?tab=support&ticketId=ticket-uuid-777');
  });

  it('marks all notifications as read when "Mark all read" is clicked', async () => {
    render(
      <BrowserRouter>
        <NotificationCenter user={customerUser} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('notification-bell-btn'));
    await screen.findByTestId('notification-panel');

    const markAllBtn = await screen.findByTestId('mark-all-read-btn');
    fireEvent.click(markAllBtn);

    expect(notificationApi.markAllAsRead).toHaveBeenCalled();
  });

  it('uses admin endpoints when authenticated user is ROLE_ADMIN', async () => {
    render(
      <BrowserRouter>
        <NotificationCenter user={adminUser} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(adminNotificationApi.getInAppUnreadCount).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByTestId('notification-bell-btn'));
    await screen.findByTestId('notification-panel');

    expect(screen.getByText('Operational Alerts')).toBeInTheDocument();
    await waitFor(() => {
      expect(adminNotificationApi.getInAppNotifications).toHaveBeenCalled();
      expect(screen.getByText('New Order Placed: #102')).toBeInTheDocument();
    });
  });

  it('handles empty state when no notifications are returned', async () => {
    notificationApi.getNotifications.mockResolvedValueOnce({
      data: { content: [] },
    });
    notificationApi.getUnreadCount.mockResolvedValueOnce({
      data: { unreadCount: 0 },
    });

    render(
      <BrowserRouter>
        <NotificationCenter user={customerUser} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('notification-bell-btn'));
    await screen.findByTestId('notification-panel');

    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('correctly handles Spring Boot ApiResponse wrapped responses (res.data.data)', async () => {
    notificationApi.getUnreadCount.mockResolvedValueOnce({
      data: {
        success: true,
        data: { unreadCount: 5 },
      },
    });
    notificationApi.getNotifications.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          content: [
            {
              id: 'wrapped-1',
              category: 'SHIPPING',
              title: 'Order Dispatched via Bluedart',
              message: 'Your tracking number is BD999888',
              isRead: false,
              actionUrl: '/orders/track',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
    });

    render(
      <BrowserRouter>
        <NotificationCenter user={customerUser} />
      </BrowserRouter>
    );

    await waitFor(() => {
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('5');
    });

    fireEvent.click(screen.getByTestId('notification-bell-btn'));
    await screen.findByTestId('notification-panel');

    await waitFor(() => {
      expect(screen.getByText('Order Dispatched via Bluedart')).toBeInTheDocument();
      expect(screen.getByText('Shipping')).toBeInTheDocument();
    });
  });
});
