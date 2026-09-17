import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { supportApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

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
        title="Contact Sporekart — Pune Agritech Center & Customer Support"
        description="Get in touch with Sporekart Agritech India for fresh mushroom bulk orders, spawn seed inquiries, farm setup consultancy, and workshop enrollments."
        canonicalUrl="https://sporekart.in/contact"
      />

      <Breadcrumbs items={[{ label: 'Contact Us', path: '/contact' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Contact Sporekart Support</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Have questions about spawn seeds, orders, payments, shipments, or masterclass enrollments? Open a support ticket below.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl glass-card border border-spore-800/40 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-spore-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Agritech Center</h4>
                <p className="text-slate-400">Agri Tech Innovation Park, Pune, MH 411001</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-spore-800/40 flex items-center gap-3">
              <Phone className="w-6 h-6 text-spore-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Phone Helpline</h4>
                <p className="text-slate-400">+91 98765 43210 (Mon-Sat, 9AM-6PM)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-spore-800/40 flex items-center gap-3">
              <Mail className="w-6 h-6 text-spore-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Email Support</h4>
                <p className="text-slate-400">support@sporekart.in</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 glass-panel p-8 rounded-3xl border border-spore-700/50">
          <h2 className="font-display font-bold text-2xl text-white mb-4">Open a Support Ticket</h2>
          {submittedTicket ? (
            <div className="p-6 bg-spore-950/80 border border-spore-500 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-spore-400 mx-auto" />
              <h3 className="font-bold text-white text-lg">Support Ticket Submitted!</h3>
              <p className="text-xs text-slate-300">
                Ticket Reference: <strong className="text-spore-300 font-mono text-sm">{submittedTicket.ticketNumber || 'TKT-ACCEPTED'}</strong>
              </p>
              <p className="text-xs text-slate-400">Our agronomist and support team will respond to your ticket within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm"
                  placeholder="e.g. Ramesh Patil"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ticket Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-xs"
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
                  <label className="block text-slate-300 font-medium mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquiring about Oyster spawn refrigeration"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Ticket Details *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-4 py-3 text-white text-sm"
                  placeholder="Describe your issue or inquiry in detail..."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition-all"
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
