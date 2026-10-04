import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, Calendar, Clock, MapPin, CheckCircle, Video, Award, 
  ChevronDown, ChevronUp, X, ShieldCheck, ArrowRight, UserCheck, Loader2,
  Tag, Sparkles, Eye, EyeOff, AlertTriangle, Check, Copy
} from 'lucide-react';
import { trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import PageSkeleton from '../components/PageSkeleton';
import AuthForm from '../components/AuthForm';

export default function TrainingPage({ user, setUser }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await trainingApi.getCourses();
        if (res?.data?.data) {
          setCourses(res.data.data);
        } else if (Array.isArray(res?.data)) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error('Failed to load training courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Authentication & Preview Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [previewEnrollment, setPreviewEnrollment] = useState(null); // { course, slot }
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [reserving, setReserving] = useState(false);
  const [traineePromos, setTraineePromos] = useState([]);
  const [showTraineeOffersModal, setShowTraineeOffersModal] = useState(false);
  const [revealedTraineeCodes, setRevealedTraineeCodes] = useState({});
  const [copiedTraineeCode, setCopiedTraineeCode] = useState(null);

  const fetchTraineePromotions = async () => {
    try {
      const res = await trainingApi.getAvailableBatchPromotions();
      if (res?.data?.success) {
        setTraineePromos(res.data.data || []);
      }
    } catch (err) {
      setTraineePromos([
        { code: 'MUSHROOM10', name: 'Mushroom Cultivation 10% Off', description: '10% discount dedicated for training masterclass batches', type: 'PERCENTAGE', discountValue: 10, minimumOrderValue: 500, targetAudience: 'TRAINEE' },
        { code: 'GLOBAL15', name: 'Universal Fungi Offer 15% Off', description: '15% discount eligible on store & courses', type: 'PERCENTAGE', discountValue: 15, minimumOrderValue: 350, targetAudience: 'BOTH' }
      ]);
    }
  };

  const initiateEnrollment = (course, slot) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const targetSlot = slot || (course.slots && course.slots.length > 0 ? course.slots[0] : null);
    setPreviewEnrollment({ course, slot: targetSlot });
    setPromoCodeInput('');
    setPromoResult(null);
    setPromoMessage('');
    fetchTraineePromotions();
  };

  const toggleRevealTraineeCode = (promoCode) => {
    setRevealedTraineeCodes(prev => ({
      ...prev,
      [promoCode]: !prev[promoCode]
    }));
  };

  const handleCopyTraineeCode = (promoCode, e) => {
    if (e) e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(promoCode);
    }
    setCopiedTraineeCode(promoCode);
    setTimeout(() => setCopiedTraineeCode(null), 2000);
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

  const handleConfirmAndPay = async () => {
    if (!previewEnrollment || !previewEnrollment.slot) {
      setBookingError('No valid batch slot selected.');
      return;
    }

    setReserving(true);
    setBookingError('');

    try {
      const activePromoCode = (promoResult && promoResult.valid) ? promoCodeInput.trim() : null;
      const res = await trainingApi.bookSlot(previewEnrollment.slot.id, activePromoCode);
      if (res.data && res.data.success) {
        const enrollmentData = res.data.data;
        setPreviewEnrollment(null);
        setPromoResult(null);
        setPromoCodeInput('');
        setPromoMessage('');
        navigate(`/payment?type=enrollment&id=${enrollmentData.id}`);
      } else {
        setBookingError('Unable to reserve seat slot. Please try again.');
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to reserve seat slot.');
    } finally {
      setReserving(false);
    }
  };

  const courseSchemas = courses.map((c) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": c.title,
    "description": c.description,
    "provider": {
      "@type": "Organization",
      "name": "Sporekart Agritech Center",
      "sameAs": "https://sporekart.in"
    },
    "courseCode": c.slug,
    "offers": {
      "@type": "Offer",
      "price": c.priceInr || c.feeInr,
      "priceCurrency": "INR"
    }
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in text-forest-900">
      <SeoHead
        title="Mushroom Cultivation & Spawn Production Training Masterclasses | Sporekart"
        description="Enroll in certified commercial mushroom cultivation and pure grain spawn lab workshops. Hands-on online & laboratory training with market buyback support in India."
        canonicalUrl="https://sporekart.in/training"
        structuredData={courseSchemas}
      />

      <Breadcrumbs items={[{ label: 'Training Masterclasses', path: '/training' }]} />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-surface-cream border border-surface-border text-forest-700 text-xs font-semibold shadow-level-1">
          <GraduationCap className="w-4 h-4 text-forest-700" />
          <span>Govt. & Agritech Industry Aligned Certification</span>
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-forest-900">
          Certified Mushroom Cultivation & <br />
          <span className="text-soil">Spawn Lab Masterclasses</span>
        </h1>
        <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
          Master commercial mushroom production, substrate formulation, lab tissue culture, and market buyback protocols. Taught by senior agronomists with live practical sessions.
        </p>
      </div>

      {/* Masterclass Courses List */}
      {loading ? (
        <PageSkeleton type="cards" count={2} />
      ) : (
        <div className="space-y-8">
          {courses.map((course) => {
            const syllabus = course.syllabusJson ? JSON.parse(course.syllabusJson) : [];
            const isExpanded = expandedCourse === course.id;
            const fee = course.priceInr || course.feeInr;

            return (
              <div key={course.id} className="bg-surface-white rounded-container p-6 sm:p-8 border border-surface-border shadow-level-1 hover-lift">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Course Metadata & Curriculum */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-pill text-[11px] font-bold uppercase tracking-wider ${course.mode === 'ONLINE' ? 'bg-forest-700/10 text-forest-700 border border-forest-700/30' : 'bg-green-600/10 text-green-600 border border-green-600/30'}`}>
                        {course.mode === 'ONLINE' ? <Video className="w-3.5 h-3.5 inline mr-1" /> : <MapPin className="w-3.5 h-3.5 inline mr-1" />}
                        {course.mode || 'ONLINE'} WORKSHOP
                      </span>
                      <span className="px-3 py-1 bg-surface-cream text-forest-800 text-[11px] font-bold rounded-pill border border-surface-border">
                        {course.category || 'Agri-Tech'}
                      </span>
                    </div>

                    <Link to={`/training/${course.slug}`} className="block group">
                      <h2 className="font-display font-bold text-2xl text-forest-900 group-hover:text-forest-700 transition-colors">
                        {course.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-typography-secondary leading-relaxed">{course.description}</p>

                    <div className="flex items-center gap-6 text-xs text-typography-muted pt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-forest-700" />
                        <span>{course.durationHours || 28} Hours Intensive</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-gold" />
                        <span>Certified Masterclass</span>
                      </div>
                    </div>

                    {syllabus.length > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                          className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 button-press"
                        >
                          {isExpanded ? 'Hide Curriculum Modules' : 'View Curriculum Modules'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <ul className="mt-3 space-y-2 bg-surface-cream p-4 rounded-card border border-surface-border text-xs text-typography-secondary animate-fade-in">
                            {syllabus.map((module, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                                <span>{module}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pricing & Batch Slots */}
                  <div className="lg:col-span-5 bg-surface-cream rounded-card p-6 border border-surface-border flex flex-col justify-between space-y-6 shadow-level-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-typography-muted block font-medium">Masterclass Fee</span>
                        <div className="text-3xl font-bold text-soil font-display">₹{fee?.toLocaleString('en-IN')}</div>
                      </div>

                      <button
                        onClick={() => initiateEnrollment(course, null)}
                        className="btn-primary font-bold px-5 py-3 text-xs shadow-level-1 flex items-center gap-1.5"
                      >
                        <span>Enroll Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-forest-700" /> Available Batch Slots
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {course.slots && course.slots.length > 0 ? (
                          course.slots.map((slot) => (
                            <div key={slot.id} className="p-3 rounded-input bg-surface-white border border-surface-border flex items-center justify-between text-xs shadow-level-1">
                              <div>
                                <p className="font-bold text-forest-900 font-mono">
                                  {slot.batchCode}
                                </p>
                                <p className="text-[10px] text-typography-muted">
                                  {slot.startDate ? new Date(slot.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming'} • {slot.availableSeats} seats left
                                </p>
                              </div>

                              <button
                                onClick={() => initiateEnrollment(course, slot)}
                                disabled={!slot.isAvailable}
                                className="btn-secondary font-bold px-3 py-1.5 text-xs button-press disabled:opacity-50"
                              >
                                {slot.isAvailable ? 'Select Slot' : 'Full'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-typography-muted">Auto-assigning next open batch upon enrollment.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 2: Auth Modal for Unauthenticated Users */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-white w-full max-w-md p-6 sm:p-8 rounded-[24px] relative border border-surface-border shadow-level-3 animate-scale-in">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-typography-muted hover:text-forest-900 p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <AuthForm
              title="Trainee Registration & Login"
              subtitle="Enter your mobile number, email, or Google Auth to register your account and complete masterclass enrollment."
              setUser={setUser}
              onSuccess={() => {
                setShowAuthModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Step 3: Enrollment Preview & Seat Reservation Modal */}
      {previewEnrollment && !showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-white border border-surface-border w-full max-w-lg p-6 sm:p-8 rounded-[24px] relative shadow-level-3 space-y-6">
            <button
              onClick={() => setPreviewEnrollment(null)}
              className="absolute top-4 right-4 text-typography-muted hover:text-forest-900 p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-cream border border-surface-border rounded-input flex items-center justify-center text-forest-700">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-forest-700 tracking-wider">Step 1 of 2: Seat Reservation</span>
                <h3 className="text-xl font-bold text-forest-900">Enrollment Preview</h3>
              </div>
            </div>

            {/* Course & Slot Summary */}
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-2">
              <h4 className="text-base font-bold text-forest-900">{previewEnrollment.course.title}</h4>
              <div className="flex flex-wrap items-center gap-4 text-xs text-typography-secondary">
                <span>Batch Code: <strong className="text-forest-900 font-mono">{previewEnrollment.slot?.batchCode || 'UPCOMING'}</strong></span>
                <span>Seats Left: <strong className="text-green-600 font-bold">{previewEnrollment.slot?.availableSeats || 30}</strong></span>
              </div>
            </div>

            {/* Trainee Account Profile Details */}
            <div className="p-4 bg-surface-cream rounded-card border border-surface-border space-y-2">
              <span className="text-[10px] text-typography-muted font-semibold uppercase flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-forest-700" /> Trainee Account Profile
              </span>
              <p className="text-xs font-bold text-forest-900">{user?.fullName || user?.name || 'Registered Trainee'}</p>
              <p className="text-xs text-typography-secondary">{user?.email || user?.phone || 'Account unified'}</p>
            </div>

            {/* Fee Breakdown */}
            <div className="border-t border-surface-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-typography-secondary">
                <span>Masterclass Tuition Fee</span>
                <span className="text-forest-900 font-mono">₹{(previewEnrollment.course.priceInr || previewEnrollment.course.feeInr)?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-typography-secondary">
                <span>Lab Material Kit & Certification</span>
                <span className="text-green-600 font-bold">INCLUDED</span>
              </div>

              {/* Promo Code Input Section */}
              <div className="pt-2 border-t border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-forest-900 block">Promo Code / Voucher</label>
                  <button
                    type="button"
                    onClick={() => setShowTraineeOffersModal(true)}
                    className="text-[10px] text-purple-700 font-bold hover:text-purple-900 flex items-center gap-1 bg-purple-100/70 hover:bg-purple-100 px-2 py-0.5 rounded-lg transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span>View Trainee Offers</span>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. MUSHROOM10"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="flex-1 bg-surface-cream border border-surface-border rounded-xl px-3 py-1.5 text-xs text-forest-900 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    disabled={validatingPromo || !promoCodeInput.trim()}
                    className="btn-secondary text-xs font-bold px-3.5 py-1.5 rounded-xl disabled:opacity-50"
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
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount Applied ({promoResult.code})</span>
                  <span className="font-mono">-₹{promoResult.discountAmountInr}</span>
                </div>
              )}

              <div className="border-t border-surface-border pt-2 flex justify-between text-sm font-bold text-forest-900">
                <span>Total Amount Payable</span>
                <span className="text-forest-700 font-mono">
                  ₹{promoResult && promoResult.valid
                    ? promoResult.finalAmountInr
                    : (previewEnrollment.course.priceInr || previewEnrollment.course.feeInr)?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {bookingError && (
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-input border border-rose-200">
                {bookingError}
              </p>
            )}

            <button
              onClick={handleConfirmAndPay}
              disabled={reserving}
              className="w-full btn-primary font-bold py-3.5 px-6 shadow-level-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {reserving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Reserving Seat...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" /> Confirm Seat & Proceed to Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Amazon / Flipkart Style Trainee Offers Modal */}
      {showTraineeOffersModal && previewEnrollment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
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
                    Click to reveal promo code & check batch eligibility
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
                  const courseFee = previewEnrollment.course.priceInr || previewEnrollment.course.feeInr || 0;
                  const minFee = p.minimumOrderValue || 0;
                  const isEligible = courseFee >= minFee;
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
                              onClick={() => {
                                setPromoCodeInput(p.code);
                                handleApplyPromo(p.code);
                                setShowTraineeOffersModal(false);
                              }}
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
    </div>
  );
}
