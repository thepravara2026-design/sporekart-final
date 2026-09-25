import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, GraduationCap, Calendar, Video, ShieldCheck, 
  ArrowRight, Loader2, Award, Clock
} from 'lucide-react';
import { trainingApi } from '../api';

export default function TrainingConfirmationPage() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (enrollmentId) {
      loadEnrollment();
    }
  }, [enrollmentId]);

  const loadEnrollment = async () => {
    try {
      setLoading(true);
      const res = await trainingApi.getEnrollmentById(enrollmentId);
      if (res.data && res.data.success) {
        setEnrollment(res.data.data);
      } else {
        setError('Enrollment details not found.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load enrollment confirmation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f8f4] text-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#16532f] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Fetching training enrollment receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !enrollment) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-md mx-auto bg-[#f2f8f4]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Enrollment Record Not Found</h2>
        <p className="text-xs text-slate-600 mb-6">{error || 'Unable to retrieve enrollment.'}</p>
        <Link
          to="/training"
          className="bg-[#16532f] hover:bg-[#124426] text-white font-bold px-6 py-2.5 rounded-xl transition-all text-xs"
        >
          Return to Training Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto animate-fade-in text-slate-900">
      {/* Confirmation Success Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 bg-gradient-to-tr from-[#16532f] to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 animate-bounce">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900">Enrollment Confirmed!</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Congratulations! You are officially registered for <span className="text-[#16532f] font-bold">{enrollment.courseTitle}</span>.
        </p>
      </div>

      <div className="bg-white border border-emerald-100/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Main Details Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-[#16532f] border border-emerald-200">
              Status: {enrollment.status}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-2">{enrollment.courseTitle}</h3>
            <p className="text-xs text-slate-600 flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5 text-[#16532f]" /> Batch Code: <span className="font-mono text-slate-900 font-bold">{enrollment.batchCode}</span>
            </p>
          </div>

          <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0">
            <span className="text-xs text-slate-500 block font-medium">Fee Paid</span>
            <span className="text-xl font-bold text-[#16532f] font-mono">₹{enrollment.feePaidInr?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Enrollment Instructions & Metadata */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16532f]" /> Training Details & Next Steps
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2 text-sky-700 font-bold">
                <Video className="w-4 h-4" /> Live Interactive Sessions
              </div>
              <p className="text-slate-600 text-[11px]">
                Joining links and schedule invites will be accessible in your Training Dashboard prior to class start.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2 text-[#16532f] font-bold">
                <Award className="w-4 h-4" /> Certificate of Completion
              </div>
              <p className="text-slate-600 text-[11px]">
                Earn an official Sporekart Mushroom Cultivation Certificate upon completing course attendance.
              </p>
            </div>
          </div>

          <div className="py-2 border-t border-b border-gray-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Payment Reference</span>
            <span className="font-mono font-bold text-slate-900">{enrollment.paymentReference || 'CONFIRMED'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex-1 bg-[#16532f] hover:bg-[#124426] text-white font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all button-press shadow-md"
          >
            <span>Go to My Training Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/training"
            className="w-full sm:w-auto flex-1 bg-white hover:bg-slate-50 border border-gray-300 text-slate-800 font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            Explore Other Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
