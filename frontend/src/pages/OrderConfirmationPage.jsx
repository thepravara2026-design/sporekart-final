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

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrderById(orderId);
      if (res.data && res.data.success) {
        setOrder(res.data.data);
      } else {
        setError('Order details not found.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load order confirmation details');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-[#f2f8f4] text-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#16532f] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Fetching order receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-md mx-auto bg-[#f2f8f4]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Confirmation Unavailable</h2>
        <p className="text-xs text-slate-600 mb-6">{error || 'Order record not found.'}</p>
        <Link
          to="/dashboard"
          className="bg-spore-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all text-xs"
        >
          View Dashboard
        </Link>
      </div>
    );
  }

  const shippingAddr = order.shippingAddress;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-fade-in text-white">
      {/* Confirmation Success Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-spore-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-slate-950" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-white">Payment Confirmed!</h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Thank you for your purchase. Your order <span className="text-spore-400 font-bold">#{order.orderNumber}</span> has been confirmed and is being processed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Order Items */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-spore-400" /> Purchased Items ({order.items?.length || 0})
              </h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                {order.status || 'PAID'}
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.productTitle}</h4>
                    <p className="text-[11px] text-slate-400">Variant: {item.variantName || 'Standard'} × {item.quantity}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    ₹{(item.unitPriceInr * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-mono">₹{order.subtotalAmountInr?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping Fee</span>
                <span className="text-white font-mono">₹{order.shippingFeeInr?.toLocaleString('en-IN') || '0'}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white">
                <span>Total Amount Paid</span>
                <span className="text-spore-400 font-mono">₹{order.totalAmountInr?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {order.status === 'DELIVERED' ? (
              <button
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="w-full sm:w-auto flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                {downloadingInvoice ? <Loader2 className="w-4 h-4 animate-spin text-spore-400" /> : <FileText className="w-4 h-4 text-spore-400" />}
                <span>Download Tax Invoice</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto flex-1 bg-slate-900/80 border border-slate-800 text-slate-300 font-medium py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-spore-400" />
                <span>GST Tax Invoice will be available upon delivery</span>
              </div>
            )}

            <Link
              to="/products"
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all button-press"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Shipping & Payment Metadata */}
        <div className="md:col-span-5 space-y-6">
          {/* Shipping Address */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Delivery Address
            </h3>

            {shippingAddr ? (
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white text-sm">{shippingAddr.recipientName}</p>
                <p>{shippingAddr.line1} {shippingAddr.line2}</p>
                <p>{shippingAddr.city}, {shippingAddr.state} - {shippingAddr.pincode}</p>
                <p className="text-slate-400 pt-1">Phone: {shippingAddr.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Standard Delivery</p>
            )}
          </div>

          {/* Payment & Status details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-400" /> Fulfillment Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Order Number</span>
                <span className="font-mono text-white font-semibold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Payment Ref</span>
                <span className="font-mono text-spore-400 font-semibold">{order.razorpayPaymentId || 'CONFIRMED'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Estimated Delivery</span>
                <span className="text-emerald-400 font-semibold">3 - 5 Business Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
