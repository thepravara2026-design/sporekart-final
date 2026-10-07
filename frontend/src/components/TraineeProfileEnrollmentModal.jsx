import React, { useState, useEffect } from 'react';
import { X, GraduationCap, UserCheck, MapPin, ShieldCheck, Sparkles, Loader2, Phone, Mail, User, Tag, Check, Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { customerApi, trainingApi, authApi } from '../api';
import IdentityConflictModal from './IdentityConflictModal';
import AuthForm from './AuthForm';
import IndianAddressForm from './IndianAddressForm';

import { validateAddressForm } from '../utils/validation';

export default function TraineeProfileEnrollmentModal({
  previewEnrollment,
  user,
  setUser,
  onClose,
  onSuccess,
}) {
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Promo & Offers State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [traineePromos, setTraineePromos] = useState([]);
  const [showTraineeOffersModal, setShowTraineeOffersModal] = useState(false);
  const [revealedTraineeCodes, setRevealedTraineeCodes] = useState({});
  const [copiedTraineeCode, setCopiedTraineeCode] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [conflictInfo, setConflictInfo] = useState({ isOpen: false, value: '', field: 'phone' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginPreFill, setLoginPreFill] = useState('');

  const loadTraineeProfile = async (overrideUser = null) => {
    setLoadingInitial(true);
    try {
      let currentUser = overrideUser || user;
      try {
        const userRes = await authApi.getCurrentUser();
        if (userRes?.data?.data) {
          currentUser = userRes.data.data;
          if (setUser) setUser(currentUser);
        }
      } catch (e) {
        console.warn('Could not refresh current user profile:', e);
      }

      let defaultAddr = null;
      try {
        const addrRes = await customerApi.getAddresses();
        const list = addrRes?.data?.data || [];
        if (list.length > 0) {
          defaultAddr = list.find(a => a.isDefault) || list[0];
        }
      } catch (e) {
        console.warn('Could not fetch user addresses:', e);
      }

      setProfileData({
        fullName: currentUser?.fullName || currentUser?.name || '',
        phone: currentUser?.phone || defaultAddr?.phone || '',
        email: currentUser?.email || '',
        line1: defaultAddr?.line1 || '',
        line2: defaultAddr?.line2 || '',
        city: defaultAddr?.city || '',
        state: defaultAddr?.state || '',
        pincode: defaultAddr?.pincode || '',
      });
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    const fetchTraineePromotions = async () => {
      try {
        const res = await trainingApi.getAvailableBatchPromotions();
        if (res?.data?.success && res.data.data?.length > 0) {
          setTraineePromos(res.data.data);
        } else {
          throw new Error('Fallback to default trainee promos');
        }
      } catch (err) {
        setTraineePromos([
          { code: 'MUSHROOM10', name: 'Mushroom Cultivation 10% Off', description: '10% discount dedicated for training masterclass batches', type: 'PERCENTAGE', discountValue: 10, minimumOrderValue: 500, targetAudience: 'TRAINEE' },
          { code: 'GLOBAL15', name: 'Universal Fungi Offer 15% Off', description: '15% discount eligible on store & courses', type: 'PERCENTAGE', discountValue: 15, minimumOrderValue: 350, targetAudience: 'BOTH' }
        ]);
      }
    };

    loadTraineeProfile();
    fetchTraineePromotions();
  }, []);

  const toggleRevealTraineeCode = (code) => {
    setRevealedTraineeCodes(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleCopyTraineeCode = (code, e) => {
    if (e) e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedTraineeCode(code);
    setTimeout(() => setCopiedTraineeCode(null), 2000);
  };

  const validateForm = () => {
    const errors = validateAddressForm(profileData, { checkEmail: true, requireEmail: true, nameLabel: 'Full Name' });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyPromo = async (codeToApply) => {
    const targetCode = (typeof codeToApply === 'string' ? codeToApply : promoCodeInput).trim();
    if (!targetCode || !previewEnrollment) return;
    setValidatingPromo(true);
    setPromoMessage('');
    try {
      const batchId = previewEnrollment.slot?.id;
      const courseId = previewEnrollment.course?.id;
      const res = await trainingApi.validateBatchPromotion(targetCode, batchId, courseId);
      const data = res?.data?.data;
      setPromoResult(data);
      if (data && data.valid) {
        setPromoCodeInput(targetCode);
        setPromoMessage(data.message || `Offer '${data.code}' applied successfully!`);
        setShowTraineeOffersModal(false);
      } else {
        setPromoMessage(data?.message || 'Invalid promo code for this batch.');
      }
    } catch (err) {
      setPromoMessage(err.response?.data?.message || 'Failed to validate promo code.');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // 1. Save mandatory user profile & default address to DB
      await customerApi.updateProfile({
        fullName: profileData.fullName.trim(),
        phone: profileData.phone.trim(),
        email: profileData.email.trim(),
        line1: profileData.line1.trim(),
        line2: profileData.line2 ? profileData.line2.trim() : '',
        city: profileData.city.trim(),
        state: profileData.state.trim(),
        pincode: profileData.pincode.trim(),
      });

      // Refresh current user state in App Context
      try {
        const refreshed = await authApi.getCurrentUser();
        if (refreshed?.data?.data && setUser) {
          setUser(refreshed.data.data);
        }
      } catch (e) {
        console.warn('Could not refresh user state after profile update:', e);
      }

      // 2. Reserve training slot / enrollment
      const activePromoCode = (promoResult && promoResult.valid) ? promoCodeInput.trim() : null;
      const slotId = previewEnrollment.slot?.id || previewEnrollment.course?.slots?.[0]?.id;
      if (!slotId) {
        throw new Error('No valid batch slot selected.');
      }

      const res = await trainingApi.bookSlot(slotId, activePromoCode);
      if (res.data && res.data.success) {
        const enrollmentData = res.data.data;
        if (onSuccess) {
          onSuccess(enrollmentData);
        }
      } else {
        setSubmitError('Unable to reserve seat slot. Please try again.');
      }
    } catch (err) {
      console.error('Enrollment & profile update failed:', err);
      const status = err.response?.status;
      const errCode = err.response?.data?.error?.code;
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save profile & process enrollment.';
      
      if (status === 409 || errCode === 'DUPLICATE_IDENTITY_CONFLICT') {
        const val = profileData.phone || profileData.email || '';
        const field = profileData.phone ? 'phone' : 'email';
        setConflictInfo({ isOpen: true, value: val, field: field });
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!previewEnrollment) return null;

  const courseTitle = previewEnrollment.course?.title || 'Masterclass';
  const feeInr = previewEnrollment.course?.priceInr || previewEnrollment.course?.feeInr || 0;
  const batchCode = previewEnrollment.slot?.batchCode || 'UPCOMING';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/45 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
        <div className="bg-surface-white border border-surface-border w-full max-w-2xl my-8 p-6 sm:p-8 rounded-[24px] relative shadow-level-3 space-y-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-typography-muted hover:text-forest-900 p-2 rounded-full hover:bg-surface-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-cream border border-surface-border rounded-input flex items-center justify-center text-forest-700 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-forest-700 tracking-wider">Trainee Registration & Verification</span>
              <h3 className="text-xl font-bold text-forest-900">Mandatory Trainee Profile & Address</h3>
            </div>
          </div>

          {/* Course & Slot Summary */}
          <div className="p-4 bg-surface-cream rounded-card border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="text-sm font-bold text-forest-900">{courseTitle}</h4>
              <span className="text-typography-secondary font-medium">Batch Code: <strong className="text-forest-900 font-mono">{batchCode}</strong></span>
            </div>
            <div className="text-right font-mono font-bold text-forest-800 text-sm">
              Tuition: ₹{feeInr.toLocaleString('en-IN')}
            </div>
          </div>

          {loadingInitial ? (
            <div className="py-12 text-center text-typography-muted flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-forest-700" />
              <span>Loading profile details...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-forest-900/5 border border-forest-900/15 rounded-card text-typography-secondary leading-relaxed">
                <span className="font-bold text-forest-900 block mb-0.5">📌 Mandatory Trainee Details Requirement:</span>
                Please fill out all mandatory fields below. These details will be permanently saved to your Sporekart profile for your masterclass certification, lab kit shipping, and future product purchases.
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-input text-rose-700 font-medium">
                  ⚠️ {submitError}
                </div>
              )}

              <IndianAddressForm
                formData={profileData}
                onChange={setProfileData}
                errors={formErrors}
                nameLabel="Full Name"
                namePlaceholder="e.g. Ramesh Kumar"
                showEmail={true}
                emailRequired={true}
                showDefaultCheckbox={false}
                disabled={submitting}
                primaryPhoneImmutable={Boolean(user?.phone)}
                primaryEmailImmutable={Boolean(user?.email)}
                onRequireLoginWithPhone={(phoneVal) =>
                  setConflictInfo({ isOpen: true, value: phoneVal, field: 'phone' })
                }
              />

              {/* Trainee Promo Code & Offers Section */}
              <div className="pt-3 border-t border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-forest-900 block">Trainee Promo Code / Discount Voucher</label>
                  <button
                    type="button"
                    onClick={() => setShowTraineeOffersModal(true)}
                    className="text-[11px] text-purple-700 font-bold hover:text-purple-900 flex items-center gap-1 bg-purple-100/80 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>View Trainee Offers</span>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. MUSHROOM10"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="flex-1 bg-surface-cream border border-surface-border rounded-input px-3 py-2 text-xs text-forest-900 focus:outline-none font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    disabled={validatingPromo || !promoCodeInput.trim()}
                    className="btn-secondary text-xs font-bold px-4 py-2 rounded-input disabled:opacity-50"
                  >
                    {validatingPromo ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-[11px] font-bold ${promoResult?.valid ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {promoMessage}
                  </p>
                )}
              </div>

              {promoResult && promoResult.valid && (
                <div className="flex justify-between text-emerald-700 font-bold border-t border-surface-border pt-2">
                  <span>Discount Applied ({promoResult.code})</span>
                  <span className="font-mono">-₹{promoResult.discountAmountInr}</span>
                </div>
              )}

              <div className="border-t border-surface-border pt-3 flex items-center justify-between font-bold text-sm">
                <span className="text-forest-900">Total Payable Amount</span>
                <span className="text-forest-700 font-mono text-base">
                  ₹{promoResult && promoResult.valid ? promoResult.finalAmountInr : feeInr.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3.5 font-bold shadow-level-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50 button-press"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Saving Profile & Reserving Seat...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" /> Save Profile & Proceed to Payment
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Trainee Offers Modal Overlay */}
      {showTraineeOffersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-surface-white rounded-card border border-surface-border p-5 max-w-md w-full space-y-4 shadow-level-3">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-typography-primary">
                    Trainee Batch Enrollment Coupons
                  </h3>
                  <p className="text-[11px] text-typography-muted">
                    Click to reveal promo code & apply to your registration
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowTraineeOffersModal(false)}
                className="text-typography-muted hover:text-typography-primary p-1 rounded-lg hover:bg-surface-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {traineePromos.length === 0 ? (
                <div className="text-center p-6 text-xs text-typography-muted">
                  No dedicated trainee coupons currently available.
                </div>
              ) : (
                traineePromos.map((p) => {
                  const isRevealed = revealedTraineeCodes[p.code];
                  const minFee = p.minimumOrderValue || 0;
                  const isEligible = feeInr >= minFee;
                  const isCurrentlyApplied = promoResult && promoResult.valid && promoResult.code?.toUpperCase() === p.code.toUpperCase();

                  return (
                    <div 
                      key={p.code}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isCurrentlyApplied 
                          ? 'bg-emerald-50/90 border-emerald-300' 
                          : isEligible 
                            ? 'bg-surface-white border-surface-border hover:border-purple-500/50 shadow-sm'
                            : 'bg-surface-cream/40 border-surface-border opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-forest-950">{p.name}</span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              🎓 Trainee Offer
                            </span>
                            {p.targetAudience === 'BOTH' && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🌐 Universal (Both)
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-[11px] text-typography-secondary mt-1">{p.description}</p>
                          )}
                        </div>

                        {isCurrentlyApplied && (
                          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-md shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Code Masking / Copy & Apply Section */}
                      <div className="bg-surface-cream/70 border border-dashed border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          {isRevealed ? (
                            <span className="font-mono font-extrabold text-sm text-purple-950 tracking-wider select-all truncate">
                              {p.code}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-typography-muted tracking-widest select-none">
                              ••••••••
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Copy Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              if (!isRevealed) toggleRevealTraineeCode(p.code);
                              handleCopyTraineeCode(p.code, e);
                            }}
                            className="text-[11px] font-bold text-purple-900 hover:bg-purple-100 flex items-center gap-1 bg-surface-white px-2.5 py-1 rounded-lg border border-purple-300 transition-colors shadow-xs"
                            title="Copy Promo Code"
                          >
                            {copiedTraineeCode === p.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-purple-700" />}
                            <span>{copiedTraineeCode === p.code ? 'Copied!' : 'Copy'}</span>
                          </button>

                          {/* Reveal/Hide Button */}
                          <button
                            type="button"
                            onClick={() => toggleRevealTraineeCode(p.code)}
                            className="text-[11px] font-bold text-typography-muted hover:text-typography-primary p-1 rounded-lg border border-surface-border bg-surface-white"
                            title={isRevealed ? 'Hide Code' : 'Reveal Code'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-purple-600" />}
                          </button>
                        </div>
                      </div>

                      {/* Real-time Eligibility Details & Direct Apply Button */}
                      <div className="pt-1 border-t border-surface-border text-[11px] space-y-2">
                        <div className={`p-2 rounded-lg flex items-center justify-between gap-2 ${
                          isEligible ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isEligible ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span className="font-semibold truncate">
                              {isEligible 
                                ? 'Eligible for this batch enrollment!'
                                : `Minimum fee of ₹${minFee} required for this coupon.`}
                            </span>
                          </div>

                          {!isCurrentlyApplied && (
                            <button
                              type="button"
                              onClick={() => handleApplyPromo(p.code)}
                              disabled={!isEligible || validatingPromo}
                              className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                                isEligible 
                                  ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm'
                                  : 'bg-surface-neutral text-typography-muted cursor-not-allowed opacity-60'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>{validatingPromo ? 'Applying...' : 'Apply Coupon'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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
              onSuccess={async (authData) => {
                setShowAuthModal(false);
                setConflictInfo({ isOpen: false, value: '', field: 'phone' });
                setSubmitError('');
                if (setUser) setUser(authData);
                await loadTraineeProfile(authData);
              }}
              title="Log In to Registered Account"
              subtitle="Enter your verification code to access your linked Sporekart profile."
            />
          </div>
        </div>
      )}
    </>
  );
}
