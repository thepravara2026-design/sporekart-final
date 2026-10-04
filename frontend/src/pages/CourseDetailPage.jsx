import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Calendar, Clock, MapPin, CheckCircle, Video, Award, ArrowLeft, Users, ShieldCheck, X } from 'lucide-react';
import { trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AuthForm from '../components/AuthForm';
import TrainingReviewsSection from '../components/TrainingReviewsSection';

export default function CourseDetailPage({ user, setUser }) {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSlotId, setPendingSlotId] = useState(null);
  const [pendingReviewItem, setPendingReviewItem] = useState(null);

  const fetchPendingReviews = async (courseId) => {
    if (!user && !localStorage.getItem('sporekart_token')) return;
    try {
      const res = await trainingApi.getPendingReviews();
      const list = res.data?.data || [];
      const match = list.find((item) => item.courseId === courseId);
      setPendingReviewItem(match || null);
    } catch (err) {
      console.error('Failed to fetch pending training reviews', err);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await trainingApi.getCourses();
        const coursesList = res.data.data || [];
        const found = coursesList.find((c) => c.slug === courseSlug) || coursesList[0];
        setCourse(found);
        if (found) {
          fetchPendingReviews(found.id);
        }
      } catch (err) {
        console.error('Failed to load course details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseSlug, user]);

  const handleBookSlot = async (slotId) => {
    if (!user && !localStorage.getItem('sporekart_token')) {
      setPendingSlotId(slotId);
      setShowAuthModal(true);
      return;
    }
    setBookingError('');
    try {
      const res = await trainingApi.bookSlot(slotId);
      if (res.data && res.data.success) {
        const enrollment = res.data.data;
        setShowAuthModal(false);
        navigate(`/payment?type=enrollment&id=${enrollment.id}`);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book slot.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-typography-muted font-medium">
        Loading masterclass details...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-typography-muted font-medium">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
        className="inline-flex items-center gap-2 text-xs text-forest-700 font-semibold hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Workshops
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-semibold">
              Certified Agribusiness Masterclass
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary leading-tight">
              {course.title}
            </h1>
            <p className="text-typography-secondary text-sm sm:text-base leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="bg-surface-white p-6 sm:p-8 rounded-card border border-surface-border shadow-level-1 space-y-4">
            <h2 className="font-display font-bold text-xl text-typography-primary flex items-center gap-2">
              <Award className="w-6 h-6 text-forest-700" /> Key Curriculum Modules
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-typography-secondary">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span><strong className="text-typography-primary font-semibold">Substrate Chemistry & Moisture Balance:</strong> Master immersion techniques, pH adjusting with calcium carbonate, and moisture determination test.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span><strong className="text-typography-primary font-semibold">Cleanroom Spawning Protocols:</strong> Sterile inoculation techniques, laminar flow hood sanitization, and spawn run chamber environmental control.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span><strong className="text-typography-primary font-semibold">Market Distribution & Buyback Linkage:</strong> Supply chain logistics, packaging standard, and direct purchase linkage with hotel partners.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-white p-6 rounded-card border border-surface-border shadow-level-2 space-y-6 sticky top-24">
          <div className="space-y-1 pb-4 border-b border-surface-border">
            <span className="text-xs text-typography-muted font-medium">Workshop Course Fee</span>
            <div className="font-display font-extrabold text-3xl text-typography-primary">
              ₹{course.priceInr?.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-typography-muted"> / trainee</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-typography-secondary">
            <h4 className="font-bold text-typography-primary text-sm">Upcoming Workshop Batches:</h4>
            {bookingSuccess ? (
              <div className="p-4 rounded-xl bg-forest-900/10 border border-forest-700/30 text-forest-900 text-center space-y-1">
                <CheckCircle className="w-6 h-6 text-forest-700 mx-auto" />
                <h5 className="font-bold text-typography-primary">Seat Booked Successfully!</h5>
                <p className="text-[11px] text-typography-secondary">Slot ID: {bookingSuccess.id}</p>
              </div>
            ) : course.slots && course.slots.length > 0 ? (
              course.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3.5 rounded-2xl bg-surface-cream border border-surface-border space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs text-typography-primary font-semibold">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-forest-700" /> {slot.startDate}</span>
                    <span className="text-typography-muted text-[11px]">{slot.availableSeats} seats left</span>
                  </div>
                  <button
                    onClick={() => handleBookSlot(slot.id)}
                    className="btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    Reserve Seat Now
                  </button>
                </div>
              ))
            ) : (
              <p className="text-typography-muted text-xs italic">No open batches currently available.</p>
            )}
            {bookingError && <p className="text-xs text-red-600 font-medium">{bookingError}</p>}
          </div>
        </div>
      </div>

      {/* Trainee Reviews & Rating Section */}
      <TrainingReviewsSection
        courseId={course.id}
        pendingReviewItem={pendingReviewItem}
        onReviewSubmitted={() => course?.id && fetchPendingReviews(course.id)}
      />

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-white w-full max-w-md p-6 sm:p-8 rounded-card relative border border-surface-border shadow-level-3 animate-scale-in">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-typography-muted hover:text-typography-primary p-2"
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
