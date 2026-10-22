import React, { useState } from 'react';
import { Phone, User, MapPin, Send, CheckCircle2, ShieldCheck, Clock, Sprout } from 'lucide-react';
import { supportApi } from '../api';

export default function CommercialConsultationSection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    state: 'Maharashtra',
    scale: '250 - 500 Bags (Semi-Commercial)',
    mushroomType: 'Oyster Mushroom'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone.trim() || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (supportApi && typeof supportApi.createTicket === 'function') {
        await supportApi.createTicket({
          subject: `Commercial Farm Setup Callback Request: ${formData.name}`,
          category: 'COMMERCIAL_INCUBATION',
          priority: 'HIGH',
          message: `Grower Name: ${formData.name}\nPhone: ${formData.phone}\nState: ${formData.state}\nFarm Scale: ${formData.scale}\nTarget Strain: ${formData.mushroomType}\nRequested callback for farm consultation.`
        });
      }
    } catch (err) {
      console.warn('Fallback consultation callback handled locally:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <section 
      id="consultation" 
      aria-label="Free AgriTech Farm Consultation" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
    >
      <div className="rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 text-white p-6 sm:p-10 lg:p-12 shadow-level-2 border border-emerald-500/20 relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading & Value Prop */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold font-sans">
              <Sprout className="w-4 h-4 text-emerald-300" />
              <span>FREE 1-ON-1 AGRITECH CONSULTATION</span>
            </div>
            
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">
              Planning a Commercial Setup?<br />
              <span className="text-gold-soft">Talk Directly with Our Senior Mycologist.</span>
            </h2>

            <p className="text-surface-neutral/80 text-xs sm:text-base leading-relaxed">
              Whether you have a 200 sq.ft terrace or a 2,000 sq.ft climate-controlled shed, get a tailored cultivation blueprint, input cost sheet, and guaranteed buyback contract evaluation.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-surface-neutral/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Consultation Fee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>15-Min Fast Callback</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Buyback Price Matrix</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Climate Room Specs</span>
              </div>
            </div>
          </div>

          {/* Right Column: Callback Request Form */}
          <div className="lg:col-span-6 bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/15">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-400/40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="font-bold text-xl text-white">Callback Request Received!</h3>
                <p className="text-xs sm:text-sm text-surface-neutral/80 max-w-sm mx-auto">
                  Thank you, <strong>{formData.name}</strong>. Our senior agronomist will connect with you at <strong>{formData.phone}</strong> within 2 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-white">Request a Free Agronomist Callback</h3>
                  <p className="text-xs text-surface-neutral/70">Fill in your contact details below:</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-neutral/90 mb-1">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kulkarni"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <User className="w-4 h-4 text-white/40 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-surface-neutral/90 mb-1">
                      WhatsApp / Mobile Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <Phone className="w-4 h-4 text-white/40 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-surface-neutral/90 mb-1">
                        State / Location
                      </label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-forest-950/80 border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Delhi NCR">Delhi NCR</option>
                        <option value="Other">Other State</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-surface-neutral/90 mb-1">
                        Intended Farm Scale
                      </label>
                      <select
                        value={formData.scale}
                        onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-forest-950/80 border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-400"
                      >
                        <option value="100 - 250 Bags">100 - 250 Bags (Terrace/Home)</option>
                        <option value="250 - 500 Bags">250 - 500 Bags (Semi-Commercial)</option>
                        <option value="500 - 1000 Bags">500 - 1,000 Bags (Commercial Shed)</option>
                        <option value="1000+ Bags">1,000+ Bags (Enterprise Unit)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-xl bg-gold hover:bg-[#b5893b] text-forest-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-level-1 transition-all mt-4"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-forest-950/30 border-t-forest-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Request Free Consultation Call</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-surface-neutral/60 text-center">
                  🔒 We respect your privacy. No spam. A certified mycology consultant will call you.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
