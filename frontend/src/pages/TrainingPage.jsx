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
import TrainingGlimpseCarousel from '../components/TrainingGlimpseCarousel';
import TraineeProfileEnrollmentModal from '../components/TraineeProfileEnrollmentModal';

export default function TrainingPage({ user, setUser }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [glimpses, setGlimpses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    async function fetchData() {
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
      }

      try {
        if (typeof trainingApi.getGlimpses === 'function') {
          const glimpseRes = await trainingApi.getGlimpses();
          if (glimpseRes?.data?.data) {
            setGlimpses(glimpseRes.data.data);
          } else if (Array.isArray(glimpseRes?.data)) {
            setGlimpses(glimpseRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load training glimpses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Authentication & Preview Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [previewEnrollment, setPreviewEnrollment] = useState(null); // { course, slot }

  const initiateEnrollment = (course, slot) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const targetSlot = slot || (course.slots && course.slots.length > 0 ? course.slots[0] : null);
    setPreviewEnrollment({ course, slot: targetSlot });
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

      {/* Workshop Training Glimpses Gallery */}
      <TrainingGlimpseCarousel glimpses={glimpses} />

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

      {/* Step 3: Enrollment Preview & Trainee Profile Verification Modal */}
      {previewEnrollment && !showAuthModal && (
        <TraineeProfileEnrollmentModal
          previewEnrollment={previewEnrollment}
          user={user}
          setUser={setUser}
          onClose={() => setPreviewEnrollment(null)}
          onSuccess={(enrollmentData) => {
            setPreviewEnrollment(null);
            navigate(`/payment?type=enrollment&id=${enrollmentData.id}`);
          }}
        />
      )}
    </div>
  );
}
