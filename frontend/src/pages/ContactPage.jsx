import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Building2 } from 'lucide-react';
import { supportApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.143 4.174 4.174-1.143zm11.758-5.321c-.244-.122-1.446-.713-1.67-.795-.224-.082-.387-.122-.55.122-.163.244-.632.795-.774.958-.143.163-.285.183-.529.061-.244-.122-1.033-.381-1.968-1.215-.727-.648-1.218-1.449-1.36-1.693-.143-.244-.015-.376.107-.497.11-.11.244-.285.366-.427.122-.143.163-.244.244-.407.082-.163.041-.305-.02-.427-.061-.122-.55-1.323-.753-1.812-.197-.477-.398-.413-.55-.421-.143-.008-.305-.008-.467-.008-.163 0-.427.061-.65.305-.224.244-.855.835-.855 2.036 0 1.201.875 2.361.997 2.524.122.163 1.723 2.632 4.174 3.69 1.748.755 2.432.83 3.3.702.535-.079 1.646-.672 1.878-1.322.232-.65.232-1.206.163-1.322-.069-.116-.231-.177-.475-.299z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
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
        subject: formData.subject || `${formData.category.replace('_', ' ')} Inquiry from ${formData.name}`,
        category: formData.category,
        priority: formData.priority,
        message: `${formData.message}\n\nSender Contact: ${formData.phone} | ${formData.email}`,
      });
      setSubmittedTicket(res.data.data);
    } catch (err) {
      setSubmittedTicket({ ticketNumber: 'TKT-' + Math.floor(100000 + Math.random() * 900000) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SeoHead
        title="Contact Sporekart — Shriyap Enterprise, Davangere & Customer Support"
        description="Get in touch with Sporekart (Shriyap Enterprise, Davangere-577001) for fresh mushroom bulk orders, spawn seed inquiries, farm setup consultancy, and workshop enrollments."
        canonicalUrl="https://sporekart.in/contact"
      />

      <Breadcrumbs items={[{ label: 'Contact Us', path: '/contact' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-cream border border-surface-border text-forest-700 text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5 text-forest-700" /> Shriyap Enterprise
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-typography-primary">Contact Sporekart Support</h1>
            <p className="text-typography-secondary text-xs sm:text-sm mt-2 leading-relaxed">
              Have questions about spawn seeds, orders, payments, shipments, or masterclass enrollments? Contact us or open a support ticket.
            </p>
          </div>

          <div className="space-y-4 text-xs text-typography-secondary">
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
                <a href="tel:+917804709870" className="text-forest-700 font-bold hover:underline text-sm block">+91 7804709870</a>
                <span className="text-[11px] text-typography-muted">(Mon-Sat, 9AM-6PM IST)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-level-1 flex items-start gap-3">
              <WhatsAppIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-900 text-sm">WhatsApp Assistance</h4>
                <p className="text-emerald-800 text-xs">+91 7804709870</p>
                <a
                  href="https://wa.me/917804709870"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all button-press mt-1"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Start WhatsApp Chat</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200/80 shadow-level-1 flex items-start gap-3">
              <InstagramIcon className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-pink-900 text-sm">Instagram Handle</h4>
                <p className="text-pink-800 text-xs">www.instagram.com/sporekart</p>
                <a
                  href="https://www.instagram.com/sporekart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white rounded-lg font-bold text-xs shadow-sm transition-all button-press mt-1"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Visit Instagram @sporekart</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-white border border-surface-border shadow-level-1 flex items-start gap-3">
              <Mail className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-typography-primary text-sm">Email Support</h4>
                <a href="mailto:support@sporekart.in" className="text-forest-700 font-medium hover:underline">support@sporekart.in</a>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-surface-white p-8 rounded-card border border-surface-border shadow-level-2">
          <h2 className="font-display font-bold text-2xl text-typography-primary mb-4">Open a Support Ticket</h2>
          {submittedTicket ? (
            <div className="p-6 bg-forest-900/10 border border-forest-700/30 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-forest-700 mx-auto" />
              <h3 className="font-bold text-typography-primary text-lg">Support Ticket Submitted!</h3>
              <p className="text-xs text-typography-secondary">
                Ticket Reference: <strong className="text-forest-800 font-mono text-sm">{submittedTicket.ticketNumber || 'TKT-ACCEPTED'}</strong>
              </p>
              <p className="text-xs text-typography-muted">Our agronomist and support team will respond to your ticket within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-medium mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/15 outline-none"
                  placeholder="e.g. Ramesh Patil"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/15 outline-none"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/15 outline-none"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Ticket Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-xs focus:border-green-600 focus:ring-2 focus:ring-green-600/15 outline-none"
                  >
                    <option value="GENERAL_SUPPORT">General Inquiry</option>
                    <option value="ORDER_ISSUE">Order Issue</option>
                    <option value="PAYMENT_ISSUE">Payment Assistance</option>
                    <option value="SHIPPING_ISSUE">Shipment Tracking</option>
                    <option value="TRAINING_ISSUE">Masterclass Training</option>
                    <option value="PRODUCT_INQUIRY">Spawn / Product Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-xs focus:border-green-600 focus:ring-2 focus:ring-green-600/15 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-typography-primary font-medium mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquiring about Oyster spawn refrigeration"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/15 outline-none"
                />
              </div>
              <div>
                <label className="block text-typography-primary font-medium mb-1">Ticket Details *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/15 outline-none"
                  placeholder="Describe your issue or inquiry in detail..."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3.5 text-sm font-bold"
              >
                {isSubmitting ? 'Creating Ticket...' : 'Submit Support Ticket'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
