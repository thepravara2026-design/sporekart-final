import React, { useEffect, useState } from 'react';
import { ShoppingBag, GraduationCap, Truck, Clock, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { orderApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import EmptyState from '../components/EmptyState';
import PageSkeleton from '../components/PageSkeleton';

export default function DashboardPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orderRes, bookingRes] = await Promise.all([
        orderApi.getUserOrders(),
        trainingApi.getUserBookings(),
      ]);
      setOrders(orderRes.data.data || []);
      setBookings(bookingRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
      case 'PROCESSING':
        return <span className="px-2.5 py-1 bg-blue-950/80 text-blue-300 border border-blue-800/60 text-[10px] font-bold rounded-xl">PAID & PROCESSING</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px] font-bold rounded-xl flex items-center gap-1"><Truck className="w-3 h-3 text-amber-400" /> SHIPPED (Shiprocket)</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold rounded-xl flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> DELIVERED</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold rounded-xl">CREATED</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <SeoHead
        title="User Dashboard — Sporekart India"
        description="View your active Sporekart orders, shipment tracking, and training course bookings."
        noindex={true}
      />

      {/* Profile Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-spore-900 to-spore-950 border border-spore-600/50 flex items-center justify-center text-spore-400 shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-white">{user?.fullName || 'Sporekart Member'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user?.identifier || user?.email || user?.phone}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-spore-500/20 text-spore-300 text-[10px] font-bold rounded-lg border border-spore-500/40">
                {user?.role || 'ROLE_CUSTOMER'}
              </span>
              {user?.linkedProviders?.map((provider) => (
                <span key={provider} className="px-2.5 py-0.5 bg-slate-900 text-slate-300 text-[10px] font-semibold rounded-lg border border-slate-700">
                  {provider === 'GOOGLE' ? 'Google Auth' : provider === 'EMAIL_OTP' ? 'Email OTP' : provider === 'PHONE_OTP' ? 'Phone OTP' : provider}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition-all button-press"
        >
          <RefreshCw className="w-4 h-4 text-spore-400" /> Refresh Status
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-spore-900/60 pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`text-sm font-bold flex items-center gap-2 pb-2 transition-all button-press ${
            activeTab === 'orders'
              ? 'text-spore-400 border-b-2 border-spore-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('trainings')}
          className={`text-sm font-bold flex items-center gap-2 pb-2 transition-all button-press ${
            activeTab === 'trainings'
              ? 'text-spore-400 border-b-2 border-spore-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Training Enrollments ({bookings.length})
        </button>
      </div>

      {/* Orders List */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <PageSkeleton type="cards" count={3} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No Orders Yet"
              description="You haven't placed any orders on Sporekart yet."
              actionText="Explore Products"
              actionLink="/products"
            />
          ) : (
            orders.map((order) => (
              <div key={order.id} className="glass-card p-6 rounded-3xl border border-spore-800/50 space-y-4 hover-lift">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-spore-900/40 pb-3 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Order Number</span>
                    <span className="font-mono font-bold text-white text-sm">{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {item.productTitle} — <span className="text-spore-300 font-semibold">{item.variantName}</span> × {item.quantity}
                      </span>
                      <span className="font-bold text-slate-200 font-display">₹{item.subtotalInr}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-spore-900/40 text-sm font-bold text-white">
                  <span>Total Paid (incl. Shipping & Taxes)</span>
                  <span className="text-spore-400 text-xl font-display">₹{order.totalAmountInr}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Training Bookings List */}
      {activeTab === 'trainings' && (
        <div className="space-y-4">
          {loading ? (
            <PageSkeleton type="cards" count={2} />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No Workshops Enrolled"
              description="You have not enrolled in any certified training workshops yet."
              actionText="Explore Masterclasses"
              actionLink="/training"
            />
          ) : (
            bookings.map((booking) => (
              <div key={booking.bookingId} className="glass-card p-6 rounded-3xl border border-spore-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-spore-500/20 text-spore-300 text-[10px] font-bold rounded-lg border border-spore-500/40">
                    {booking.status}
                  </span>
                  <h3 className="font-bold text-white text-base font-display">{booking.courseTitle}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-spore-400" />
                    Batch Date: {new Date(booking.startTime).toLocaleDateString()} ({new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </p>
                  <p className="text-xs text-slate-400">Location/Link: <strong className="text-slate-200">{booking.locationOrLink}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Fee Paid</span>
                  <span className="text-xl font-bold text-amber-400 font-display">₹{booking.amountPaidInr}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
