import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Truck, CheckCircle2, ArrowRight, AlertTriangle, Plus, PlusCircle } from 'lucide-react';
import { customerApi, orderApi } from '../api';
import MediaImage from '../components/MediaImage';

export default function CheckoutPage() {
  const { cart, validateCart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(true);

  // New Address Form State
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

  useEffect(() => {
    runPreCheckoutValidation();
    fetchAddresses();
  }, []);

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

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await customerApi.addAddress(newAddress);
      if (res.data && res.data.success) {
        const created = res.data.data;
        setAddresses(prev => [...prev, created]);
        setSelectedAddressId(created.id);
        setIsAddingAddress(false);
        setNewAddress({ recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: true });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && !isAddingAddress) {
      alert('Please select or add a delivery address');
      return;
    }
    setSubmitting(true);
    try {
      const idempotencyKey = 'chk_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const payload = {
        addressId: selectedAddressId,
        shippingAddress: selectedAddressId ? null : newAddress,
      };
      const res = await orderApi.createOrder(payload, idempotencyKey);
      if (res.data && res.data.success) {
        const orderData = res.data.data;
        await fetchCart();
        alert(`Order ${orderData.orderNumber} placed successfully!`);
        navigate('/dashboard');
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-spore-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
          className="bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-white">Checkout</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete your delivery details and review order calculation.
        </p>
      </div>

      {validationResult && !validationResult.valid && (
        <div className="mb-8 p-4 bg-red-950/60 border border-red-800/60 rounded-2xl text-xs text-red-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-red-400" />
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
          {/* Step 1: Address Selection / Creation */}
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={newAddress.recipientName}
                      onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                      className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-spore-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={newAddress.phone}
                      onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-spore-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={newAddress.line1}
                    onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-spore-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={newAddress.line2}
                    onChange={e => setNewAddress({ ...newAddress, line2: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-spore-400"
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
                      className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-spore-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-spore-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newAddress.pincode}
                      onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-spore-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
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

          {/* Step 2: Items Review */}
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="text-lg font-display font-bold text-white pb-3 border-b border-spore-800/60">
              2. Order Items Review
            </h3>

            <div className="divide-y divide-spore-800/40">
              {cart.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-spore-800/40">
                      <MediaImage src={item.imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.productTitle}</h4>
                      <span className="text-xs text-spore-400">{item.variantName} × {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">₹{item.lineTotalInr}</div>
                    <div className="text-[10px] text-slate-400">₹{item.unitPriceInr} / unit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4 sticky top-24">
            <h3 className="text-lg font-display font-bold text-white pb-3 border-b border-spore-800/60">
              Payment Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-semibold text-white">₹{cart.subtotalInr}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-white">₹{cart.gstTotalInr}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shiprocket Express Delivery</span>
                <span className="text-spore-400 font-medium">FREE</span>
              </div>

              <div className="border-t border-spore-800/60 pt-3 flex justify-between text-base font-extrabold text-white">
                <span>Total Amount Payable</span>
                <span className="text-spore-400 text-xl">₹{cart.estimatedTotalInr}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!cart.valid || submitting}
              className="w-full bg-gradient-to-r from-spore-500 to-spore-600 hover:from-spore-400 hover:to-spore-500 disabled:opacity-50 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>{submitting ? 'Placing Order...' : 'Place Order Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-spore-400" />
              <span>256-bit Encrypted SSL Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
