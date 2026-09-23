import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, GraduationCap, Truck, Clock, CheckCircle2, User, RefreshCw, 
  Lock, ShieldCheck, MapPin, FileText, XCircle, AlertCircle, PlusCircle, 
  MessageSquare, ExternalLink, Download, ChevronRight, Edit3, Trash2, Check, ArrowRight
} from 'lucide-react';
import { orderApi, trainingApi, customerApi, supportApi } from '../api';
import SeoHead from '../components/SeoHead';
import EmptyState from '../components/EmptyState';
import PageSkeleton from '../components/PageSkeleton';

export default function DashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('activeTrack');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Cancel Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Raise Ticket Modal State
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'ORDER_ISSUE',
    priority: 'MEDIUM',
    message: '',
    orderId: null,
    courseId: null,
  });

  // Ticket Details / Messaging Drawer State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Address Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orderRes, bookingRes, addrRes, ticketRes] = await Promise.allSettled([
        orderApi.getUserOrders(),
        trainingApi.getUserBookings(),
        customerApi.getAddresses(),
        supportApi.getUserTickets(),
      ]);

      if (orderRes.status === 'fulfilled') setOrders(orderRes.value.data?.data || []);
      if (bookingRes.status === 'fulfilled') setBookings(bookingRes.value.data?.data || []);
      if (addrRes.status === 'fulfilled') setAddresses(addrRes.value.data?.data || []);
      if (ticketRes.status === 'fulfilled') setTickets(ticketRes.value.data?.data || []);
    } catch (err) {
      console.error('Failed to load dashboard portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Invoice PDF Download Handler
  const handleDownloadInvoice = async (orderId, orderNumber) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await orderApi.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sporekart_Invoice_${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download invoice. Please try again.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Submit Order Cancellation
  const handleConfirmCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    const finalReason = cancelReason === 'Other' ? customCancelReason : cancelReason;
    if (!finalReason || !finalReason.trim()) {
      alert('Please select or specify a cancellation reason.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [cancellingOrder.id]: true }));
    try {
      const res = await orderApi.cancelOrder(cancellingOrder.id, finalReason);
      if (res.data && res.data.success) {
        alert(`Order ${cancellingOrder.orderNumber} cancelled successfully.`);
        setCancellingOrder(null);
        setCustomCancelReason('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading((prev) => ({ ...prev, [cancellingOrder.id]: false }));
    }
  };

  // Create Support Ticket Submit
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) {
      alert('Subject and description message are required.');
      return;
    }
    setActionLoading((prev) => ({ ...prev, createTicket: true }));
    try {
      const res = await supportApi.createTicket(ticketForm);
      if (res.data && res.data.success) {
        alert('Support ticket created successfully. Our care team will respond shortly!');
        setTicketModalOpen(false);
        setTicketForm({ subject: '', category: 'ORDER_ISSUE', priority: 'MEDIUM', message: '', orderId: null, courseId: null });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setActionLoading((prev) => ({ ...prev, createTicket: false }));
    }
  };

  // Reply to Ticket
  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyMessage || !replyMessage.trim() || !selectedTicket) return;
    setActionLoading((prev) => ({ ...prev, replyTicket: true }));
    try {
      const res = await supportApi.addMessage(selectedTicket.id, replyMessage.trim());
      if (res.data && res.data.success) {
        setReplyMessage('');
        const updated = await supportApi.getTicketById(selectedTicket.id);
        setSelectedTicket(updated.data.data);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setActionLoading((prev) => ({ ...prev, replyTicket: false }));
    }
  };

  // Save Address Submit
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setActionLoading((prev) => ({ ...prev, saveAddress: true }));
    try {
      if (editingAddress) {
        await customerApi.updateAddress(editingAddress.id, addressForm);
      } else {
        await customerApi.addAddress(addressForm);
      }
      setAddressModalOpen(false);
      setEditingAddress(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address');
    } finally {
      setActionLoading((prev) => ({ ...prev, saveAddress: false }));
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await customerApi.deleteAddress(addressId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete address');
    }
  };

  // Filter Active vs Completed/Cancelled Orders
  const activeOrders = orders.filter((o) =>
    ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
  );
  const historyOrders = orders.filter((o) =>
    ['DELIVERED', 'CANCELLED', 'REFUNDED', 'REFUND_PENDING'].includes(o.status)
  );

  // Calculate 5-Stage Stepper Index
  const getStepperStage = (status) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 1;
      case 'PAID':
      case 'CONFIRMED':
        return 2;
      case 'PROCESSING':
        return 3;
      case 'SHIPPED':
        return 4;
      case 'DELIVERED':
        return 5;
      default:
        return 1;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
      case 'CONFIRMED':
      case 'PROCESSING':
        return (
          <span className="px-3 py-1 bg-blue-950/80 text-blue-300 border border-blue-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> CONFIRMED & PROCESSING
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
            <Truck className="w-3.5 h-3.5 text-amber-400" /> SHIPPED (Shiprocket Express)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> DELIVERED
          </span>
        );
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="px-3 py-1 bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> CANCELLED
          </span>
        );
      case 'PENDING_PAYMENT':
      default:
        return (
          <span className="px-3 py-1 bg-slate-900 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-spore-400" /> ORDER PLACED
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <SeoHead
        title="Customer & Trainee Portal — Sporekart India"
        description="MNC Grade Portal to track active mushroom & spawn shipments, view order history, download GST PDF invoices, manage training masterclasses, and raise support queries."
        noindex={true}
      />

      {/* MNC Immutable Security Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-spore-400" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-spore-900 via-spore-950 to-emerald-950 border border-spore-600/50 flex items-center justify-center text-spore-400 shadow-xl flex-shrink-0">
              <User className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                  {user?.fullName || 'Sporekart Verified Account'}
                </h1>
                <span className="px-2.5 py-0.5 bg-spore-500/20 text-spore-300 text-[10px] font-bold rounded-lg border border-spore-500/40 uppercase">
                  {user?.role || 'ROLE_CUSTOMER'}
                </span>
              </div>

              {/* Immutable Identity Fields */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1 font-mono font-medium text-slate-200">
                  <Lock className="w-3.5 h-3.5 text-spore-400" /> 📞 {user?.phone || user?.identifier || 'Registered Mobile'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 font-mono font-medium text-slate-200">
                  <Lock className="w-3.5 h-3.5 text-spore-400" /> ✉️ {user?.email || user?.identifier || 'Registered Email'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 pt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Identity parameters (Name, Phone, Email) are immutably bound to your customer profile.</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setTicketForm({ subject: '', category: 'GENERAL_INQUIRY', priority: 'MEDIUM', message: '', orderId: null, courseId: null });
                setTicketModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg button-press transition-all"
            >
              <MessageSquare className="w-4 h-4" /> Raise Support Query
            </button>
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition-all button-press"
              title="Refresh Account Data"
            >
              <RefreshCw className="w-4 h-4 text-spore-400" />
            </button>
          </div>
        </div>
      </div>

      {/* MNC Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-spore-900/60 pb-3 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('activeTrack')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all button-press ${
            activeTab === 'activeTrack'
              ? 'bg-spore-500/20 text-spore-300 border border-spore-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Truck className="w-4 h-4 text-spore-400" /> Active Track Orders ({activeOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all button-press ${
            activeTab === 'history'
              ? 'bg-spore-500/20 text-spore-300 border border-spore-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-spore-400" /> Order History ({historyOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('trainings')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all button-press ${
            activeTab === 'trainings'
              ? 'bg-spore-500/20 text-spore-300 border border-spore-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-spore-400" /> Training Masterclasses ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all button-press ${
            activeTab === 'addresses'
              ? 'bg-spore-500/20 text-spore-300 border border-spore-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <MapPin className="w-4 h-4 text-spore-400" /> Delivery Addresses ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all button-press ${
            activeTab === 'support'
              ? 'bg-spore-500/20 text-spore-300 border border-spore-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-spore-400" /> Helpdesk & Complaints ({tickets.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE TRACK ORDERS (IN-PROGRESS) */}
      {activeTab === 'activeTrack' && (
        <div className="space-y-6">
          {loading ? (
            <PageSkeleton type="cards" count={2} />
          ) : activeOrders.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No Active Orders In-Progress"
              description="You have no active or in-flight orders currently being processed or shipped."
              actionText="Browse Mushroom & Spawn Products"
              actionLink="/products"
            />
          ) : (
            activeOrders.map((order) => {
              const stage = getStepperStage(order.status);
              return (
                <div key={order.id} className="glass-card p-6 sm:p-8 rounded-3xl border border-spore-700/50 space-y-6 hover-lift shadow-2xl">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-spore-900/60 pb-4 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-white text-lg tracking-wider">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-slate-400">
                        Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* PDF Invoice Download */}
                      <button
                        onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                        disabled={actionLoading[order.id]}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all button-press"
                      >
                        <FileText className="w-4 h-4 text-spore-400" />
                        <span>{actionLoading[order.id] ? 'Generating PDF...' : 'Download GST Invoice (PDF)'}</span>
                      </button>

                      {/* Cancel Order Action */}
                      <button
                        onClick={() => setCancellingOrder(order)}
                        className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all button-press"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" /> Cancel Order
                      </button>

                      {/* Raise Ticket Action */}
                      <button
                        onClick={() => {
                          setTicketForm({
                            subject: `Query regarding Order ${order.orderNumber}`,
                            category: 'ORDER_ISSUE',
                            priority: 'MEDIUM',
                            message: `Hi Sporekart Support,\n\nI have a query regarding my active order ${order.orderNumber}.`,
                            orderId: order.id,
                            courseId: null,
                          });
                          setTicketModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-spore-950/80 hover:bg-spore-900 text-spore-300 border border-spore-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all button-press"
                      >
                        <MessageSquare className="w-4 h-4 text-spore-400" /> Raise Ticket
                      </button>
                    </div>
                  </div>

                  {/* MNC 5-Stage Stepper Bar */}
                  <div className="py-2 space-y-2">
                    <span className="text-xs font-bold text-slate-300 block mb-3">Shipment Progress Stepper</span>
                    <div className="grid grid-cols-5 gap-2 relative">
                      {[
                        { num: 1, title: 'Order Placed' },
                        { num: 2, title: 'Payment Verified' },
                        { num: 3, title: 'Processing' },
                        { num: 4, title: 'Shipped (Shiprocket)' },
                        { num: 5, title: 'Delivered' },
                      ].map((s) => {
                        const isComplete = stage >= s.num;
                        const isCurrent = stage === s.num;
                        return (
                          <div key={s.num} className="flex flex-col items-center text-center space-y-2">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-all border ${
                                isComplete
                                  ? 'bg-spore-500 text-slate-950 border-spore-400 shadow-md shadow-spore-950/50'
                                  : 'bg-slate-900 text-slate-500 border-slate-800'
                              } ${isCurrent ? 'ring-4 ring-spore-500/20 animate-pulse' : ''}`}
                            >
                              {isComplete ? <Check className="w-4 h-4" /> : s.num}
                            </div>
                            <span
                              className={`text-[11px] font-semibold ${
                                isComplete ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              {s.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="divide-y divide-spore-900/40 pt-2">
                    {order.items?.map((item) => (
                      <div key={item.id || item.variantId} className="py-3 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="text-white font-bold text-sm block">{item.productTitle}</span>
                          <span className="text-slate-400">
                            Variant: <strong className="text-spore-300">{item.variantName}</strong> (SKU: {item.sku}) × {item.quantity} units
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-white text-sm font-display block">
                            ₹{item.lineTotalInr ?? item.subtotalInr ?? (item.priceInr ? item.priceInr * item.quantity : 0)}
                          </span>
                          <span className="text-[10px] text-slate-400">incl. 5% GST</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Shipping Address */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-spore-900/60 gap-4 text-xs">
                    <div className="text-slate-300 space-y-0.5">
                      <span className="font-bold text-white flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-spore-400" /> Delivery Address:
                      </span>
                      <p className="text-slate-400">
                        {order.shippingAddress?.recipientName} — {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode} (📞 {order.shippingAddress?.phone})
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-slate-400 text-xs block font-medium">Total Paid (Free Shiprocket Express)</span>
                      <span className="text-2xl font-extrabold text-spore-400 font-display">₹{order.totalAmountInr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ORDER HISTORY (COMPLETED & CANCELLED) */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {loading ? (
            <PageSkeleton type="cards" count={2} />
          ) : historyOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No Past Order History"
              description="You have no completed, delivered, or cancelled past orders."
              actionText="Explore Sporekart Catalog"
              actionLink="/products"
            />
          ) : (
            historyOrders.map((order) => (
              <div key={order.id} className="glass-card p-6 rounded-3xl border border-spore-800/50 space-y-4 hover-lift">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-spore-900/40 pb-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white text-base">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-xs text-slate-400 block">
                      Ordered on {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                      disabled={actionLoading[order.id]}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all button-press"
                    >
                      <FileText className="w-3.5 h-3.5 text-spore-400" />
                      <span>{actionLoading[order.id] ? 'Generating...' : 'GST Invoice PDF'}</span>
                    </button>
                  </div>
                </div>

                {order.cancellationReason && (
                  <div className="p-3 bg-rose-950/50 border border-rose-900/50 rounded-xl text-xs text-rose-300">
                    <strong>Cancellation Reason:</strong> {order.cancellationReason}
                  </div>
                )}

                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id || item.variantId} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {item.productTitle} — <span className="text-spore-300 font-semibold">{item.variantName}</span> × {item.quantity}
                      </span>
                      <span className="font-bold text-slate-200 font-display">
                        ₹{item.lineTotalInr ?? item.subtotalInr ?? (item.priceInr ? item.priceInr * item.quantity : 0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-spore-900/40 text-sm font-bold text-white">
                  <span>Total Amount Paid</span>
                  <span className="text-spore-400 text-xl font-display">₹{order.totalAmountInr}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: TRAINING MASTERCLASSES & ENROLLMENTS */}
      {activeTab === 'trainings' && (
        <div className="space-y-6">
          {loading ? (
            <PageSkeleton type="cards" count={2} />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No Masterclasses Enrolled"
              description="You have not enrolled in any mushroom cultivation or spawn production training workshops yet."
              actionText="Explore Training Masterclasses"
              actionLink="/training"
            />
          ) : (
            bookings.map((booking) => (
              <div key={booking.bookingId} className="glass-card p-6 sm:p-8 rounded-3xl border border-spore-800/50 space-y-4 hover-lift shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-spore-900/40 pb-4">
                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-spore-500/20 text-spore-300 text-xs font-bold rounded-xl border border-spore-500/40 inline-block">
                      {booking.status || 'CONFIRMED'}
                    </span>
                    <h3 className="font-bold text-white text-lg font-display">{booking.courseTitle}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-spore-400" />
                      Batch Date: {new Date(booking.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
                      <ExternalLink className="w-3.5 h-3.5 text-spore-400" />
                      Location / Online Access Link: <strong className="text-spore-300 underline font-mono">{booking.locationOrLink || 'Sent to registered email'}</strong>
                    </p>
                  </div>

                  <div className="text-right space-y-2 flex-shrink-0">
                    <span className="text-xs text-slate-400 block font-medium">Workshop Fee Paid</span>
                    <span className="text-2xl font-bold text-amber-400 font-display">₹{booking.amountPaidInr}</span>
                    <button
                      onClick={() => {
                        setTicketForm({
                          subject: `Workshop Query: ${booking.courseTitle}`,
                          category: 'COURSE_QUERY',
                          priority: 'MEDIUM',
                          message: `Hi Sporekart Agronomist Team,\n\nI have a question regarding batch schedule for ${booking.courseTitle}.`,
                          orderId: null,
                          courseId: booking.courseId,
                        });
                        setTicketModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all button-press ml-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-spore-400" /> Ask Instructor
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: SAVED DELIVERY ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-display font-bold text-white">Your Saved Shipping Addresses</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressForm({ recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: addresses.length === 0 });
                setAddressModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all button-press shadow-lg"
            >
              <PlusCircle className="w-4 h-4" /> Add New Address
            </button>
          </div>

          {loading ? (
            <PageSkeleton type="cards" count={2} />
          ) : addresses.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No Delivery Addresses Saved"
              description="Save your shipping addresses for quick, 1-click checkout."
              actionText="Add Delivery Address"
              onAction={() => {
                setEditingAddress(null);
                setAddressForm({ recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: true });
                setAddressModalOpen(true);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="glass-card p-6 rounded-3xl border border-spore-800/50 space-y-3 relative hover-lift">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-base">{addr.recipientName}</span>
                    {addr.isDefault && (
                      <span className="px-2.5 py-0.5 bg-spore-500/20 text-spore-300 border border-spore-500/40 text-[10px] font-bold rounded-lg">
                        DEFAULT ADDRESS
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">{addr.line1}, {addr.line2}</p>
                  <p className="text-xs text-slate-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-xs text-spore-400 font-mono">📞 {addr.phone}</p>

                  <div className="flex gap-2 pt-2 border-t border-spore-900/60">
                    <button
                      onClick={() => {
                        setEditingAddress(addr);
                        setAddressForm({ ...addr });
                        setAddressModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all button-press"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-spore-400" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all button-press"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: HELPDESK & SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-display font-bold text-white">Support Tickets & Complaint Tracker</h2>
            <button
              onClick={() => {
                setTicketForm({ subject: '', category: 'GENERAL_INQUIRY', priority: 'MEDIUM', message: '', orderId: null, courseId: null });
                setTicketModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all button-press shadow-lg"
            >
              <PlusCircle className="w-4 h-4" /> Raise Complaint / Query
            </button>
          </div>

          {loading ? (
            <PageSkeleton type="cards" count={2} />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No Open Support Tickets"
              description="Have a question or complaint regarding an order or masterclass? Our support team is ready to assist."
              actionText="Raise a Support Ticket"
              onAction={() => {
                setTicketForm({ subject: '', category: 'GENERAL_INQUIRY', priority: 'MEDIUM', message: '', orderId: null, courseId: null });
                setTicketModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="glass-card p-6 rounded-3xl border border-spore-800/50 space-y-3 hover-lift">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{t.subject}</span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${
                          t.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Category: <strong className="text-slate-300">{t.category}</strong> • Priority: {t.priority} • Opened on {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-spore-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all button-press"
                    >
                      <span>View Message Thread ({t.messages?.length || 0})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-rose-800/60 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-rose-900/60">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" /> Cancel Order {cancellingOrder.orderNumber}
              </h3>
              <button onClick={() => setCancellingOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Please select a cancellation reason. Reserved stock will be returned to inventory and any paid amount will enter refund processing.
            </p>

            <form onSubmit={handleConfirmCancelOrder} className="space-y-4">
              <div className="space-y-2 text-xs">
                {[
                  'Ordered by mistake',
                  'Delivery time is too long',
                  'Need to change shipping address',
                  'Found lower price elsewhere',
                  'Other',
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-spore-500 focus:ring-spore-400"
                    />
                    <span className="text-slate-200 font-medium">{reason}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Specify details</label>
                  <textarea
                    rows={2}
                    required
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-rose-400"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading[cancellingOrder.id]}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all button-press"
                >
                  {actionLoading[cancellingOrder.id] ? 'Cancelling...' : 'Confirm Order Cancellation'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs"
                >
                  Keep Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAISE SUPPORT TICKET MODAL */}
      {ticketModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/60 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-spore-800/60">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-spore-400" /> Raise Support Query / Complaint
              </h3>
              <button onClick={() => setTicketModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your query or issue"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-spore-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                  >
                    <option value="ORDER_ISSUE">Order Issue</option>
                    <option value="PAYMENT_FAILURE">Payment Query</option>
                    <option value="SHIPMENT_DELAY">Shipment / Delivery Delay</option>
                    <option value="COURSE_QUERY">Training / Workshop Query</option>
                    <option value="GENERAL_INQUIRY">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Detailed Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue or question in detail..."
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-spore-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading.createTicket}
                  className="flex-1 bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all button-press shadow-lg"
                >
                  {actionLoading.createTicket ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET DETAILS & MESSAGING THREAD DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/60 max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-spore-800/60 flex-shrink-0">
              <div>
                <h3 className="text-lg font-display font-bold text-white">{selectedTicket.subject}</h3>
                <span className="text-xs text-slate-400">
                  Status: <strong className="text-spore-300">{selectedTicket.status}</strong> • Priority: {selectedTicket.priority}
                </span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/60 rounded-2xl border border-spore-900/60">
              {selectedTicket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl text-xs space-y-1 max-w-[85%] ${
                    msg.senderRole === 'CUSTOMER'
                      ? 'ml-auto bg-spore-950/90 border border-spore-700/60 text-spore-100'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 gap-4">
                    <span className="font-bold">{msg.senderName} ({msg.senderRole})</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleReplyTicket} className="flex gap-2 flex-shrink-0 pt-2">
              <input
                type="text"
                required
                placeholder="Type your reply to customer care..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
              />
              <button
                type="submit"
                disabled={actionLoading.replyTicket}
                className="px-5 py-2 bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold rounded-xl text-xs button-press transition-all flex items-center gap-1"
              >
                <span>Send</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADDRESS ADD/EDIT MODAL */}
      {addressModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/60 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-spore-800/60">
              <h3 className="text-lg font-display font-bold text-white">
                {editingAddress ? 'Edit Delivery Address' : 'Add New Shipping Address'}
              </h3>
              <button onClick={() => setAddressModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-spore-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-spore-500 focus:ring-spore-400"
                />
                <span className="text-slate-300 text-xs">Set as default delivery address</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading.saveAddress}
                  className="flex-1 bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all button-press shadow-lg"
                >
                  {actionLoading.saveAddress ? 'Saving Address...' : 'Save Shipping Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
