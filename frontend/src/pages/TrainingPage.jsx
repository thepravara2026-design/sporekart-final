import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, Calendar, Clock, MapPin, CheckCircle, Video, Award, 
  ChevronDown, ChevronUp, X, ShieldCheck, ArrowRight, UserCheck, Loader2
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

  // Authentication & Preview Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [previewEnrollment, setPreviewEnrollment] = useState(null); // { course, slot }
  const [bookingError, setBookingError] = useState('');
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await trainingApi.getCourses();
      setCourses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load training courses', err);
    } finally {
      setLoading(false);
    }
  };

  const initiateEnrollment = (course, slot) => {
    setBookingError('');
    const targetSlot = slot || (course.slots && course.slots.length > 0 ? course.slots[0] : null);

    if (!user && !localStorage.getItem('sporekart_token')) {
      setPreviewEnrollment({ course, slot: targetSlot });
      setShowAuthModal(true);
      return;
    }

    setPreviewEnrollment({ course, slot: targetSlot });
  };

  const handleConfirmAndPay = async () => {
    if (!previewEnrollment || !previewEnrollment.slot) {
      setBookingError('No valid batch slot selected.');
      return;
    }

    setReserving(true);
    setBookingError('');

    try {
      const res = await trainingApi.bookSlot(previewEnrollment.slot.id);
      if (res.data && res.data.success) {
        const enrollmentData = res.data.data;
        setPreviewEnrollment(null);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in text-slate-900">
      <SeoHead
        title="Mushroom Cultivation & Spawn Production Training Masterclasses | Sporekart"
        description="Enroll in certified commercial mushroom cultivation and pure grain spawn lab workshops. Hands-on online & laboratory training with market buyback support in India."
        canonicalUrl="https://sporekart.in/training"
        structuredData={courseSchemas}
      />

      <Breadcrumbs items={[{ label: 'Training Masterclasses', path: '/training' }]} />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-[#16532f] text-xs font-semibold shadow-sm">
          <GraduationCap className="w-4 h-4 text-[#16532f]" />
          <span>Govt. & Agritech Industry Aligned Certification</span>
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900">
          Certified Mushroom Cultivation & <br />
          <span className="gradient-text">Spawn Lab Masterclasses</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
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
              <div key={course.id} className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl hover-lift bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Course Metadata & Curriculum */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider ${course.mode === 'ONLINE' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-emerald-50 text-[#16532f] border border-emerald-200'}`}>
                        {course.mode === 'ONLINE' ? <Video className="w-3.5 h-3.5 inline mr-1" /> : <MapPin className="w-3.5 h-3.5 inline mr-1" />}
                        {course.mode || 'ONLINE'} WORKSHOP
                      </span>
                      <span className="px-3 py-1 bg-emerald-50 text-[#16532f] text-[11px] font-bold rounded-xl border border-emerald-200">
                        {course.category || 'Agri-Tech'}
                      </span>
                    </div>

                    <Link to={`/training/${course.slug}`} className="block group">
                      <h2 className="font-display font-extrabold text-2xl text-slate-900 group-hover:text-[#16532f] transition-colors">
                        {course.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{course.description}</p>

                    <div className="flex items-center gap-6 text-xs text-slate-600 pt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#16532f]" />
                        <span>{course.durationHours || 28} Hours Intensive</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>Certified Masterclass</span>
                      </div>
                    </div>

                    {syllabus.length > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                          className="text-xs font-bold text-[#16532f] hover:text-[#124426] flex items-center gap-1 button-press"
                        >
                          {isExpanded ? 'Hide Curriculum Modules' : 'View Curriculum Modules'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <ul className="mt-3 space-y-2 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-700 animate-fade-in">
                            {syllabus.map((module, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-[#16532f] shrink-0" />
                                <span>{module}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pricing & Batch Slots */}
                  <div className="lg:col-span-5 bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 flex flex-col justify-between space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-600 block font-medium">Masterclass Fee</span>
                        <div className="text-3xl font-black text-[#16532f] font-display">₹{fee?.toLocaleString('en-IN')}</div>
                      </div>

                      <button
                        onClick={() => initiateEnrollment(course, null)}
                        className="bg-[#16532f] hover:bg-[#124426] text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-md transition-all button-press flex items-center gap-1.5"
                      >
                        <span>Enroll Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#16532f]" /> Available Batch Slots
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {course.slots && course.slots.length > 0 ? (
                          course.slots.map((slot) => (
                            <div key={slot.id} className="p-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-900 font-mono">
                                  {slot.batchCode}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                  {slot.startDate ? new Date(slot.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming'} • {slot.availableSeats} seats left
                                </p>
                              </div>

                              <button
                                onClick={() => initiateEnrollment(course, slot)}
                                disabled={!slot.isAvailable}
                                className="bg-emerald-100 hover:bg-emerald-200 text-[#16532f] border border-emerald-300 font-bold px-3 py-1.5 rounded-xl text-xs transition-all button-press disabled:opacity-50"
                              >
                                {slot.isAvailable ? 'Select Slot' : 'Full'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">Auto-assigning next open batch upon enrollment.</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl relative border border-emerald-200 shadow-2xl animate-scale-in bg-white">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"
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

      {/* Step 3: FAANG-Grade Enrollment Preview & Seat Reservation Modal */}
      {previewEnrollment && !showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white border border-emerald-100 w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-6 text-slate-900">
            <button
              onClick={() => setPreviewEnrollment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center text-[#16532f]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#16532f] tracking-wider">Step 1 of 2: Seat Reservation</span>
                <h3 className="text-xl font-bold text-slate-900">Enrollment Preview</h3>
              </div>
            </div>

            {/* Course & Slot Summary */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
              <h4 className="text-base font-extrabold text-slate-900">{previewEnrollment.course.title}</h4>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span>Batch Code: <strong className="text-slate-900 font-mono">{previewEnrollment.slot?.batchCode || 'UPCOMING'}</strong></span>
                <span>Seats Left: <strong className="text-[#16532f] font-bold">{previewEnrollment.slot?.availableSeats || 30}</strong></span>
              </div>
            </div>

            {/* Trainee Account Profile Details */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-[10px] text-slate-600 font-semibold uppercase flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#16532f]" /> Trainee Account Profile
              </span>
              <p className="text-xs font-bold text-slate-900">{user?.fullName || user?.name || 'Registered Trainee'}</p>
              <p className="text-xs text-slate-600">{user?.email || user?.phone || 'Account unified'}</p>
            </div>

            {/* Fee Breakdown */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Masterclass Tuition Fee</span>
                <span className="text-slate-900 font-mono font-bold">₹{(previewEnrollment.course.priceInr || previewEnrollment.course.feeInr)?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Lab Material Kit & Certification</span>
                <span className="text-[#16532f] font-bold">INCLUDED</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount Payable</span>
                <span className="text-[#16532f] font-mono">₹{(previewEnrollment.course.priceInr || previewEnrollment.course.feeInr)?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {bookingError && (
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {bookingError}
              </p>
            )}

            <button
              onClick={handleConfirmAndPay}
              disabled={reserving}
              className="w-full bg-[#16532f] hover:bg-[#124426] text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition-all button-press flex items-center justify-center gap-2 text-sm disabled:opacity-50"
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
    </div>
  );
}
