import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, CheckCircle2, ArrowRight, AlertTriangle, PlusCircle, CreditCard, Lock, User, Loader2, Tag } from 'lucide-react';
import { customerApi, orderApi, authApi } from '../api';
import { useCart } from '../context/CartContext';
import MediaImage from '../components/MediaImage';
import AuthForm from '../components/AuthForm';
import PromoCodeSection from '../components/PromoCodeSection';
import IdentityConflictModal from '../components/IdentityConflictModal';
import IndianAddressForm from '../components/IndianAddressForm';
import { validateAddressForm as validateStrictAddressForm } from '../utils/validation';

export default function CheckoutPage({ user, setUser }) {
  const { cart, validateCart, fetchCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(true);

  // New Address Form State & Validation
  const [newAddress, setNewAddress] = useState({
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });
  const [addressFormErrors, setAddressFormErrors] = useState({});

  useEffect(() => {
    const initCheckout = async () => {
      setValidating(true);
      await fetchCart();
      const result = await validateCart();
      setValidationResult(result);
      setValidating(false);
    };
    initCheckout();

    if (user) {
      fetchAddresses();
      if (user.fullName || user.phone) {
        setNewAddress(prev => ({
          ...prev,
          recipientName: prev.recipientName || user.fullName || '',
          phone: prev.phone || user.phone || '',
        }));
      }
    }
  }, [user]);

  const runPreCheckoutValidation = async () => {
    setValidating(true);
    const result = await validateCart();
    setValidationResult(result);
    setValidating(false);
  };

  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const res = await customerApi.getAddresses();
      if (res.data && res.data.success) {
        const addrList = res.data.data;
        setAddresses(addrList);
        if (addrList.length > 0) {
          const defaultAddr = addrList.find(a => a.isDefault) || addrList[0];
          setSelectedAddressId(defaultAddr.id);
          setIsAddingAddress(false);
        } else {
          setIsAddingAddress(true);
        }
      }
    } catch (err) {
      console.warn('Could not load saved addresses:', err);
      setIsAddingAddress(true);
    } finally {
      setAddressLoading(false);
    }
  };

  const validateAddressForm = (addr) => {
    return validateStrictAddressForm(addr, { nameLabel: 'Recipient Name' });
  };

  const [guestAddress, setGuestAddress] = useState(null);

  const handleCreateAddress = async (e) => {
    if (e) e.preventDefault();
    setAddressFormErrors({});
    const errors = validateAddressForm(newAddress);
    if (Object.keys(errors).length > 0) {
      setAddressFormErrors(errors);
      return false;
    }

    const token = localStorage.getItem('sporekart_token');
    if (!token) {
      // Unauthenticated guest user: validate form and pass inline address object
      setIsAddingAddress(false);
      setSelectedAddressId('guest_inline');
      setGuestAddress(newAddress);
      return { isGuest: true, address: newAddress };
    }

    try {
      const res = await customerApi.addAddress(newAddress);
      if (res.data && res.data.success) {
        const created = res.data.data;
        setAddresses(prev => [...prev, created]);
        setSelectedAddressId(created.id);
        setIsAddingAddress(false);
        setNewAddress({ recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: true });

        // Refresh customer profile to reflect updated phone & name in user state
        try {
          const userRes = await authApi.getCurrentUser();
          if (userRes?.data?.success && setUser) {
            setUser(userRes.data.data);
          }
        } catch (uErr) {
          console.warn('Could not refresh user profile after adding address:', uErr);
        }

        return created;
      }
    } catch (err) {
      const status = err.response?.status;
      const errCode = err.response?.data?.error?.code;
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save address';
      if (status === 409 || errCode === 'DUPLICATE_IDENTITY_CONFLICT' || msg.toLowerCase().includes('already registered')) {
        const conflictVal = newAddress.alternatePhone || newAddress.phone;
        setConflictInfo({ isOpen: true, value: conflictVal, field: 'phone' });
        setAddressFormErrors({ alternatePhone: msg });
        return false;
      }
      if (status === 401 || status === 403) {
        // Fallback for guest/unauthenticated user
        setIsAddingAddress(false);
        setSelectedAddressId('guest_inline');
        setGuestAddress(newAddress);
        return { isGuest: true, address: newAddress };
      }
      setAddressFormErrors({ general: msg });
      return false;
    }
  };

  const [conflictInfo, setConflictInfo] = useState({ isOpen: false, value: '', field: 'phone' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginPreFill, setLoginPreFill] = useState('');

  const handlePlaceOrder = async () => {
    setAddressFormErrors({});
    let targetAddressId = selectedAddressId;
    let inlineShippingAddress = null;

    if (selectedAddressId === 'guest_inline' && guestAddress) {
      targetAddressId = null;
      inlineShippingAddress = guestAddress;
    } else if (isAddingAddress || !targetAddressId) {
      const addrResult = await handleCreateAddress();
      if (!addrResult) {
        return; // Validation or saving failed, block order submission
      }
      if (addrResult.isGuest) {
        targetAddressId = null;
        inlineShippingAddress = addrResult.address;
      } else {
        targetAddressId = addrResult.id;
      }
    }

    setSubmitting(true);
    try {
      const idempotencyKey = 'chk_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const payload = {
        addressId: targetAddressId,
        shippingAddress: inlineShippingAddress,
      };
      const res = await orderApi.createOrder(payload, idempotencyKey);
      if (res.data && res.data.success) {
        const orderData = res.data.data;
        await fetchCart();
        navigate(`/payment?type=order&id=${orderData.id}`);
      }
    } catch (err) {
      const status = err.response?.status;
      const errCode = err.response?.data?.error?.code;
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to place order';
      if (status === 409 || errCode === 'DUPLICATE_IDENTITY_CONFLICT') {
        const phoneVal = inlineShippingAddress?.phone || newAddress.phone || user?.phone || '';
        setConflictInfo({ isOpen: true, value: phoneVal, field: 'phone' });
      } else {
        alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (validating || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-forest-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-typography-secondary">Validating cart prices & stock availability...</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-forest-900 mb-2">Your cart is empty</h2>
        <p className="text-xs text-typography-secondary mb-6">Add items to cart before proceeding to checkout.</p>
        <button
          onClick={() => navigate('/products')}
          className="btn-primary px-6 py-3 shadow-level-1"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-forest-900">Secure Checkout</h1>
        <p className="text-sm text-typography-secondary mt-1">
          Complete your delivery details and confirm your order calculation.
        </p>

        <div className="flex items-center gap-2 sm:gap-4 mt-6 text-xs font-bold">
          <div className="flex items-center gap-2 text-forest-700">
            <span className="w-6 h-6 rounded-full bg-forest-700/10 border border-forest-700 flex items-center justify-center text-forest-700">1</span>
            <span>Shipping</span>
          </div>
          <span className="text-surface-border">──</span>
          <div className="flex items-center gap-2 text-typography-secondary">
            <span className="w-6 h-6 rounded-full bg-surface-neutral border border-surface-border flex items-center justify-center">2</span>
            <span>Review</span>
          </div>
          <span className="text-surface-border">──</span>
          <div className="flex items-center gap-2 text-typography-muted">
            <span className="w-6 h-6 rounded-full bg-surface-neutral border border-surface-border flex items-center justify-center">3</span>
            <span>Payment</span>
          </div>
        </div>
      </div>

      {validationResult && !validationResult.valid && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-card text-xs text-rose-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Cart Validation Warning</span>
          </div>
          {validationResult.errors?.map((err, idx) => (
            <p key={idx}>• {err}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1 & Step 2 Details */}
        <div className="lg:col-span-2 space-y-6">
          {!user ? (
            <div className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1">
              <AuthForm
                title="Customer Registration & Login Required"
                subtitle="Enter your mobile number or email to register your customer account and proceed to shipping details."
                setUser={setUser}
                onSuccess={(authData) => {
                  fetchCart();
                  fetchAddresses();
                  if (authData.fullName || authData.phone) {
                    setNewAddress(prev => ({
                      ...prev,
                      recipientName: prev.recipientName || authData.fullName || '',
                      phone: prev.phone || authData.phone || '',
                    }));
                  }
                }}
              />
            </div>
          ) : (
            /* Step 1: Address Selection / Creation */
            <div className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="text-lg font-display font-bold text-forest-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-forest-700" /> 1. Shipping Address
                </h3>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Add New Address
                  </button>
                )}
              </div>

            {addressLoading ? (
              <div className="p-8 text-center space-y-3">
                <Loader2 className="w-6 h-6 text-forest-700 animate-spin mx-auto" />
                <p className="text-xs text-typography-secondary font-medium">Loading address details...</p>
              </div>
            ) : isAddingAddress ? (
              <form onSubmit={handleCreateAddress} className="space-y-4 pt-2">
                {Object.keys(addressFormErrors).length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-input text-xs text-rose-700 space-y-1">
                    {Object.values(addressFormErrors).map((errMsg, idx) => (
                      <p key={idx}>• {errMsg}</p>
                    ))}
                  </div>
                )}

                <IndianAddressForm
                  formData={newAddress}
                  onChange={setNewAddress}
                  errors={addressFormErrors}
                  nameLabel="Recipient Name"
                  namePlaceholder="e.g. Suresh Kumar"
                  showDefaultCheckbox={true}
                  disabled={submitting}
                  primaryPhoneImmutable={Boolean(user?.phone)}
                  primaryEmailImmutable={Boolean(user?.email)}
                  onRequireLoginWithPhone={(phoneVal) =>
                    setConflictInfo({ isOpen: true, value: phoneVal, field: 'phone' })
                  }
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2.5 text-sm shadow-level-1"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="text-xs text-typography-muted hover:text-forest-900 px-4 py-2.5"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-card border cursor-pointer transition-all relative shadow-level-1 ${
                      selectedAddressId === addr.id
                        ? 'bg-surface-cream border-forest-700'
                        : 'bg-surface-white border-surface-border hover:border-forest-700/40'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-forest-900">
                      <span>{addr.recipientName}</span>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-4 h-4 text-forest-700" />
                      )}
                    </div>
                    <p className="text-xs text-typography-secondary mt-1">{addr.line1}, {addr.line2}</p>
                    <p className="text-xs text-typography-muted">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-[11px] text-forest-700 font-semibold mt-2">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Step 2: Items Review */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 shadow-level-1">
            <h3 className="text-lg font-display font-bold text-forest-900 pb-3 border-b border-surface-border">
              2. Order Items Review
            </h3>

            <div className="divide-y divide-surface-border">
              {cart.items.map((item) => (
                <div key={item.variantId || item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-input overflow-hidden bg-surface-cream border border-surface-border">
                      <MediaImage src={item.imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-forest-900">{item.productTitle}</h4>
                      <span className="text-xs text-forest-700">{item.variantName} × {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-forest-900 font-display">₹{item.lineTotalInr}</div>
                    <div className="text-[10px] text-typography-muted">₹{item.unitPriceInr} / unit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-surface-white p-6 sm:p-8 rounded-container border border-surface-border space-y-4 sticky top-24 shadow-level-2">
            <h3 className="text-lg font-display font-bold text-forest-900 pb-3 border-b border-surface-border flex items-center justify-between">
              <span>Payment Summary</span>
              <Lock className="w-4 h-4 text-forest-700" />
            </h3>

            {/* Promo Code Input & Available Coupons */}
            <PromoCodeSection />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-typography-secondary">
                <span>Items Subtotal ({cart.itemCount} items)</span>
                <span className="font-semibold text-forest-900 font-display">₹{cart.subtotalInr}</span>
              </div>
              <div className="flex justify-between text-typography-secondary">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-forest-900 font-display">₹{cart.gstTotalInr}</span>
              </div>
              <div className="flex justify-between text-typography-secondary">
                <span>Express Cold-Chain Delivery</span>
                {cart.shippingFeeInr > 0 ? (
                  <span className="font-semibold text-forest-900 font-display">₹{cart.shippingFeeInr}</span>
                ) : (
                  <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">FREE</span>
                )}
              </div>

              {cart.promoDiscountInr > 0 && (
                <div className="flex justify-between text-green-700 font-semibold bg-green-50/80 p-2.5 rounded-xl border border-green-200">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-green-600" />
                    <span>Promo Discount ({cart.appliedPromoCode})</span>
                  </span>
                  <span className="font-mono font-bold">- ₹{cart.promoDiscountInr}</span>
                </div>
              )}

              <div className="border-t border-surface-border pt-3 flex justify-between text-base font-bold text-forest-900">
                <span>Total Amount Payable</span>
                <span className="text-forest-700 text-2xl font-display">₹{cart.estimatedTotalInr}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!cart.valid || submitting || addressLoading}
              data-testid="checkout-button"
              className="w-full btn-primary disabled:opacity-50 py-4 shadow-level-1 flex items-center justify-center gap-2 mt-4"
            >
              <span>{submitting ? 'Placing Order...' : addressLoading ? 'Loading Address Details...' : 'Place Order Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-typography-muted pt-2">
              <CreditCard className="w-4 h-4 text-forest-700" />
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>PCI-DSS Razorpay Gateway Secured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Conflict FAANG Modal */}
      <IdentityConflictModal
        isOpen={conflictInfo.isOpen}
        onClose={() => setConflictInfo({ ...conflictInfo, isOpen: false })}
        conflictingValue={conflictInfo.value}
        conflictingField={conflictInfo.field}
        onOpenLogin={(val) => {
          setLoginPreFill(val);
          setShowAuthModal(true);
        }}
      />

      {/* Auth Modal Triggered from Conflict Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-forest-950/70 backdrop-blur-sm p-4">
          <div className="bg-surface-white border border-surface-border rounded-[24px] max-w-md w-full relative p-6 shadow-level-3">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-typography-muted hover:text-forest-900 p-2 rounded-full hover:bg-surface-cream"
            >
              ✕
            </button>
            <AuthForm
              initialIdentifier={loginPreFill}
              setUser={setUser}
              onSuccess={(authData) => {
                setShowAuthModal(false);
                setConflictInfo({ isOpen: false, value: '', field: 'phone' });
                if (setUser) setUser(authData);
                fetchCart();
                fetchAddresses();
              }}
              title="Log In to Registered Account"
              subtitle="Enter your verification code to access your linked Sporekart profile."
            />
          </div>
        </div>
      )}
    </div>
  );
}
