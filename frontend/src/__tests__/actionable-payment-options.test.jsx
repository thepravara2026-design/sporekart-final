import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PaymentPage from '../pages/PaymentPage';
import { paymentApi, walletApi } from '../api';

vi.mock('../context/CartContext', () => ({
  useCart: () => ({
    cart: { items: [], itemCount: 0, subtotalInr: 1000 },
    fetchCart: vi.fn(),
  }),
}));

vi.mock('../api', () => ({
  paymentApi: {
    getPaymentSummary: vi.fn(),
    initiatePayment: vi.fn(),
    verifyPayment: vi.fn(),
    initiateEnrollmentPayment: vi.fn(),
    verifyEnrollmentPayment: vi.fn(),
  },
  walletApi: {
    getWallet: vi.fn(),
    checkoutPay: vi.fn(),
  },
}));

vi.mock('../utils/payment', () => ({
  loadRazorpayCheckoutScript: vi.fn().mockResolvedValue(true),
  openRazorpayCheckout: vi.fn(),
}));

describe('Actionable Payment Options & Razorpay Gateway Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentApi.getPaymentSummary.mockResolvedValue({
      data: {
        success: true,
        data: {
          type: 'ORDER',
          title: 'Spawn Substrate Kit Order',
          subtitle: 'Order #ORD-2026-99',
          amountInr: 1500,
          customerName: 'Aarav Patel',
          customerEmail: 'aarav@example.com',
          customerPhone: '9876543210',
        },
      },
    });
    walletApi.getWallet.mockResolvedValue({
      data: {
        success: true,
        data: {
          availableBalance: 500,
        },
      },
    });
  });

  const renderPaymentPage = (initialEntry = '/payment?type=order&id=ord-123') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders all 4 payment channels with active selection capabilities', async () => {
    renderPaymentPage();

    await waitFor(() => {
      expect(screen.getByText(/Choose Payment Method/i)).toBeInTheDocument();
    });

    // Check all payment channels are present
    expect(screen.getByText('UPI & QR')).toBeInTheDocument();
    expect(screen.getByText('Cards')).toBeInTheDocument();
    expect(screen.getByText('Net Banking')).toBeInTheDocument();
    expect(screen.getByText('Ag-Wallet')).toBeInTheDocument();

    // Verify default active channel is UPI & QR with dynamic QR code
    expect(screen.getByText(/Instant Dynamic UPI QR/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan with GPay, PhonePe, Paytm/i)).toBeInTheDocument();
  });

  it('switches between QR, UPI Apps, and VPA entry tabs within UPI', async () => {
    renderPaymentPage();

    await waitFor(() => {
      expect(screen.getByText(/Instant Dynamic UPI QR/i)).toBeInTheDocument();
    });

    // Switch to UPI Apps
    const appsTab = screen.getByRole('button', { name: /UPI Apps/i });
    fireEvent.click(appsTab);
    expect(screen.getByText('Google Pay')).toBeInTheDocument();
    expect(screen.getByText('PhonePe')).toBeInTheDocument();
    expect(screen.getByText('Paytm UPI')).toBeInTheDocument();

    // Switch to UPI ID (VPA)
    const vpaTab = screen.getByRole('button', { name: /UPI ID \(VPA\)/i });
    fireEvent.click(vpaTab);
    expect(screen.getByPlaceholderText(/e\.g\. mobile@okhdfcbank or user@paytm/i)).toBeInTheDocument();
  });

  it('interactively activates Cards channel with test mode card credentials and fill helper', async () => {
    renderPaymentPage();

    await waitFor(() => {
      expect(screen.getByText('Cards')).toBeInTheDocument();
    });

    // Select Cards option
    const cardsOption = screen.getByText('Cards');
    fireEvent.click(cardsOption);

    // Verify test credentials helper is displayed
    expect(screen.getByText(/Razorpay Test Card Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/4111 1111 1111 1111/i)).toBeInTheDocument();

    // Click "Use Test Card" button
    const fillButton = screen.getByRole('button', { name: /Use Test Card/i });
    fireEvent.click(fillButton);

    // Card Number input should be auto-populated
    const cardInput = screen.getByPlaceholderText('4111 1111 1111 1111');
    expect(cardInput.value).toBe('4111 1111 1111 1111');
  });

  it('interactively activates Net Banking channel with top Indian banks and bank selector', async () => {
    renderPaymentPage();

    await waitFor(() => {
      expect(screen.getByText('Net Banking')).toBeInTheDocument();
    });

    // Select Net Banking option
    const netbankingOption = screen.getByText('Net Banking');
    fireEvent.click(netbankingOption);

    // Check popular Indian bank options
    expect(screen.getByText('SBI')).toBeInTheDocument();
    expect(screen.getByText('HDFC')).toBeInTheDocument();
    expect(screen.getByText('ICICI')).toBeInTheDocument();
    expect(screen.getByText('Axis')).toBeInTheDocument();

    // Click HDFC Bank
    const hdfcBankBtn = screen.getByText('HDFC');
    fireEvent.click(hdfcBankBtn);

    // Button label should reflect Net Banking
    expect(screen.getByTestId('pay-button')).toHaveTextContent(/Net Banking/i);
  });

  it('interactively applies Sporekart Wallet balance and calculates deductions', async () => {
    renderPaymentPage();

    await waitFor(() => {
      expect(screen.getByText(/Sporekart Agri-Wallet/i)).toBeInTheDocument();
    });

    // Click "Use Balance"
    const applyBalanceBtn = screen.getByRole('button', { name: /Use Balance/i });
    fireEvent.click(applyBalanceBtn);

    // Order total is ₹1,500, wallet has ₹500, remaining gateway amount is ₹1,000
    expect(screen.getByText(/Wallet Contribution:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/-₹500/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Remaining Gateway Amount:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹1,000/i)[0]).toBeInTheDocument();
  });

  it('successfully triggers payment simulation in test mode', async () => {
    paymentApi.initiatePayment.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          razorpayOrderId: 'order_test_rzp_99',
          amountInr: 1500,
          currency: 'INR',
          razorpayKeyId: 'rzp_test_Tqs0MmdXUl8FRk',
        },
      },
    });

    paymentApi.verifyPayment.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          isSuccess: true,
          message: 'Payment verified successfully',
        },
      },
    });

    renderPaymentPage();

    await waitFor(() => {
      expect(screen.getByTestId('pay-button')).toBeInTheDocument();
    });

    // Click instant dev test simulate
    const devSimulateBtn = screen.getByRole('button', { name: /Instant Simulate Gateway Success/i });
    fireEvent.click(devSimulateBtn);

    await waitFor(() => {
      expect(paymentApi.initiatePayment).toHaveBeenCalledWith('ord-123');
      expect(paymentApi.verifyPayment).toHaveBeenCalled();
    });
  });
});
