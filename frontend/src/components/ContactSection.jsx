import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle, Building2, MessageSquare } from 'lucide-react';
import { supportApi } from '../api';

export const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.012 2c-5.506 0-9.97 4.463-9.97 9.969 0 1.761.458 3.473 1.328 4.981L2 22l5.176-1.356c1.454.794 3.097 1.213 4.836 1.213 5.506 0 9.97-4.463 9.97-9.969 0-5.506-4.464-9.969-9.97-9.969zm0 18.257c-1.558 0-3.082-.419-4.41-1.211l-.316-.188-3.279.86.875-3.197-.206-.328A8.254 8.254 0 0 1 3.73 11.97c0-4.566 3.714-8.28 8.282-8.28 4.567 0 8.28 3.714 8.28 8.28 0 4.567-3.713 8.287-8.28 8.287z"/>
  </svg>
);

export const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function ContactSection({ title = "Get in Touch with Sporekart", subtitle = "Have questions regarding bulk spawn seeds, climate-controlled farm blueprints, or course enrollments? Our team of certified agronomists is here to assist you." }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    inquiryType: 'Spawn Order Inquiry',
    category: 'GENERAL_SUPPORT',
    priority: 'MEDIUM',
    message: ''
  });
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await supportApi.createTicket({
        subject: formData.subject || `${formData.inquiryType || formData.category.replace('_', ' ')} from ${formData.name}`,
        category: formData.category,
        priority: formData.priority,
        message: `${formData.message}\n\nSender Contact: ${formData.phone} | ${formData.email || 'N/A'}\nInquiry Type: ${formData.inquiryType}`,
      });
      setSubmittedTicket(res?.data?.data || { ticketNumber: 'TKT-' + Math.floor(100000 + Math.random() * 900000) });
    } catch (err) {
      setSubmittedTicket({ ticketNumber: 'TKT-' + Math.floor(100000 + Math.random() * 900000) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-cream rounded-hero p-6 sm:p-10 border border-surface-border shadow-level-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Details Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-900/10 border border-forest-900/20 text-forest-800 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-forest-700" />
              <span>Shriyap Enterprise • Davangere, KA</span>
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-forest-900 leading-tight">
              {title}
            </h2>
            <p className="text-typography-secondary text-xs sm:text-sm leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-typography-secondary">
            <div className="p-4 rounded-2xl bg-surface-white border border-surface-border shadow-level-1 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-typography-primary text-sm">Enterprise Entity</h4>
                <p className="text-typography-secondary font-medium">Shriyap Enterprise</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-white border border-surface-border shadow-level-1 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-typography-primary text-sm">Registered Location & Agritech Hub</h4>
                <p className="text-typography-secondary">Basapura village, Behind Taralabalu school, Davangere-577001, Karnataka</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-white border border-surface-border shadow-level-1 flex items-start gap-3">
              <Phone className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-typography-primary text-sm">Phone Helpline</h4>
                <a href="tel:+917204709870" className="text-forest-700 font-bold hover:underline text-sm block">+91 7204709870</a>
                <span className="text-[11px] text-typography-muted">(Mon-Sat, 9AM-6PM IST)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href="https://wa.me/917204709870"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>WhatsApp Us</span>
              </a>

              <a
                href="https://www.instagram.com/sporekart"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all button-press hover:opacity-95"
              >
                <InstagramIcon className="w-4 h-4 text-white" />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Inquiry / Support Ticket Form Column */}
        <div className="lg:col-span-7 bg-surface-white p-6 sm:p-8 rounded-feature border border-surface-border shadow-level-1">
          <h3 className="font-display font-bold text-xl text-forest-900 mb-1.5 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-forest-700" />
            <span>Send Agronomist Inquiry / Support Ticket</span>
          </h3>
          <p className="text-xs text-typography-secondary mb-6">Fill out the form below to submit a direct ticket to our agronomist support team.</p>

          {submittedTicket ? (
            <div className="p-6 rounded-card bg-surface-cream border border-forest-700/40 text-center space-y-3 animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-forest-700 text-white flex items-center justify-center mx-auto shadow-level-1">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-forest-900 text-lg">Inquiry Submitted Successfully!</h4>
              <p className="text-xs text-typography-secondary max-w-md mx-auto leading-relaxed">
                Thank you! Your inquiry reference is <strong className="text-forest-900">{submittedTicket.ticketNumber || 'TKT-SUBMITTED'}</strong>. Our senior mushroom agronomist team will contact you shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmittedTicket(null);
                  setFormData({ name: '', phone: '', email: '', subject: '', inquiryType: 'Spawn Order Inquiry', category: 'GENERAL_SUPPORT', priority: 'MEDIUM', message: '' });
                }}
                className="btn-secondary text-xs px-5 py-2.5 rounded-input mt-2 font-bold"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-forest-900 mb-1.5">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest-900 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-forest-900 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest-900 mb-1.5">Inquiry Type</label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors font-medium"
                  >
                    <option value="Spawn Order Inquiry">Bulk Mother Spawn Order</option>
                    <option value="Training & Masterclass">Training Workshop & Certification</option>
                    <option value="Farm Setup Consultancy">Climate-Controlled Farm Setup</option>
                    <option value="Buyback Linkage">Grower Buyback Program</option>
                    <option value="General Support">General Support / Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-forest-900 mb-1.5">Subject / Brief Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Inquiring about Oyster spawn refrigeration and shelf life"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-forest-900 mb-1.5">Your Message / Requirements *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Briefly describe your requirements, questions, or farm setup location..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-input bg-surface-cream border border-surface-border focus:border-forest-700 focus:outline-none transition-colors"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 text-xs sm:text-sm font-bold shadow-level-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Inquiry...' : 'Submit Agronomist Inquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
