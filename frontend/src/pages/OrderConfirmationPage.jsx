import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, PackageCheck, Download, Truck, MapPin, 
  Calendar, ShoppingBag, ArrowRight, Loader2, FileText
} from 'lucide-react';
import { orderApi } from '../api';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder(true);
    }
  }, [orderId]);

  // Polling for webhook payment confirmation if order is in PENDING state
  useEffect(() => {
    let pollInterval;
    let pollCount = 0;
    const maxPolls = 6;

    if (order && (order.status === 'PENDING' || order.paymentStatus === 'PENDING')) {
      setPolling(true);
      pollInterval = setInterval(async () => {
        pollCount += 1;
        try {
          const res = await orderApi.getOrderById(orderId);
          if (res.data && res.data.success) {
            const updated = res.data.data;
            setOrder(updated);
            if (updated.status !== 'PENDING' || updated.paymentStatus === 'PAID' || pollCount >= maxPolls) {
              clearInterval(pollInterval);
              setPolling(false);
            }
          }
        } catch (e) {
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setPolling(false);
          }
        }
      }, 3000);
    } else {
      setPolling(false);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [order?.status, order?.paymentStatus, orderId]);

  const loadOrder = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await orderApi.getOrderById(orderId);
      if (res.data && res.data.success) {
        setOrder(res.data.data);
      } else {
        setError('Order details not found.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load order confirmation details');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await orderApi.downloadInvoice(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${order?.orderNumber || orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Invoice generation error. Please try again from Dashboard.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-forest-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-forest-700 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-typography-secondary">Fetching order receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-forest-900 mb-2">Confirmation Unavailable</h2>
        <p className="text-xs text-typography-secondary mb-6">{error || 'Order record not found.'}</p>
        <Link
          to="/dashboard"
          className="btn-primary text-xs px-6 py-2.5 shadow-level-1"
        >
          View Dashboard
        </Link>
      </div>
    );
  }

  const shippingAddr = order.shippingAddress;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-fade-in text-forest-900">
      {/* Confirmation Success Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 bg-green-600/10 border border-green-600/30 rounded-full flex items-center justify-center mx-auto shadow-level-1">
          {polling ? <Loader2 className="w-9 h-9 text-forest-700 animate-spin" /> : <CheckCircle2 className="w-10 h-10 text-green-600" />}
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-forest-900">
          {polling ? 'Syncing Payment Status...' : 'Payment Confirmed!'}
        </h1>
        <p className="text-sm text-typography-secondary max-w-md mx-auto">
          {polling
            ? `Verifying payment settlement with gateway for order #${order.orderNumber}...`
            : `Thank you for your purchase. Your order #${order.orderNumber} has been confirmed and is being processed.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Order Items */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-surface-white border border-surface-border rounded-container p-6 shadow-level-1">
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-4">
              <h3 className="text-sm font-bold text-forest-900 uppercase tracking-wider flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-forest-700" /> Purchased Items ({order.items?.length || 0})
              </h3>
              <span className="text-xs font-bold text-green-600 bg-green-600/10 border border-green-600/30 px-2.5 py-1 rounded-pill">
                {order.status || 'PAID'}
              </span>
            </div>

            <div className="divide-y divide-surface-border">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-forest-900">{item.productTitle}</h4>
                    <p className="text-[11px] text-typography-secondary">Variant: {item.variantName || 'Standard'} × {item.quantity}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest-900">
                    ₹{(item.unitPriceInr * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-border pt-4 mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-typography-secondary">
                <span>Subtotal</span>
                <span className="text-forest-900 font-mono">₹{order.subtotalAmountInr?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-typography-secondary">
                <span>Shipping Fee</span>
                <span className="text-forest-900 font-mono">₹{order.shippingFeeInr?.toLocaleString('en-IN') || '0'}</span>
              </div>
              <div className="border-t border-surface-border pt-2 flex justify-between font-bold text-sm text-forest-900">
                <span>Total Amount Paid</span>
                <span className="text-forest-700 font-mono">₹{order.totalAmountInr?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {order.status === 'DELIVERED' ? (
              <button
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="w-full sm:w-auto flex-1 btn-secondary text-xs py-3 px-4 flex items-center justify-center gap-2"
              >
                {downloadingInvoice ? <Loader2 className="w-4 h-4 animate-spin text-forest-700" /> : <FileText className="w-4 h-4 text-forest-700" />}
                <span>Download Tax Invoice</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto flex-1 bg-surface-cream border border-surface-border text-typography-secondary font-medium py-3 px-4 rounded-input text-xs flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-forest-700" />
                <span>GST Tax Invoice will be available upon delivery</span>
              </div>
            )}

            <Link
              to="/products"
              className="w-full sm:w-auto flex-1 btn-primary text-xs py-3 px-4 flex items-center justify-center gap-2 shadow-level-1"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Shipping & Payment Metadata */}
        <div className="md:col-span-5 space-y-6">
          {/* Shipping Address */}
          <div className="bg-surface-white border border-surface-border rounded-container p-6 shadow-level-1 space-y-3">
            <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-forest-700" /> Delivery Address
            </h3>

            {shippingAddr ? (
              <div className="text-xs text-typography-secondary space-y-1">
                <p className="font-bold text-forest-900 text-sm">{shippingAddr.recipientName}</p>
                <p>{shippingAddr.line1} {shippingAddr.line2}</p>
                <p>{shippingAddr.city}, {shippingAddr.state} - {shippingAddr.pincode}</p>
                <p className="text-typography-muted pt-1">Phone: {shippingAddr.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-typography-muted">Standard Delivery</p>
            )}
          </div>

          {/* Payment & Status details */}
          <div className="bg-surface-white border border-surface-border rounded-container p-6 shadow-level-1 space-y-3">
            <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-forest-700" /> Fulfillment Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-surface-border">
                <span className="text-typography-muted">Order Number</span>
                <span className="font-mono text-forest-900 font-semibold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-border">
                <span className="text-typography-muted">Payment Ref</span>
                <span className="font-mono text-forest-700 font-semibold">{order.razorpayPaymentId || 'CONFIRMED'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-typography-muted">Estimated Delivery</span>
                <span className="text-green-600 font-semibold">3 - 5 Business Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
