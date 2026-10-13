import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import Navbar from '../components/Navbar';
import DashboardPage from '../pages/DashboardPage';
import { CartProvider } from '../context/CartContext';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('../api', () => ({
  authApi: { getCurrentUser: vi.fn(), loginWithGoogle: vi.fn() },
  cartApi: { getCart: vi.fn().mockResolvedValue({ data: { success: true, data: { items: [], totalAmount: 0 } } }) },
  customerApi: { getAddresses: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }) },
  orderApi: { getUserOrders: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }) },
  trainingApi: { getUserBookings: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }) },
  supportApi: { getUserTickets: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }) },
  walletApi: {
    getWallet: vi.fn().mockResolvedValue({ data: { success: true, data: { availableBalance: 0 } } }),
    getTransactions: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getWithdrawals: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  },
  shippingApi: { getShipmentByOrder: vi.fn().mockResolvedValue({ data: { success: true, data: null } }) },
}));

describe('Admin Security & Single Permissible Entity Enforcement', () => {
  it('ADMIN-SEC-01: AdminProtectedRoute grants access ONLY to thepravara2026@gmail.com with ROLE_ADMIN', () => {
    const authorizedAdmin = {
      email: 'thepravara2026@gmail.com',
      role: 'ROLE_ADMIN',
      fullName: 'Sporekart Administrator',
    };

    render(
      <HelmetProvider>
        <AdminProtectedRoute user={authorizedAdmin}>
          <div data-testid="admin-content">Secret Admin Console</div>
        </AdminProtectedRoute>
      </HelmetProvider>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  it('ADMIN-SEC-02: AdminProtectedRoute rejects any other user even with ROLE_ADMIN claim', () => {
    const impostorAdmin = {
      email: 'otheradmin@gmail.com',
      role: 'ROLE_ADMIN',
      fullName: 'Impostor Admin',
    };

    render(
      <HelmetProvider>
        <AdminProtectedRoute user={impostorAdmin}>
          <div data-testid="admin-content">Secret Admin Console</div>
        </AdminProtectedRoute>
      </HelmetProvider>
    );

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.getByText(/403 — Unauthorized Administrative Access/i)).toBeInTheDocument();
    expect(screen.getByText(/thepravara2026@gmail.com/i)).toBeInTheDocument();
  });

  it('ADMIN-SEC-03: DashboardPage blocks admin account and displays dedicated admin boundary screen', () => {
    const adminUser = {
      email: 'thepravara2026@gmail.com',
      role: 'ROLE_ADMIN',
      fullName: 'Sporekart Administrator',
    };

    render(
      <HelmetProvider>
        <BrowserRouter>
          <DashboardPage user={adminUser} setUser={vi.fn()} />
        </BrowserRouter>
      </HelmetProvider>
    );

    expect(screen.getByText(/Dedicated Admin Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Admin Console/i)).toBeInTheDocument();
    expect(screen.queryByText(/Customer & Trainee Portal/i)).not.toBeInTheDocument();
  });

  it('ADMIN-SEC-04: Navbar directs admin user directly to Admin Console and hides customer dashboard', () => {
    const adminUser = {
      email: 'thepravara2026@gmail.com',
      role: 'ROLE_ADMIN',
      fullName: 'Sporekart Administrator',
    };

    render(
      <HelmetProvider>
        <CartProvider>
          <BrowserRouter>
            <Navbar user={adminUser} setUser={vi.fn()} />
          </BrowserRouter>
        </CartProvider>
      </HelmetProvider>
    );

    expect(screen.getByText(/Admin Console/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('User Account Dashboard')).not.toBeInTheDocument();
  });
});
