import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, GraduationCap, Truck, Clock, CheckCircle2, User, RefreshCw, 
  Lock, ShieldCheck, MapPin, FileText, XCircle, AlertCircle, PlusCircle, 
  MessageSquare, ExternalLink, Download, ChevronRight, Edit3, Trash2, Check, ArrowRight,
  Wallet, CreditCard, ArrowDownLeft, ArrowUpRight, RotateCcw
} from 'lucide-react';
import { orderApi, trainingApi, customerApi, supportApi, walletApi } from '../api';
import SeoHead from '../components/SeoHead';
import EmptyState from '../components/EmptyState';
import PageSkeleton from '../components/PageSkeleton';

export default function DashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('activeTrack');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0, withdrawableBalance: 0 });
  const [walletTxns, setWalletTxns] = useState([]);
  const [walletWithdrawals, setWalletWithdrawals] = useState([]);
  const [walletTxnFilter, setWalletTxnFilter] = useState('ALL');
  const [walletTxnSearch, setWalletTxnSearch] = useState('');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' });
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Cancel Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Cancel Enrollment Modal State
  const [cancellingEnrollment, setCancellingEnrollment] = useState(null);
  const [cancelEnrollmentReason, setCancelEnrollmentReason] = useState('Schedule conflict');
  const [customCancelEnrollmentReason, setCustomCancelEnrollmentReason] = useState('');

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
      const [orderRes, bookingRes, addrRes, ticketRes, walletRes, txnRes, wdRes] = await Promise.allSettled([
        orderApi.getUserOrders(),
        trainingApi.getUserBookings(),
        customerApi.getAddresses(),
        supportApi.getUserTickets(),
        walletApi.getWallet(),
        walletApi.getTransactions({ page: 0, size: 50 }),
        walletApi.getWithdrawals(),
      ]);

      if (orderRes.status === 'fulfilled') {
        const d = orderRes.value.data?.data;
        setOrders(Array.isArray(d) ? d : (d?.content || []));
      }
      if (bookingRes.status === 'fulfilled') {
        const d = bookingRes.value.data?.data;
        setBookings(Array.isArray(d) ? d : (d?.content || []));
      }
      if (addrRes.status === 'fulfilled') {
        const d = addrRes.value.data?.data;
        setAddresses(Array.isArray(d) ? d : (d?.content || []));
      }
      if (ticketRes.status === 'fulfilled') {
        const d = ticketRes.value.data?.data;
        setTickets(Array.isArray(d) ? d : (d?.content || []));
      }
      if (walletRes.status === 'fulfilled') {
        setWallet(walletRes.value.data?.data || { availableBalance: 0, pendingBalance: 0, withdrawableBalance: 0 });
      }
      if (txnRes.status === 'fulfilled') {
        const d = txnRes.value.data?.data;
        setWalletTxns(Array.isArray(d) ? d : (d?.content || []));
      }
      if (wdRes.status === 'fulfilled') {
        setWalletWithdrawals(wdRes.value.data?.data || []);
      }
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

  // Submit Training Enrollment Cancellation
  const handleConfirmCancelEnrollment = async (e) => {
    e.preventDefault();
    if (!cancellingEnrollment) return;
    const finalReason = cancelEnrollmentReason === 'Other' ? customCancelEnrollmentReason : cancelEnrollmentReason;
    if (!finalReason || !finalReason.trim()) {
      alert('Please select or specify a cancellation reason.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [cancellingEnrollment.id]: true }));
    try {
      const res = await trainingApi.cancelEnrollment(cancellingEnrollment.id, finalReason);
      if (res.data && res.data.success) {
        alert(`Enrollment for ${cancellingEnrollment.courseTitle} cancelled successfully.`);
        setCancellingEnrollment(null);
        setCustomCancelEnrollmentReason('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to cancel enrollment. Note: Cancellations are only permitted at least 7 days before the batch start date.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [cancellingEnrollment.id]: false }));
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

  // Submit Withdrawal Request
  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }
    if (!withdrawForm.bankName || !withdrawForm.accountNumber) {
      alert('Bank name and account number are required.');
      return;
    }
    setActionLoading((prev) => ({ ...prev, withdraw: true }));
    try {
      const res = await walletApi.requestWithdrawal({
        amount: parseFloat(withdrawForm.amount),
        bankName: withdrawForm.bankName,
        accountNumber: withdrawForm.accountNumber,
        ifscCode: withdrawForm.ifscCode,
        accountHolderName: withdrawForm.accountHolderName,
      });
      if (res.data && res.data.success) {
        alert('Bank withdrawal request submitted successfully!');
        setWithdrawModalOpen(false);
        setWithdrawForm({ amount: '', bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to submit withdrawal request');
    } finally {
      setActionLoading((prev) => ({ ...prev, withdraw: false }));
    }
  };

  // Submit Add Money to Wallet via Razorpay
  const handleAddMoneyToWallet = async (e) => {
    e.preventDefault();
    if (!addMoneyAmount || parseFloat(addMoneyAmount) <= 0) {
      alert('Please enter a valid topup amount.');
      return;
    }
    setActionLoading((prev) => ({ ...prev, addMoney: true }));
    try {
      const amt = parseFloat(addMoneyAmount);
      const res = await walletApi.addMoney({ amount: amt });
      if (res.data && res.data.success) {
        const topupData = res.data.data;

        const completeVerification = async (rzpOrder, rzpPayment, rzpSignature) => {
          try {
            const verifyRes = await walletApi.verifyAddMoney({
              razorpayOrderId: rzpOrder,
              razorpayPaymentId: rzpPayment,
              razorpaySignature: rzpSignature,
            }, amt);
            if (verifyRes.data && verifyRes.data.success) {
              alert(`Successfully credited ₹${amt} to your Sporekart Wallet!`);
              setAddMoneyModalOpen(false);
              setAddMoneyAmount('');
              fetchData();
            }
          } catch (err) {
            alert(err.response?.data?.message || 'Wallet topup verification failed.');
          }
        };

        if (window.Razorpay) {
          const options = {
            key: topupData.razorpayKeyId || 'rzp_test_sporekart',
            amount: Math.round(amt * 100),
            currency: topupData.currency || 'INR',
            name: 'Sporekart Agritech',
            description: 'Wallet Balance Topup',
            order_id: topupData.razorpayOrderId,
            handler: function (response) {
              completeVerification(
                response.razorpay_order_id || topupData.razorpayOrderId,
                response.razorpay_payment_id || ('pay_topup_' + Date.now()),
                response.razorpay_signature || 'mock_sig'
              );
            },
            prefill: {
              name: user?.fullName || '',
              email: user?.email || '',
              contact: user?.phone || '',
            },
            theme: { color: '#1b4332' },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          await completeVerification(
            topupData.razorpayOrderId,
            'pay_topup_' + Date.now(),
            'mock_topup_sig'
          );
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to initiate wallet topup');
    } finally {
      setActionLoading((prev) => ({ ...prev, addMoney: false }));
    }
  };

  // Filter Active vs Completed/Cancelled Orders
  const activeOrders = (Array.isArray(orders) ? orders : []).filter((o) =>
    ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
  );
  const historyOrders = (Array.isArray(orders) ? orders : []).filter((o) =>
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
          <span className="px-3 py-1 bg-green-600/10 text-green-700 border border-green-600/20 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-level-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> CONFIRMED & PROCESSING
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="px-3 py-1 bg-gold/15 text-forest-900 border border-gold/30 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-level-1">
            <Truck className="w-3.5 h-3.5 text-forest-700" /> SHIPPED (Shiprocket Express)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-3 py-1 bg-green-600/10 text-green-700 border border-green-600/20 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-level-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> DELIVERED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-3 py-1 bg-green-600/10 text-green-700 border border-green-600/20 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-level-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> REFUNDED & CANCELLED
          </span>
        );
      case 'REFUND_PENDING':
        return (
          <span className="px-3 py-1 bg-amber-600/10 text-amber-700 border border-amber-600/20 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-level-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> REFUND IN PROGRESS
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 bg-red-600/10 text-red-700 border border-red-600/20 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-level-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> CANCELLED
          </span>
        );
      case 'PENDING_PAYMENT':
      default:
        return (
          <span className="px-3 py-1 bg-surface-neutral text-typography-secondary border border-surface-border text-xs font-bold rounded-full flex items-center gap-1.5 shadow-level-1">
            <Clock className="w-3.5 h-3.5 text-forest-700" /> ORDER PLACED
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-typography-primary">
      <SeoHead
        title="Customer & Trainee Portal — Sporekart India"
        description="MNC Grade Portal to track active mushroom & spawn shipments, view order history, download GST PDF invoices, manage training masterclasses, and raise support queries."
        noindex={true}
      />

      {/* MNC Immutable Security Header */}
      <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border shadow-level-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-forest-700" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-forest-900/10 border border-forest-900/20 flex items-center justify-center text-forest-800 shadow-level-1 flex-shrink-0">
              <User className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-typography-primary">
                  {user?.fullName || 'Sporekart Verified Account'}
                </h1>
                <span className="px-2.5 py-0.5 bg-forest-900/10 text-forest-800 text-[10px] font-bold rounded-lg border border-forest-900/20 uppercase">
                  {user?.role || 'ROLE_CUSTOMER'}
                </span>
              </div>

              {/* Immutable Identity Fields */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-typography-secondary pt-1">
                <span className="flex items-center gap-1 font-mono font-medium text-typography-primary">
                  <Lock className="w-3.5 h-3.5 text-forest-700" /> 📞 {user?.phone || user?.identifier || 'Registered Mobile'}
                </span>
                <span className="text-typography-muted">•</span>
                <span className="flex items-center gap-1 font-mono font-medium text-typography-primary">
                  <Lock className="w-3.5 h-3.5 text-forest-700" /> ✉️ {user?.email || user?.identifier || 'Registered Email'}
                </span>
              </div>

              <p className="text-[11px] text-typography-muted pt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
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
              className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-level-1"
            >
              <MessageSquare className="w-4 h-4" /> Raise Support Query
            </button>
            <button
              onClick={fetchData}
              className="p-2.5 btn-secondary text-xs font-bold flex items-center gap-2"
              title="Refresh Account Data"
            >
              <RefreshCw className="w-4 h-4 text-forest-700" />
            </button>
          </div>
        </div>
      </div>

      {/* MNC Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-surface-border pb-3 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('activeTrack')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
            activeTab === 'activeTrack'
              ? 'btn-primary text-white shadow-level-1'
              : 'text-typography-secondary hover:text-typography-primary bg-surface-white border border-surface-border'
          }`}
        >
          <Truck className="w-4 h-4 text-forest-700" /> Active Track Orders ({activeOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'btn-primary text-white shadow-level-1'
              : 'text-typography-secondary hover:text-typography-primary bg-surface-white border border-surface-border'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-forest-700" /> Order History ({historyOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('trainings')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
            activeTab === 'trainings'
              ? 'btn-primary text-white shadow-level-1'
              : 'text-typography-secondary hover:text-typography-primary bg-surface-white border border-surface-border'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-forest-700" /> Training Masterclasses ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
            activeTab === 'addresses'
              ? 'btn-primary text-white shadow-level-1'
              : 'text-typography-secondary hover:text-typography-primary bg-surface-white border border-surface-border'
          }`}
        >
          <MapPin className="w-4 h-4 text-forest-700" /> Delivery Addresses ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
            activeTab === 'wallet'
              ? 'btn-primary text-white shadow-level-1'
              : 'text-typography-secondary hover:text-typography-primary bg-surface-white border border-surface-border'
          }`}
        >
          <Wallet className="w-4 h-4 text-forest-700" /> Wallet &amp; Ledger (₹{(wallet.availableBalance || 0).toLocaleString('en-IN')})
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
            activeTab === 'support'
              ? 'btn-primary text-white shadow-level-1'
              : 'text-typography-secondary hover:text-typography-primary bg-surface-white border border-surface-border'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-forest-700" /> Helpdesk & Complaints ({tickets.length})
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
                <div key={order.id} className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border space-y-6 hover-lift shadow-level-1">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-border pb-4 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-typography-primary text-lg tracking-wider">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-typography-muted">
                        Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* PDF Invoice Download */}
                      {order.status === 'DELIVERED' ? (
                        <button
                          onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                          disabled={actionLoading[order.id]}
                          className="btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-forest-700" />
                          <span>{actionLoading[order.id] ? 'Generating PDF...' : 'Download GST Invoice (PDF)'}</span>
                        </button>
                      ) : (
                        <div className="px-3 py-1.5 bg-surface-cream border border-surface-border rounded-xl text-xs text-typography-muted flex items-center gap-1.5" title="GST Tax Invoice will be generated automatically once your order is DELIVERED">
                          <FileText className="w-3.5 h-3.5 text-typography-muted" />
                          <span>GST Bill (Available on Delivery)</span>
                        </div>
                      )}

                      {/* Cancel Order Action */}
                      {order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' ? (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="px-3.5 py-2 bg-red-600/10 text-red-700 border border-red-600/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:bg-red-600/20"
                        >
                          <XCircle className="w-4 h-4 text-red-600" /> Cancel Order
                        </button>
                      ) : order.status === 'SHIPPED' ? (
                        <span className="px-3 py-1.5 bg-surface-cream border border-surface-border text-typography-muted text-xs font-medium rounded-xl flex items-center gap-1" title="Cancellation cutoff reached. Order is currently in transit with courier.">
                          <Ban className="w-3.5 h-3.5 text-amber-600" /> Dispatched (Cannot Cancel)
                        </span>
                      ) : null}

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
                        className="btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4 text-forest-700" /> Raise Ticket
                      </button>
                    </div>
                  </div>

                  {/* MNC 5-Stage Stepper Bar */}
                  <div className="py-2 space-y-2">
                    <span className="text-xs font-bold text-typography-primary block mb-3">Shipment Progress Stepper</span>
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
                                  ? 'bg-green-600 text-white border-green-700 shadow-level-1'
                                  : 'bg-surface-cream text-typography-muted border-surface-border'
                              } ${isCurrent ? 'ring-4 ring-green-600/20 animate-pulse' : ''}`}
                            >
                              {isComplete ? <Check className="w-4 h-4" /> : s.num}
                            </div>
                            <span
                              className={`text-[11px] font-semibold ${
                                isComplete ? 'text-typography-primary' : 'text-typography-muted'
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
                  <div className="divide-y divide-surface-border pt-2">
                    {order.items?.map((item) => (
                      <div key={item.id || item.variantId} className="py-3 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="text-typography-primary font-bold text-sm block">{item.productTitle}</span>
                          <span className="text-typography-secondary">
                            Variant: <strong className="text-forest-700">{item.variantName}</strong> (SKU: {item.sku}) × {item.quantity} units
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-typography-primary text-sm font-display block">
                            ₹{item.lineTotalInr ?? item.subtotalInr ?? (item.priceInr ? item.priceInr * item.quantity : 0)}
                          </span>
                          <span className="text-[10px] text-typography-muted">incl. 5% GST</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipment Tracking Box */}
                  {(order.trackingNumber || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                    <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-forest-700 shrink-0" />
                        <div>
                          <span className="font-bold text-xs text-typography-primary block">
                            Courier Partner: <span className="text-forest-800">{order.courierPartner || 'BlueDart Express'}</span>
                          </span>
                          <span className="text-[11px] text-typography-muted font-mono">
                            AWB / Tracking Code: {order.trackingNumber || `AWB-897${order.id.substring(0, 6).toUpperCase()}`}
                          </span>
                        </div>
                      </div>

                      <a
                        href={order.trackingUrl || `https://track.shiprocket.in/AWB-897${order.id.substring(0, 6).toUpperCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Track Shipment
                      </a>
                    </div>
                  )}

                  {/* Summary & Shipping Address */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-surface-border gap-4 text-xs">
                    <div className="text-typography-secondary space-y-0.5">
                      <span className="font-bold text-typography-primary flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-forest-700" /> Delivery Address:
                      </span>
                      <p className="text-typography-secondary">
                        {order.shippingAddress?.recipientName} — {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode} (📞 {order.shippingAddress?.phone})
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-typography-muted text-xs block font-medium">Total Paid (Free Shiprocket Express)</span>
                      <span className="text-2xl font-extrabold text-forest-800 font-display">₹{order.totalAmountInr}</span>
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
              <div key={order.id} className="bg-surface-white p-6 rounded-card border border-surface-border space-y-4 hover-lift shadow-level-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-border pb-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-typography-primary text-base">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-xs text-typography-muted block">
                      Ordered on {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.status === 'DELIVERED' ? (
                      <button
                        onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                        disabled={actionLoading[order.id]}
                        className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-forest-700" />
                        <span>{actionLoading[order.id] ? 'Generating...' : 'GST Invoice PDF'}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-typography-muted italic">GST Invoice available upon delivery</span>
                    )}
                  </div>
                </div>

                {/* Cancellation & Payment Refund Details Card */}
                {['CANCELLED', 'REFUNDED', 'REFUND_PENDING'].includes(order.status) && (
                  <div className="p-4 bg-surface-cream border border-surface-border rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-typography-primary uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-red-600" /> Cancellation & Refund Overview
                      </span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border uppercase ${
                        order.status === 'REFUNDED' ? 'bg-green-600/10 text-green-700 border-green-600/20' :
                        order.status === 'REFUND_PENDING' ? 'bg-amber-600/10 text-amber-700 border-amber-600/20' :
                        'bg-red-600/10 text-red-700 border-red-600/20'
                      }`}>
                        {order.status === 'REFUNDED' ? 'REFUND SETTLED' : order.status === 'REFUND_PENDING' ? 'REFUND IN PROGRESS' : 'ORDER CANCELLED'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="p-2.5 bg-red-600/10 border border-red-600/20 rounded-xl text-red-700">
                        <strong>Cancellation Reason:</strong> {order.cancellationReason || 'Cancelled upon user / admin request'}
                      </div>
                      
                      <div className="pt-1 flex flex-col sm:flex-row justify-between text-typography-secondary text-[11px] gap-2">
                        <div>
                          <span>Refund Reference: </span>
                          <strong className="font-mono text-forest-800">{order.razorpayPaymentId || `rfnd_${order.id.substring(0, 10)}`}</strong>
                        </div>
                        <div>
                          <span>Refund Amount: </span>
                          <strong className="text-red-700 font-bold">₹{order.totalAmountInr} (100% Reversal)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id || item.variantId} className="flex justify-between items-center text-xs">
                      <span className="text-typography-secondary">
                        {item.productTitle} — <span className="text-forest-700 font-semibold">{item.variantName}</span> × {item.quantity}
                      </span>
                      <span className="font-bold text-typography-primary font-display">
                        ₹{item.lineTotalInr ?? item.subtotalInr ?? (item.priceInr ? item.priceInr * item.quantity : 0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-surface-border text-sm font-bold text-typography-primary">
                  <span>Total Amount Paid</span>
                  <span className="text-forest-800 text-xl font-display">₹{order.totalAmountInr}</span>
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
            bookings.map((booking) => {
              const startDateObj = booking.startDate ? new Date(booking.startDate) : (booking.startTime ? new Date(booking.startTime) : null);
              const now = new Date();
              const timeDiff = startDateObj ? (startDateObj.getTime() - now.getTime()) : null;
              const daysUntilStart = timeDiff !== null ? Math.ceil(timeDiff / (1000 * 3600 * 24)) : null;
              const canCancel = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (daysUntilStart === null || daysUntilStart >= 7);

              return (
                <div key={booking.id || booking.bookingId} className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border space-y-5 hover-lift shadow-level-1">
                  {/* Card Header & Summary */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-surface-border pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-xl border inline-block ${
                          booking.status === 'CANCELLED' 
                            ? 'bg-red-600/10 text-red-700 border-red-600/20'
                            : booking.status === 'COMPLETED'
                            ? 'bg-green-600/10 text-green-700 border-green-600/20'
                            : 'bg-forest-900/10 text-forest-800 border-forest-900/20'
                        }`}>
                          {booking.status || 'CONFIRMED'}
                        </span>
                        {booking.batchCode && (
                          <span className="px-2.5 py-0.5 bg-surface-cream text-typography-primary text-[10px] font-mono font-bold rounded-lg border border-surface-border">
                            {booking.batchCode}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-typography-primary text-lg font-display pt-0.5">{booking.courseTitle}</h3>

                      <p className="text-xs text-typography-secondary flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-forest-700" />
                        Batch Date: {booking.startDate ? new Date(booking.startDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : (booking.startTime ? new Date(booking.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : (booking.enrolledAt ? new Date(booking.enrolledAt).toLocaleDateString() : 'Upcoming Batch'))}
                      </p>
                      <p className="text-xs text-typography-secondary flex items-center gap-1.5 pt-1">
                        <ExternalLink className="w-3.5 h-3.5 text-forest-700" />
                        Location / Online Access Link: <strong className="text-forest-700 underline font-mono">{booking.locationOrLink || 'Sent to registered email'}</strong>
                      </p>
                    </div>

                    <div className="text-right space-y-2 flex-shrink-0">
                      <span className="text-xs text-typography-muted block font-medium">Workshop Fee Paid</span>
                      <span className="text-2xl font-bold text-forest-800 font-display block">₹{(booking.feePaidInr ?? booking.amountPaidInr ?? 0).toLocaleString('en-IN')}</span>

                      {/* Cancel Enrollment Button */}
                      {canCancel && (
                        <button
                          onClick={() => setCancellingEnrollment(booking)}
                          className="px-3.5 py-1.5 bg-red-600/10 text-red-700 border border-red-600/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ml-auto"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-600" /> Cancel Enrollment
                        </button>
                      )}

                      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && daysUntilStart !== null && daysUntilStart < 7 && (
                        <span className="text-[11px] text-gold bg-gold/10 border border-gold/25 px-2.5 py-1 rounded-xl flex items-center gap-1.5 ml-auto" title="Enrollment cancellation is allowed only at least 7 days before batch start date">
                          <AlertCircle className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span>Cancellation Locked (&lt; 7 Days)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cancelled Training Booking & Refund Details Banner */}
                  {booking.status === 'CANCELLED' && (
                    <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-700 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-red-600" /> Training Enrollment Cancelled
                        </span>
                        <span className="px-2 py-0.5 bg-green-600/10 text-green-700 border border-green-600/20 text-[10px] font-bold rounded-lg uppercase">
                          REFUND PROCESSED
                        </span>
                      </div>
                      <p className="text-red-700">
                        <strong>Reason:</strong> {booking.cancellationReason || booking.reason || 'Cancelled by trainee request / batch adjustment'}
                      </p>
                      <p className="text-typography-secondary text-[11px] font-mono">
                        Refund of ₹{(booking.feePaidInr ?? booking.amountPaidInr ?? 0).toLocaleString('en-IN')} processed to registered account method.
                      </p>
                    </div>
                  )}

                  {/* Customer Support Options Section */}
                  <div className="bg-surface-cream p-4 rounded-2xl border border-surface-border space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-forest-700" />
                      <span className="text-xs font-bold text-typography-primary uppercase tracking-wider">Customer Support Options for Training &amp; Courses</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {/* Option 1: Batch & Schedule */}
                      <button
                        onClick={() => {
                          setTicketForm({
                            subject: `Batch & Schedule Query: ${booking.courseTitle}`,
                            category: 'COURSE_QUERY',
                            priority: 'MEDIUM',
                            message: `Hi Sporekart Agronomist Support,\n\nI need assistance regarding batch timing, rescheduling, or google meet link for ${booking.courseTitle} (Batch: ${booking.batchCode || 'Masterclass'}).`,
                            orderId: null,
                            courseId: booking.courseId,
                          });
                          setTicketModalOpen(true);
                        }}
                        className="p-2.5 bg-surface-white hover:bg-forest-900/5 text-typography-primary border border-surface-border rounded-xl text-left font-semibold flex items-center gap-2 transition-all"
                      >
                        <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                        <span>Batch &amp; Schedule Query</span>
                      </button>

                      {/* Option 2: Course Materials & Notes */}
                      <button
                        onClick={() => {
                          setTicketForm({
                            subject: `Course Materials & Study Notes: ${booking.courseTitle}`,
                            category: 'COURSE_QUERY',
                            priority: 'MEDIUM',
                            message: `Hi Sporekart Agronomist Support,\n\nI need assistance accessing study guides, substrate formulas, or class recordings for ${booking.courseTitle}.`,
                            orderId: null,
                            courseId: booking.courseId,
                          });
                          setTicketModalOpen(true);
                        }}
                        className="p-2.5 bg-surface-white hover:bg-forest-900/5 text-typography-primary border border-surface-border rounded-xl text-left font-semibold flex items-center gap-2 transition-all"
                      >
                        <GraduationCap className="w-4 h-4 text-forest-700 flex-shrink-0" />
                        <span>Course Content &amp; Notes</span>
                      </button>

                      {/* Option 3: Payments & Refunds */}
                      <button
                        onClick={() => {
                          setTicketForm({
                            subject: `Training Payment & Refund Query: ${booking.courseTitle}`,
                            category: 'PAYMENT_FAILURE',
                            priority: 'MEDIUM',
                            message: `Hi Sporekart Customer Support,\n\nI have a query regarding workshop fee payment, GST invoice, or refund status for ${booking.courseTitle} (Ref: ${booking.paymentReference || 'N/A'}).`,
                            orderId: null,
                            courseId: booking.courseId,
                          });
                          setTicketModalOpen(true);
                        }}
                        className="p-2.5 bg-surface-white hover:bg-forest-900/5 text-typography-primary border border-surface-border rounded-xl text-left font-semibold flex items-center gap-2 transition-all"
                      >
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Training Payment / Refund</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: SAVED DELIVERY ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-display font-bold text-typography-primary">Your Saved Shipping Addresses</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressForm({ recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: addresses.length === 0 });
                setAddressModalOpen(true);
              }}
              className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2"
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
                <div key={addr.id} className="bg-surface-white p-6 rounded-card border border-surface-border space-y-3 relative hover-lift shadow-level-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-typography-primary text-base">{addr.recipientName}</span>
                    {addr.isDefault && (
                      <span className="px-2.5 py-0.5 bg-forest-900/10 text-forest-800 border border-forest-900/20 text-[10px] font-bold rounded-lg">
                        DEFAULT ADDRESS
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-typography-secondary">{addr.line1}, {addr.line2}</p>
                  <p className="text-xs text-typography-muted">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-xs text-forest-700 font-mono">📞 {addr.phone}</p>

                  <div className="flex gap-2 pt-2 border-t border-surface-border">
                    <button
                      onClick={() => {
                        setEditingAddress(addr);
                        setAddressForm({ ...addr });
                        setAddressModalOpen(true);
                      }}
                      className="btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-forest-700" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="px-3 py-1.5 bg-red-600/10 text-red-700 border border-red-600/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" /> Delete
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
            <h2 className="text-lg font-display font-bold text-typography-primary">Support Tickets & Complaint Tracker</h2>
            <button
              onClick={() => {
                setTicketForm({ subject: '', category: 'GENERAL_INQUIRY', priority: 'MEDIUM', message: '', orderId: null, courseId: null });
                setTicketModalOpen(true);
              }}
              className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2"
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
                <div key={t.id} className="bg-surface-white p-6 rounded-card border border-surface-border space-y-3 hover-lift shadow-level-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-typography-primary text-base">{t.subject}</span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${
                          t.status === 'RESOLVED' ? 'bg-green-600/10 text-green-700 border-green-600/20' : 'bg-gold/15 text-forest-900 border border-gold/30'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-typography-muted">
                        Category: <strong className="text-typography-primary">{t.category}</strong> • Priority: {t.priority} • Opened on {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
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

      {/* TAB 6: WALLET & PAYMENT LEDGER */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Wallet Balance KPI Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Available Balance */}
            <div className="bg-forest-900 text-white p-6 rounded-card border border-forest-800 shadow-level-2 space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-leaf">Sporekart Available Balance</span>
                  <h2 className="text-3xl font-black font-mono mt-1 text-white">₹{(wallet.availableBalance || 0).toLocaleString('en-IN')}</h2>
                  <p className="text-[11px] text-sage mt-1">Ready for 1-click purchases &amp; training enrollments.</p>
                </div>
                <div className="p-3 bg-forest-800/80 rounded-2xl border border-forest-700 text-leaf">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-forest-800">
                <button
                  onClick={() => setAddMoneyModalOpen(true)}
                  className="px-3.5 py-2 bg-leaf text-forest-900 hover:bg-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-level-1"
                >
                  <PlusCircle className="w-4 h-4" /> Add Money
                </button>
                <button
                  onClick={() => setWithdrawModalOpen(true)}
                  className="px-3.5 py-2 bg-forest-800 text-white hover:bg-forest-700 border border-forest-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <ArrowUpRight className="w-4 h-4 text-leaf" /> Withdraw to Bank
                </button>
              </div>
            </div>

            {/* Card 2: Pending Refunds & Ledger Balance */}
            <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase text-typography-muted">Pending Refunds &amp; In-Flight Credits</span>
                  <h3 className="text-2xl font-extrabold font-mono text-typography-primary mt-1">₹{(wallet.pendingBalance || 0).toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-typography-secondary mt-1">Refunds being processed from Razorpay / Order Cancellations.</p>
                </div>
                <div className="p-2.5 bg-surface-cream text-forest-700 rounded-xl border border-surface-border">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 3: Withdrawable Balance */}
            <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase text-typography-muted">Eligible Withdrawable Balance</span>
                  <h3 className="text-2xl font-extrabold font-mono text-green-700 mt-1">₹{(wallet.withdrawableBalance || 0).toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-typography-secondary mt-1">Eligible for instant electronic transfer to bank account.</p>
                </div>
                <div className="p-2.5 bg-green-600/10 text-green-700 rounded-xl border border-green-600/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Withdrawal Requests Banner */}
          {walletWithdrawals.length > 0 && (
            <div className="bg-surface-white p-6 rounded-card border border-surface-border space-y-3 shadow-level-1">
              <h3 className="font-bold text-typography-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-forest-700" /> Recent Bank Withdrawal Requests
              </h3>
              <div className="divide-y divide-surface-border">
                {walletWithdrawals.map((wd) => (
                  <div key={wd.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-typography-primary">{wd.withdrawalReference}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border uppercase ${
                          wd.status === 'SUCCESS' ? 'bg-green-600/10 text-green-700 border-green-600/20' :
                          wd.status === 'REVERSED' ? 'bg-red-600/10 text-red-700 border-red-600/20' : 'bg-amber-600/10 text-amber-700 border-amber-600/20'
                        }`}>
                          {wd.status}
                        </span>
                      </div>
                      <p className="text-typography-muted">
                        Bank: <strong className="text-typography-primary">{wd.bankName}</strong> ({wd.accountNumberMasked}) • Requested on {new Date(wd.createdAt).toLocaleDateString()}
                      </p>
                      {wd.rejectionReason && (
                        <p className="text-red-700 text-[11px]">Rejection Reason: {wd.rejectionReason} (Amount reversed to wallet)</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-red-700 text-sm block">₹{wd.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet Transaction Ledger Desk */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border space-y-6 shadow-level-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
              <div>
                <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-forest-700" /> Immutable Financial Transaction Ledger
                </h3>
                <p className="text-xs text-typography-secondary">Complete auditable record of all credits, debits, order refunds, and training payments.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search Ref / Order ID..."
                  value={walletTxnSearch}
                  onChange={(e) => setWalletTxnSearch(e.target.value)}
                  className="bg-surface-cream border border-surface-border rounded-xl px-3 py-1.5 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {['ALL', 'CREDIT', 'DEBIT', 'REFUND', 'WALLET_PAYMENT', 'WITHDRAWAL', 'TOPUP'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setWalletTxnFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    walletTxnFilter === filter
                      ? 'btn-primary text-white'
                      : 'bg-surface-white text-typography-secondary border-surface-border hover:bg-surface-cream'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Ledger Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[750px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Txn Reference</th>
                    <th className="p-3.5">Date &amp; Time</th>
                    <th className="p-3.5">Type &amp; Source</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Balance Ledger</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {walletTxns
                    .filter(t => (walletTxnFilter === 'ALL' || t.transactionType === walletTxnFilter) && (!walletTxnSearch || t.transactionReference?.toLowerCase().includes(walletTxnSearch.toLowerCase()) || t.description?.toLowerCase().includes(walletTxnSearch.toLowerCase())))
                    .map((t) => {
                      const isCredit = t.transactionDirection === 'CREDIT';
                      return (
                        <tr key={t.id} className="hover:bg-surface-cream/50">
                          <td className="p-3.5 font-mono font-bold text-typography-primary whitespace-nowrap">{t.transactionReference}</td>
                          <td className="p-3.5 text-typography-muted whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border uppercase inline-flex items-center gap-1 ${
                              isCredit ? 'bg-green-600/10 text-green-700 border-green-600/20' : 'bg-red-600/10 text-red-700 border-red-600/20'
                            }`}>
                              {isCredit ? <ArrowDownLeft className="w-3 h-3 text-green-600" /> : <ArrowUpRight className="w-3 h-3 text-red-600" />}
                              {t.transactionType}
                            </span>
                          </td>
                          <td className="p-3.5 text-typography-primary max-w-xs">{t.description}</td>
                          <td className={`p-3.5 font-mono font-extrabold whitespace-nowrap ${isCredit ? 'text-green-700' : 'text-red-700'}`}>
                            {isCredit ? '+' : '-'}₹{t.amount}
                          </td>
                          <td className="p-3.5 font-mono text-typography-muted whitespace-nowrap text-[11px]">
                            ₹{t.balanceBefore} → <strong className="text-typography-primary font-bold">₹{t.balanceAfter}</strong>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-green-600/10 text-green-700 border border-green-600/20 text-[10px] font-bold rounded-lg uppercase">
                              {t.status || 'SUCCESS'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {walletTxns.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-typography-muted">No wallet financial transactions recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WITHDRAW MONEY TO BANK */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-white p-6 rounded-card max-w-md w-full space-y-4 border border-surface-border shadow-level-3 animate-scale-in">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h4 className="font-bold text-lg text-typography-primary font-display flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-forest-700" /> Bank Account Withdrawal Request
              </h4>
              <button onClick={() => setWithdrawModalOpen(false)} className="text-typography-muted hover:text-typography-primary">✕</button>
            </div>

            <div className="p-3 bg-surface-cream rounded-xl border border-surface-border text-xs text-typography-secondary flex justify-between items-center">
              <span>Withdrawable Balance:</span>
              <strong className="text-green-700 font-mono font-bold text-sm">₹{(wallet.withdrawableBalance || 0).toLocaleString('en-IN')}</strong>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="space-y-3 text-xs">
              <div>
                <label className="block text-typography-primary font-bold mb-1">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={wallet.withdrawableBalance}
                  placeholder="e.g. 500"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 font-mono text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>

              <div>
                <label className="block text-typography-primary font-bold mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank / State Bank of India"
                  value={withdrawForm.bankName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>

              <div>
                <label className="block text-typography-primary font-bold mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50100293849102"
                  value={withdrawForm.accountNumber}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 font-mono text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-typography-primary font-bold mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="HDFC0001234"
                    value={withdrawForm.ifscCode}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 font-mono text-typography-primary focus:outline-none focus:border-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Account Holder Name"
                    value={withdrawForm.accountHolderName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolderName: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={actionLoading.withdraw} className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-1.5">
                  {actionLoading.withdraw ? 'Submitting...' : 'Submit Withdrawal Request'}
                </button>
                <button type="button" onClick={() => setWithdrawModalOpen(false)} className="px-4 btn-secondary font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MONEY TO WALLET */}
      {addMoneyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-white p-6 rounded-card max-w-md w-full space-y-4 border border-surface-border shadow-level-3 animate-scale-in">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h4 className="font-bold text-lg text-typography-primary font-display flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-forest-700" /> Topup Sporekart Wallet
              </h4>
              <button onClick={() => setAddMoneyModalOpen(false)} className="text-typography-muted hover:text-typography-primary">✕</button>
            </div>

            <form onSubmit={handleAddMoneyToWallet} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-bold mb-1">Topup Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="10"
                  placeholder="e.g. 1000"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-lg font-mono font-bold text-forest-800 focus:outline-none focus:border-forest-700"
                />
              </div>

              <div className="p-3 bg-surface-cream rounded-xl border border-surface-border text-[11px] text-typography-secondary space-y-1">
                <span className="font-bold text-typography-primary block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Payment Protection:
                </span>
                <div>✓ Instant authorization via Razorpay 256-bit encrypted gateway</div>
                <div>✓ Funds immediately available for mushroom orders &amp; masterclasses</div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={actionLoading.addMoney} className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-1.5">
                  {actionLoading.addMoney ? 'Processing Gateway...' : `Pay ₹${addMoneyAmount || 0} & Topup Wallet`}
                </button>
                <button type="button" onClick={() => setAddMoneyModalOpen(false)} className="px-4 btn-secondary font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-typography-primary/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border max-w-md w-full space-y-5 shadow-level-3">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <h3 className="text-lg font-display font-bold text-typography-primary flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" /> Cancel Order {cancellingOrder.orderNumber}
              </h3>
              <button onClick={() => setCancellingOrder(null)} className="text-typography-muted hover:text-typography-primary">✕</button>
            </div>

            <p className="text-xs text-typography-secondary leading-relaxed">
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
                  <label key={reason} className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-cream border border-surface-border cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-green-600 focus:ring-green-600/15"
                    />
                    <span className="text-typography-primary font-medium">{reason}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="block text-xs text-typography-primary mb-1 font-medium">Specify details</label>
                  <textarea
                    rows={2}
                    required
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    className="w-full bg-surface-white border border-surface-border rounded-xl p-3 text-typography-primary text-xs focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading[cancellingOrder.id]}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  {actionLoading[cancellingOrder.id] ? 'Cancelling...' : 'Confirm Order Cancellation'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2.5 btn-secondary text-xs"
                >
                  Keep Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ENROLLMENT MODAL */}
      {cancellingEnrollment && (
        <div className="fixed inset-0 bg-typography-primary/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border max-w-md w-full space-y-5 shadow-level-3">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <h3 className="text-lg font-display font-bold text-typography-primary flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" /> Cancel Enrollment
              </h3>
              <button onClick={() => setCancellingEnrollment(null)} className="text-typography-muted hover:text-typography-primary">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-typography-primary font-bold">{cancellingEnrollment.courseTitle}</p>
              <p className="text-typography-secondary">
                Batch Date: <strong className="text-typography-primary">{cancellingEnrollment.startDate ? new Date(cancellingEnrollment.startDate).toLocaleDateString() : 'Upcoming Batch'}</strong>
              </p>
              <p className="text-forest-900 bg-gold/15 p-2.5 rounded-xl border border-gold/30 text-[11px] font-medium leading-relaxed">
                ⚠️ Note: Cancellations are permitted at least 7 days prior to the batch start date. Upon confirmation, your slot will be released back to capacity.
              </p>
            </div>

            <form onSubmit={handleConfirmCancelEnrollment} className="space-y-4">
              <div className="space-y-2 text-xs">
                <label className="block text-typography-primary font-medium mb-1">Reason for cancellation</label>
                {[
                  'Schedule conflict',
                  'Health / Personal Emergency',
                  'Location / Travel issue',
                  'Enrolled in wrong course',
                  'Other',
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-cream border border-surface-border cursor-pointer">
                    <input
                      type="radio"
                      name="cancelEnrollmentReason"
                      value={reason}
                      checked={cancelEnrollmentReason === reason}
                      onChange={(e) => setCancelEnrollmentReason(e.target.value)}
                      className="text-green-600 focus:ring-green-600/15"
                    />
                    <span className="text-typography-primary font-medium">{reason}</span>
                  </label>
                ))}
              </div>

              {cancelEnrollmentReason === 'Other' && (
                <div>
                  <label className="block text-xs text-typography-primary mb-1 font-medium font-mono">Specify details</label>
                  <textarea
                    rows={2}
                    required
                    value={customCancelEnrollmentReason}
                    onChange={(e) => setCustomCancelEnrollmentReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    className="w-full bg-surface-white border border-surface-border rounded-xl p-3 text-typography-primary text-xs focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading[cancellingEnrollment.id]}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  {actionLoading[cancellingEnrollment.id] ? 'Cancelling...' : 'Confirm Cancel Enrollment'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancellingEnrollment(null)}
                  className="px-4 py-2.5 btn-secondary text-xs"
                >
                  Keep Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAISE SUPPORT TICKET MODAL */}
      {ticketModalOpen && (
        <div className="fixed inset-0 bg-typography-primary/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border max-w-lg w-full space-y-5 shadow-level-3">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <h3 className="text-lg font-display font-bold text-typography-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-forest-700" /> Raise Support Query / Complaint
              </h3>
              <button onClick={() => setTicketModalOpen(false)} className="text-typography-muted hover:text-typography-primary">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-medium mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your query or issue"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                  >
                    <option value="ORDER_ISSUE">Order Issue</option>
                    <option value="PAYMENT_FAILURE">Payment Query</option>
                    <option value="SHIPMENT_DELAY">Shipment / Delivery Delay</option>
                    <option value="COURSE_QUERY">Training / Workshop Query</option>
                    <option value="GENERAL_INQUIRY">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-typography-primary font-medium mb-1">Detailed Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue or question in detail..."
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl p-3 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading.createTicket}
                  className="flex-1 btn-primary font-bold py-2.5 text-xs"
                >
                  {actionLoading.createTicket ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="px-4 py-2.5 btn-secondary text-xs"
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
        <div className="fixed inset-0 bg-typography-primary/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border max-w-2xl w-full space-y-4 shadow-level-3 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border flex-shrink-0">
              <div>
                <h3 className="text-lg font-display font-bold text-typography-primary">{selectedTicket.subject}</h3>
                <span className="text-xs text-typography-muted">
                  Status: <strong className="text-forest-700">{selectedTicket.status}</strong> • Priority: {selectedTicket.priority}
                </span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-typography-muted hover:text-typography-primary text-lg">✕</button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-surface-cream rounded-2xl border border-surface-border">
              {selectedTicket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl text-xs space-y-1 max-w-[85%] ${
                    msg.senderRole === 'CUSTOMER'
                      ? 'ml-auto bg-forest-900/10 border border-forest-900/20 text-forest-900'
                      : 'bg-surface-white border border-surface-border text-typography-secondary'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-typography-muted gap-4">
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
                className="flex-1 bg-surface-white border border-surface-border rounded-xl px-4 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
              />
              <button
                type="submit"
                disabled={actionLoading.replyTicket}
                className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1"
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
        <div className="fixed inset-0 bg-typography-primary/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border max-w-md w-full space-y-4 shadow-level-3">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <h3 className="text-lg font-display font-bold text-typography-primary">
                {editingAddress ? 'Edit Delivery Address' : 'Add New Shipping Address'}
              </h3>
              <button onClick={() => setAddressModalOpen(false)} className="text-typography-muted hover:text-typography-primary">✕</button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-typography-primary mb-1 font-medium">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary mb-1 font-medium">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-typography-primary mb-1 font-medium">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-typography-primary mb-1 font-medium">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-typography-primary mb-1 font-medium">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-2.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary mb-1 font-medium">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-2.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary mb-1 font-medium">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-2.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-green-600 focus:ring-green-600/15"
                />
                <span className="text-typography-secondary text-xs">Set as default delivery address</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading.saveAddress}
                  className="flex-1 btn-primary font-bold py-2.5 text-xs"
                >
                  {actionLoading.saveAddress ? 'Saving Address...' : 'Save Shipping Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2.5 btn-secondary text-xs"
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
