import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RazorpayCheckoutButton from '../components/RazorpayCheckoutButton';
import { razorpayApi } from '../api';

vi.mock('../api', () => ({
  razorpayApi: {
    createOrder: vi.fn(),
    verifyPayment: vi.fn(),
  },
}));

describe('Razorpay Standard Web Checkout Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Razorpay checkout button with correct amount and text', () => {
    render(
      <RazorpayCheckoutButton
        amount={750}
        buttonText="Pay ₹750 Now"
      />
    );

    const button = screen.getByTestId('razorpay-checkout-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Pay ₹750 Now');
  });

  it('calls create-order and opens Razorpay modal on button click', async () => {
    let modalInstance = null;
    window.Razorpay = vi.fn().mockImplementation(function (options) {
      modalInstance = {
        options,
        open: vi.fn(),
        on: vi.fn(),
      };
      return modalInstance;
    });

    razorpayApi.createOrder.mockResolvedValueOnce({
      data: {
        order_id: 'order_test_99999',
        amount: 75000,
        currency: 'INR',
        key_id: 'rzp_test_Tqs0MmdXUl8FRk',
        status: 'created',
      },
    });

    render(
      <RazorpayCheckoutButton
        amount={750}
        buttonText="Pay ₹750"
      />
    );

    const button = screen.getByTestId('razorpay-checkout-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(razorpayApi.createOrder).toHaveBeenCalledWith(75000, 'INR', null, null);
    });

    await waitFor(() => {
      expect(window.Razorpay).toHaveBeenCalled();
      expect(modalInstance.open).toHaveBeenCalled();
      expect(modalInstance.options.order_id).toBe('order_test_99999');
    });
  });

  it('handles payment success and verifies payment signature', async () => {
    let capturedOptions = null;
    window.Razorpay = vi.fn().mockImplementation(function (options) {
      capturedOptions = options;
      return {
        open: vi.fn(),
        on: vi.fn(),
      };
    });

    razorpayApi.createOrder.mockResolvedValueOnce({
      data: {
        order_id: 'order_test_123',
        amount: 50000,
        currency: 'INR',
        key_id: 'rzp_test_Tqs0MmdXUl8FRk',
      },
    });

    razorpayApi.verifyPayment.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'Payment verified successfully',
        verified: true,
        order_id: 'order_test_123',
        payment_id: 'pay_test_456',
      },
    });

    const onSuccess = vi.fn();

    render(
      <RazorpayCheckoutButton
        amount={500}
        onSuccess={onSuccess}
      />
    );

    const button = screen.getByTestId('razorpay-checkout-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(capturedOptions).not.toBeNull();
    });

    // Simulate gateway success callback
    await capturedOptions.handler({
      razorpay_order_id: 'order_test_123',
      razorpay_payment_id: 'pay_test_456',
      razorpay_signature: 'valid_signature_abc',
    });

    await waitFor(() => {
      expect(razorpayApi.verifyPayment).toHaveBeenCalledWith(
        'order_test_123',
        'pay_test_456',
        'valid_signature_abc',
        null
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(screen.getByText(/Payment verified successfully/i)).toBeInTheDocument();
  });

  it('handles user cancelling / dismissing the Razorpay modal', async () => {
    let capturedOptions = null;
    window.Razorpay = vi.fn().mockImplementation(function (options) {
      capturedOptions = options;
      return {
        open: vi.fn(),
        on: vi.fn(),
      };
    });

    razorpayApi.createOrder.mockResolvedValueOnce({
      data: {
        order_id: 'order_dismiss_test',
        amount: 10000,
        currency: 'INR',
        key_id: 'rzp_test_Tqs0MmdXUl8FRk',
      },
    });

    const onDismiss = vi.fn();

    render(
      <RazorpayCheckoutButton
        amount={100}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByTestId('razorpay-checkout-button'));

    await waitFor(() => {
      expect(capturedOptions).not.toBeNull();
    });

    // Simulate user modal dismissal
    capturedOptions.modal.ondismiss();

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
      expect(screen.getByText(/Payment cancelled by user/i)).toBeInTheDocument();
    });
  });

  it('handles payment.failed event and displays error message to user', async () => {
    let capturedOptions = null;
    let failHandler = null;

    window.Razorpay = vi.fn().mockImplementation(function (options) {
      capturedOptions = options;
      return {
        open: vi.fn(),
        on: vi.fn((event, cb) => {
          if (event === 'payment.failed') {
            failHandler = cb;
          }
        }),
      };
    });

    razorpayApi.createOrder.mockResolvedValueOnce({
      data: {
        order_id: 'order_fail_test',
        amount: 20000,
        currency: 'INR',
        key_id: 'rzp_test_Tqs0MmdXUl8FRk',
      },
    });

    const onError = vi.fn();

    render(
      <RazorpayCheckoutButton
        amount={200}
        onError={onError}
      />
    );

    fireEvent.click(screen.getByTestId('razorpay-checkout-button'));

    await waitFor(() => {
      expect(failHandler).not.toBeNull();
    });

    // Simulate payment.failed event from Razorpay gateway
    failHandler({
      error: {
        description: 'Bank servers unreachable. Transaction declined.',
        code: 'BAD_REQUEST_ERROR',
      },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      expect(screen.getByText(/Bank servers unreachable/i)).toBeInTheDocument();
    });
  });
});
