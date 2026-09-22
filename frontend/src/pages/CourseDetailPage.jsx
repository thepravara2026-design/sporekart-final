import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, Calendar, Clock, MapPin, CheckCircle, Video, Award, ArrowLeft, Users, ShieldCheck, X } from 'lucide-react';
import { trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AuthForm from '../components/AuthForm';

export default function CourseDetailPage({ user, setUser }) {
  const { courseSlug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSlotId, setPendingSlotId] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await trainingApi.getCourses();
        const coursesList = res.data.data || [];
        const found = coursesList.find((c) => c.slug === courseSlug) || coursesList[0];
        setCourse(found);
      } catch (err) {
        console.error('Failed to load course details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseSlug]);

  const handleBookSlot = async (slotId) => {
    if (!user && !localStorage.getItem('sporekart_token')) {
      setPendingSlotId(slotId);
      setShowAuthModal(true);
      return;
    }
    setBookingError('');
    try {
      const res = await trainingApi.bookSlot(slotId);
      setBookingSuccess(res.data.data);
      setShowAuthModal(false);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book slot.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading masterclass details...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Masterclass course not found.
      </div>
    );
  }

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "Sporekart Agritech Center",
      "sameAs": "https://sporekart.in"
    },
    "courseCode": course.slug,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": course.mode === 'ONLINE' ? 'Online' : 'OnSite',
      "instructor": {
        "@type": "Person",
        "name": "Senior Agronomist Expert"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": course.priceInr,
      "priceCurrency": "INR"
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title={`${course.title} — Certified Training Masterclass | Sporekart`}
        description={`${course.description} Enroll in hands-on commercial training with market buyback support in India.`}
        canonicalUrl={`https://sporekart.in/training/${course.slug}`}
        structuredData={[courseSchema]}
      />

      <Breadcrumbs
        items={[
          { label: 'Training', path: '/training' },
          { label: course.title, path: `/training/${course.slug}` }
        ]}
      />

      <Link
        to="/training"
        className="inline-flex items-center gap-2 text-xs text-spore-400 font-semibold hover:text-spore-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Workshops
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <span className="px-3.5 py-1 rounded-full bg-spore-950 border border-spore-700/50 text-spore-300 text-xs font-semibold">
              Certified Agribusiness Masterclass
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-800/60 space-y-4">
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-spore-400" /> Key Curriculum Modules
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                <span><strong>Substrate Chemistry & Moisture Balance:</strong> Master immersion techniques, pH adjusting with calcium carbonate, and moisture determination test.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                <span><strong>Cleanroom Spawning Protocols:</strong> Sterile inoculation techniques, laminar flow hood sanitization, and spawn run chamber environmental control.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-spore-400 shrink-0 mt-0.5" />
                <span><strong>Market Distribution & Buyback Linkage:</strong> Supply chain logistics, packaging standard, and direct purchase linkage with hotel partners.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-spore-700/50 space-y-6 sticky top-24">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <span className="text-xs text-slate-400">Workshop Course Fee</span>
            <div className="font-display font-extrabold text-3xl text-white">
              ₹{course.priceInr?.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-slate-400"> / trainee</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm">Upcoming Workshop Batches:</h4>
            {bookingSuccess ? (
              <div className="p-4 rounded-xl bg-spore-950 border border-spore-500 text-spore-200 text-center space-y-1">
                <CheckCircle className="w-6 h-6 text-spore-400 mx-auto" />
                <h5 className="font-bold text-white">Seat Booked Successfully!</h5>
                <p className="text-[11px] text-slate-300">Slot ID: {bookingSuccess.id}</p>
              </div>
            ) : course.slots && course.slots.length > 0 ? (
              course.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-spore-400" /> {slot.startDate}</span>
                    <span className="text-slate-400 text-[11px]">{slot.availableSeats} seats left</span>
                  </div>
                  <button
                    onClick={() => handleBookSlot(slot.id)}
                    className="w-full py-2 bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
                  >
                    Reserve Seat Now
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs italic">No open batches currently available.</p>
            )}
            {bookingError && <p className="text-xs text-red-400">{bookingError}</p>}
          </div>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl relative border border-spore-600/50 shadow-2xl animate-scale-in">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <AuthForm
              title="Trainee Registration & Login"
              subtitle="Enter your mobile number or email to register your trainee account and confirm your seat."
              setUser={setUser}
              onSuccess={(authData) => {
                setShowAuthModal(false);
                if (pendingSlotId) {
                  handleBookSlot(pendingSlotId);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
