import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NotificationCenter, { resolveNotificationUrl } from '../components/NotificationCenter';
import DashboardPage from '../pages/DashboardPage';
import { notificationApi, orderApi, trainingApi, customerApi, supportApi, walletApi } from '../api';

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
  orderApi: {
    getUserOrders: vi.fn(),
    downloadInvoice: vi.fn(),
    cancelOrder: vi.fn(),
  },
  trainingApi: {
    getUserBookings: vi.fn(),
    cancelEnrollment: vi.fn(),
  },
  customerApi: {
    getAddresses: vi.fn(),
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
  supportApi: {
    getUserTickets: vi.fn(),
    getTicketById: vi.fn(),
    createTicket: vi.fn(),
    addMessage: vi.fn(),
    closeTicket: vi.fn(),
  },
  walletApi: {
    getWallet: vi.fn(),
    getTransactions: vi.fn(),
    getWithdrawals: vi.fn(),
    addMoney: vi.fn(),
    verifyAddMoney: vi.fn(),
  },
  shippingApi: {
    getShipmentByOrder: vi.fn(),
  },
}));

describe('Notification Deep-Link Navigation & Details Resolution Tests', () => {
  const customerUser = {
    id: 'cust-1',
    fullName: 'Ramesh Agro Farmer',
    email: 'ramesh@sporekart.in',
    phone: '9876543210',
    role: 'ROLE_CUSTOMER',
  };

  const sampleTicket = {
    id: 'ticket-uuid-999',
    ticketNumber: 'TKT-999',
    subject: 'Spawn Bag Contamination Query',
    category: 'ORDER_ISSUE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderType: 'CUSTOMER',
        senderName: 'Ramesh Agro Farmer',
        message: 'The oyster spawn arrived yesterday and shows green patches.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        senderType: 'SUPPORT_AGENT',
        senderName: 'Agronomist Dr. Patil',
        message: 'Please share clear photos of the filter patch. We will issue a replacement bag immediately.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const sampleOrder = {
    id: 'order-uuid-101',
    orderNumber: 'ORD-SK-101',
    status: 'PROCESSING',
    totalAmountInr: 1299,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        productTitle: 'Milky Mushroom Grain Spawn (A15)',
        variantName: '500g Commercial Spawn',
        quantity: 2,
        priceInr: 600,
        lineTotalInr: 1200,
      },
    ],
    shippingAddress: {
      recipientName: 'Ramesh Agro Farmer',
      line1: 'Farmhouse 12, Agro Hub',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      phone: '9876543210',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orderApi.getUserOrders.mockResolvedValue({ data: { success: true, data: [sampleOrder] } });
    trainingApi.getUserBookings.mockResolvedValue({ data: { success: true, data: [] } });
    customerApi.getAddresses.mockResolvedValue({ data: { success: true, data: [] } });
    supportApi.getUserTickets.mockResolvedValue({ data: { success: true, data: [sampleTicket] } });
    supportApi.getTicketById.mockResolvedValue({ data: { success: true, data: sampleTicket } });
    walletApi.getWallet.mockResolvedValue({ data: { success: true, data: { availableBalance: 1500 } } });
    walletApi.getTransactions.mockResolvedValue({ data: { success: true, data: [] } });
    walletApi.getWithdrawals.mockResolvedValue({ data: { success: true, data: [] } });
  });

  describe('resolveNotificationUrl helper', () => {
    it('correctly maps order notifications to customer activeTrack tab with orderId', () => {
      const notif = {
        category: 'ORDER',
        entityType: 'ORDER',
        entityId: 'ord-abc-123',
      };
      expect(resolveNotificationUrl(notif, false)).toBe('/dashboard?tab=activeTrack&orderId=ord-abc-123');
    });

    it('correctly maps support ticket notifications to customer support tab with ticketId', () => {
      const notif = {
        category: 'SUPPORT',
        entityType: 'SUPPORT_TICKET',
        entityId: 'ticket-xyz-789',
      };
      expect(resolveNotificationUrl(notif, false)).toBe('/dashboard?tab=support&ticketId=ticket-xyz-789');
    });

    it('correctly maps training masterclass notifications to customer trainings tab with bookingId', () => {
      const notif = {
        category: 'TRAINING',
        entityType: 'TRAINING_BOOKING',
        entityId: 'booking-555',
      };
      expect(resolveNotificationUrl(notif, false)).toBe('/dashboard?tab=trainings&bookingId=booking-555');
    });

    it('correctly maps order notifications to admin portal with orderId', () => {
      const notif = {
        category: 'ORDER',
        entityType: 'ORDER',
        entityId: 'ord-admin-1',
      };
      expect(resolveNotificationUrl(notif, true)).toBe('/admin/orders?orderId=ord-admin-1');
    });

    it('correctly maps support notifications to admin portal with ticketId', () => {
      const notif = {
        category: 'SUPPORT',
        entityType: 'SUPPORT_TICKET',
        entityId: 'ticket-admin-2',
      };
      expect(resolveNotificationUrl(notif, true)).toBe('/admin/support?ticketId=ticket-admin-2');
    });
  });

  describe('Customer Dashboard Deep-Link Auto-Opening', () => {
    it('automatically opens ticket message thread drawer when deep-linked with ticketId', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard?tab=support&ticketId=ticket-uuid-999']}>
          <DashboardPage user={customerUser} />
        </MemoryRouter>
      );

      // Verify support tab is selected and ticket details drawer opens
      await waitFor(() => {
        expect(screen.getAllByText('Spawn Bag Contamination Query').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Dr. Patil', { exact: false })).toBeInTheDocument();
        expect(screen.getByText(/green patches/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Type your reply to customer care/i)).toBeInTheDocument();
      });
    });

    it('displays "Targeted from Notification" badge on deep-linked order card', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard?tab=activeTrack&orderId=order-uuid-101']}>
          <DashboardPage user={customerUser} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ORD-SK-101')).toBeInTheDocument();
        expect(screen.getByText('🎯 Targeted from Notification')).toBeInTheDocument();
        expect(screen.getByText('Milky Mushroom Grain Spawn (A15)', { exact: false })).toBeInTheDocument();
      });
    });
  });
});
