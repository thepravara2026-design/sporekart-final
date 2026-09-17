import React, { useEffect, useState } from 'react';
import { GraduationCap, Calendar, Clock, MapPin, CheckCircle, Video, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { trainingApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function TrainingPage({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await trainingApi.getCourses();
        setCourses(res.data.data || []);
      } catch (err) {
        console.error('Failed to load training courses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleBookSlot = async (slotId) => {
    if (!user) {
      alert('Please login to book a training workshop batch.');
      return;
    }
    setBookingError('');
    try {
      const res = await trainingApi.bookSlot(slotId);
      setBookingSuccess(res.data.data);
      setSelectedSlot(null);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book slot.');
    }
  };

  // Structured Course Schema for AI Search Engines & Google
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
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": c.mode === 'ONLINE' ? 'Online' : 'OnSite',
      "instructor": {
        "@type": "Person",
        "name": "Senior Agronomist Expert"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": c.priceInr,
      "priceCurrency": "INR"
    }
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Are certificates provided after completing the mushroom cultivation training?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Sporekart provides industry-recognized certificates of completion for all online and laboratory training workshops."
        }
      },
      {
        "@type": "Question",
        "name": "Does Sporekart offer buyback support for fresh mushrooms?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we connect certified trainees with our wholesale hotel buyers and mushroom processing partners across India."
        }
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="Mushroom Cultivation & Spawn Production Training Masterclasses | Sporekart"
        description="Enroll in certified commercial mushroom cultivation and pure grain spawn lab workshops. Hands-on online & laboratory training with market buyback support in India."
        canonicalUrl="https://sporekart.in/training"
        structuredData={[...courseSchemas, faqSchema]}
      />

      <Breadcrumbs items={[{ label: 'Training Workshops', path: '/training' }]} />

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spore-950 border border-spore-700/50 text-spore-300 text-xs font-semibold">
          <GraduationCap className="w-4 h-4 text-spore-400" />
          <span>Govt. & Agritech Industry Aligned Certification</span>
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white">
          Certified Mushroom Cultivation & <br />
          <span className="gradient-gold">Spawn Lab Masterclasses</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Master commercial mushroom production, substrate formulation, lab tissue culture, and market buyback protocols. Taught by senior agronomists with live practical sessions.
        </p>
      </div>

      {bookingSuccess && (
        <div className="p-6 glass-panel rounded-2xl border border-spore-500 text-center space-y-3 max-w-lg mx-auto">
          <CheckCircle className="w-10 h-10 text-spore-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Batch Slot Confirmed!</h3>
          <p className="text-xs text-slate-300">
            You have successfully enrolled in <strong className="text-spore-300">{bookingSuccess.courseTitle}</strong>.
          </p>
          <div className="text-xs text-slate-400 bg-slate-900/80 p-3 rounded-xl space-y-1">
            <p>🗓 Date: {new Date(bookingSuccess.startTime).toLocaleDateString()}</p>
            <p>📍 Location/Link: {bookingSuccess.locationOrLink}</p>
          </div>
          <button onClick={() => setBookingSuccess(null)} className="px-6 py-2 bg-spore-500 text-slate-950 font-bold rounded-xl text-xs">
            Done
          </button>
        </div>
      )}

      {bookingError && (
        <div className="p-4 bg-red-950/60 border border-red-800/50 rounded-xl text-xs text-red-300 text-center max-w-md mx-auto">
          {bookingError}
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-64 rounded-3xl animate-pulse bg-slate-900/40"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => {
            const syllabus = course.syllabusJson ? JSON.parse(course.syllabusJson) : [];
            const isExpanded = expandedCourse === course.id;

            return (
              <div key={course.id} className="glass-panel rounded-3xl p-6 sm:p-8 border border-spore-700/50 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${course.mode === 'ONLINE' ? 'bg-blue-950 text-blue-300 border border-blue-800/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'}`}>
                        {course.mode === 'ONLINE' ? <Video className="w-3 h-3 inline mr-1" /> : <MapPin className="w-3 h-3 inline mr-1" />}
                        {course.mode} WORKSHOP
                      </span>
                      <span className="px-3 py-1 bg-spore-950 text-spore-300 text-[11px] font-bold rounded-lg border border-spore-800/50">
                        {course.category}
                      </span>
                    </div>

                    <h2 className="font-display font-extrabold text-2xl text-white">{course.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{course.description}</p>

                    <div className="flex items-center gap-6 text-xs text-slate-400 pt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-spore-400" />
                        <span>{course.durationHours} Hours Total</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Certificate Included</span>
                      </div>
                    </div>

                    {syllabus.length > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                          className="text-xs font-bold text-spore-400 hover:text-spore-300 flex items-center gap-1"
                        >
                          {isExpanded ? 'Hide Module Syllabus' : 'View Module Syllabus'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <ul className="mt-3 space-y-2 bg-slate-950/80 p-4 rounded-xl border border-spore-900 text-xs text-slate-300">
                            {syllabus.map((module, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-spore-400 shrink-0" />
                                <span>{module}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl p-6 border border-spore-800/60 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-xs text-slate-400 block">Course Fee</span>
                      <div className="text-3xl font-extrabold text-amber-400">₹{course.priceInr}</div>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-spore-400" /> Available Batch Slots
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {course.slots && course.slots.length > 0 ? (
                          course.slots.map((slot) => (
                            <div key={slot.id} className="p-3 rounded-xl bg-slate-900 border border-spore-800/40 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-white">
                                  {new Date(slot.startTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>

                              <button
                                onClick={() => handleBookSlot(slot.id)}
                                disabled={!slot.isAvailable}
                                className="bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
                              >
                                {slot.isAvailable ? 'Book Batch' : 'Full'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No active slots available. Contact support for custom batch dates.</p>
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
    </div>
  );
}
