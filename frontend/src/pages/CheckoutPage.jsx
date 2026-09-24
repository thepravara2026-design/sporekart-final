import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, CheckCircle2, ArrowRight, AlertTriangle, PlusCircle, CreditCard, Lock, User } from 'lucide-react';
import { customerApi, orderApi } from '../api';
import { useCart } from '../context/CartContext';
import MediaImage from '../components/MediaImage';
import AuthForm from '../components/AuthForm';

export default function CheckoutPage({ user, setUser }) {
  const { cart, validateCart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [, setAddressLoading] = useState(false);
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
    runPreCheckoutValidation();
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
    const errors = {};
    if (!addr.recipientName || !addr.recipientName.trim()) {
      errors.recipientName = 'Recipient name is required';
    }
    if (!addr.phone || !addr.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+ \-()]{8,15}$/.test(addr.phone.trim())) {
      errors.phone = 'Phone number must be 8-15 digits (e.g., +91 9876543210)';
    }
    if (!addr.line1 || !addr.line1.trim()) {
      errors.line1 = 'Address line 1 is required';
    }
    if (!addr.city || !addr.city.trim()) {
      errors.city = 'City is required';
    }
    if (!addr.state || !addr.state.trim()) {
      errors.state = 'State is required';
    }
    if (!addr.pincode || !addr.pincode.trim()) {
      errors.pincode = 'PIN code is required';
    } else if (!/^[1-9][0-9]{5}$/.test(addr.pincode.trim())) {
      errors.pincode = 'PIN code must be a valid 6-digit Indian postal code (e.g. 110001)';
    }
    return errors;
  };

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
        return created;
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        // Fallback for guest/unauthenticated user
        setIsAddingAddress(false);
        setSelectedAddressId('guest_inline');
        return { isGuest: true, address: newAddress };
      }
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to add address';
      setAddressFormErrors({ general: msg });
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    setAddressFormErrors({});
    let targetAddressId = selectedAddressId;
    let inlineShippingAddress = null;

    if (isAddingAddress || !targetAddressId || targetAddressId === 'guest_inline') {
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
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-spore-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Validating cart prices & stock availability...</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
        <p className="text-xs text-slate-400 mb-6">Add items to cart before proceeding to checkout.</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all button-press"
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
        <h1 className="text-3xl font-display font-extrabold text-white">Secure Checkout</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete your delivery details and confirm your order calculation.
        </p>

        <div className="flex items-center gap-2 sm:gap-4 mt-6 text-xs font-bold">
          <div className="flex items-center gap-2 text-spore-400">
            <span className="w-6 h-6 rounded-full bg-spore-500/20 border border-spore-400 flex items-center justify-center text-spore-400">1</span>
            <span>Shipping</span>
          </div>
          <span className="text-slate-700">──</span>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">2</span>
            <span>Review</span>
          </div>
          <span className="text-slate-700">──</span>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">3</span>
            <span>Payment</span>
          </div>
        </div>
      </div>

      {validationResult && !validationResult.valid && (
        <div className="mb-8 p-4 bg-rose-950/60 border border-rose-800/60 rounded-2xl text-xs text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
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
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 space-y-4">
              <AuthForm
                title="Customer Registration & Login Required"
                subtitle="Enter your mobile number or email to register your customer account and proceed to shipping details."
                setUser={setUser}
                onSuccess={(authData) => {
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
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-spore-800/60">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-spore-400" /> 1. Shipping Address
                </h3>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs font-semibold text-spore-400 hover:text-spore-300 flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Add New Address
                  </button>
                )}
              </div>

            {isAddingAddress ? (
              <form onSubmit={handleCreateAddress} className="space-y-4 pt-2">
                {Object.keys(addressFormErrors).length > 0 && (
                  <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300 space-y-1">
                    {Object.values(addressFormErrors).map((errMsg, idx) => (
                      <p key={idx}>• {errMsg}</p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={newAddress.recipientName}
                      onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                      className={`w-full bg-slate-900/90 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none ${
                        addressFormErrors.recipientName ? 'border-rose-500 focus:border-rose-400' : 'border-spore-700/50 focus:border-spore-400'
                      }`}
                    />
                    {addressFormErrors.recipientName && (
                      <p className="text-[11px] text-rose-400 mt-1">{addressFormErrors.recipientName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={newAddress.phone}
                      onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className={`w-full bg-slate-900/90 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none ${
                        addressFormErrors.phone ? 'border-rose-500 focus:border-rose-400' : 'border-spore-700/50 focus:border-spore-400'
                      }`}
                    />
                    {addressFormErrors.phone && (
                      <p className="text-[11px] text-rose-400 mt-1">{addressFormErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={newAddress.line1}
                    onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })}
                    className={`w-full bg-slate-900/90 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none ${
                      addressFormErrors.line1 ? 'border-rose-500 focus:border-rose-400' : 'border-spore-700/50 focus:border-spore-400'
                    }`}
                  />
                  {addressFormErrors.line1 && (
                    <p className="text-[11px] text-rose-400 mt-1">{addressFormErrors.line1}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={newAddress.line2}
                    onChange={e => setNewAddress({ ...newAddress, line2: e.target.value })}
                    className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-spore-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                      className={`w-full bg-slate-900/90 border rounded-xl px-3 py-2 text-white text-sm focus:outline-none ${
                        addressFormErrors.city ? 'border-rose-500 focus:border-rose-400' : 'border-spore-700/50 focus:border-spore-400'
                      }`}
                    />
                    {addressFormErrors.city && (
                      <p className="text-[11px] text-rose-400 mt-1">{addressFormErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                      className={`w-full bg-slate-900/90 border rounded-xl px-3 py-2 text-white text-sm focus:outline-none ${
                        addressFormErrors.state ? 'border-rose-500 focus:border-rose-400' : 'border-spore-700/50 focus:border-spore-400'
                      }`}
                    />
                    {addressFormErrors.state && (
                      <p className="text-[11px] text-rose-400 mt-1">{addressFormErrors.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6 digits"
                      value={newAddress.pincode}
                      onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className={`w-full bg-slate-900/90 border rounded-xl px-3 py-2 text-white text-sm focus:outline-none ${
                        addressFormErrors.pincode ? 'border-rose-500 focus:border-rose-400' : 'border-spore-700/50 focus:border-spore-400'
                      }`}
                    />
                    {addressFormErrors.pincode && (
                      <p className="text-[11px] text-rose-400 mt-1">{addressFormErrors.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all button-press"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="text-xs text-slate-400 hover:text-white px-4 py-2.5"
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
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                      selectedAddressId === addr.id
                        ? 'bg-spore-950/80 border-spore-400 shadow-lg shadow-spore-950/50'
                        : 'bg-slate-950/40 border-spore-800/40 hover:border-spore-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-white">
                      <span>{addr.recipientName}</span>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-4 h-4 text-spore-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{addr.line1}, {addr.line2}</p>
                    <p className="text-xs text-slate-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-[11px] text-spore-300 mt-2">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Step 2: Items Review */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 space-y-4">
            <h3 className="text-lg font-display font-bold text-white pb-3 border-b border-spore-800/60">
              2. Order Items Review
            </h3>

            <div className="divide-y divide-spore-800/40">
              {cart.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-spore-800/40">
                      <MediaImage src={item.imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.productTitle}</h4>
                      <span className="text-xs text-spore-400">{item.variantName} × {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white font-display">₹{item.lineTotalInr}</div>
                    <div className="text-[10px] text-slate-400">₹{item.unitPriceInr} / unit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 space-y-4 sticky top-24 shadow-2xl">
            <h3 className="text-lg font-display font-bold text-white pb-3 border-b border-spore-800/60 flex items-center justify-between">
              <span>Payment Summary</span>
              <Lock className="w-4 h-4 text-spore-400" />
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-semibold text-white font-display">₹{cart.subtotalInr}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-white font-display">₹{cart.gstTotalInr}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shiprocket Express Delivery</span>
                <span className="text-spore-400 font-medium">FREE</span>
              </div>

              <div className="border-t border-spore-800/60 pt-3 flex justify-between text-base font-extrabold text-white">
                <span>Total Amount Payable</span>
                <span className="text-spore-400 text-2xl font-display">₹{cart.estimatedTotalInr}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!cart.valid || submitting}
              data-testid="checkout-button"
              className="w-full bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-4 rounded-2xl shadow-xl shadow-spore-950/60 flex items-center justify-center gap-2 transition-all button-press hover-lift mt-4"
            >
              <span>{submitting ? 'Placing Order...' : 'Place Order Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
              <CreditCard className="w-4 h-4 text-spore-400" />
              <ShieldCheck className="w-4 h-4 text-spore-400" />
              <span>PCI-DSS Razorpay Gateway Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
