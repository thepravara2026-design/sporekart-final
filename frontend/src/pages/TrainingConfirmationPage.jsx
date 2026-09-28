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
      <div className="min-h-[60vh] flex items-center justify-center text-typography-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-forest-700 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-typography-secondary">Fetching training enrollment receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-typography-primary mb-2">Enrollment Record Not Found</h2>
        <p className="text-xs text-typography-muted mb-6">{error || 'Unable to retrieve enrollment.'}</p>
        <Link
          to="/training"
          className="btn-primary inline-flex items-center px-6 py-2.5 text-xs font-bold"
        >
          Return to Training Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto animate-fade-in text-typography-primary">
      {/* Confirmation Success Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 bg-forest-900/10 border border-forest-900/20 rounded-full flex items-center justify-center mx-auto shadow-level-1">
          <GraduationCap className="w-9 h-9 text-forest-800" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-typography-primary">Enrollment Confirmed!</h1>
        <p className="text-sm text-typography-secondary max-w-md mx-auto">
          Congratulations! You are officially registered for <span className="text-forest-700 font-bold">{enrollment.courseTitle}</span>.
        </p>
      </div>

      <div className="bg-surface-white border border-surface-border rounded-card p-6 sm:p-8 shadow-level-2 space-y-6">
        {/* Main Details Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-cream rounded-2xl border border-surface-border gap-4">
          <div>
            <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-green-600/10 text-green-700 border border-green-600/20">
              Status: {enrollment.status}
            </span>
            <h3 className="text-lg font-extrabold text-typography-primary mt-2">{enrollment.courseTitle}</h3>
            <p className="text-xs text-typography-secondary flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5 text-forest-700" /> Batch Code: <span className="font-mono text-typography-primary font-bold">{enrollment.batchCode}</span>
            </p>
          </div>

          <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0">
            <span className="text-xs text-typography-muted block font-medium">Fee Paid</span>
            <span className="text-xl font-bold text-forest-800 font-mono">₹{enrollment.feePaidInr?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Enrollment Instructions & Metadata */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-typography-muted flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-forest-700" /> Training Details & Next Steps
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-2">
              <div className="flex items-center gap-2 text-forest-800 font-bold">
                <Video className="w-4 h-4 text-forest-700" /> Live Interactive Sessions
              </div>
              <p className="text-typography-secondary text-[11px] leading-relaxed">
                Joining links and schedule invites will be accessible in your Training Dashboard prior to class start.
              </p>
            </div>

            <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-2">
              <div className="flex items-center gap-2 text-forest-800 font-bold">
                <Award className="w-4 h-4 text-forest-700" /> Certificate of Completion
              </div>
              <p className="text-typography-secondary text-[11px] leading-relaxed">
                Earn an official Sporekart Mushroom Cultivation Certificate upon completing course attendance.
              </p>
            </div>
          </div>

          <div className="py-3 border-t border-b border-surface-border flex justify-between items-center text-xs">
            <span className="text-typography-muted">Payment Reference</span>
            <span className="font-mono font-bold text-typography-primary">{enrollment.paymentReference || 'CONFIRMED'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex-1 btn-primary py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <span>Go to My Training Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/training"
            className="w-full sm:w-auto flex-1 btn-secondary py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
          >
            Explore Other Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
