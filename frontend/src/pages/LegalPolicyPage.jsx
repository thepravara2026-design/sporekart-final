import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Truck, 
  Database, 
  Scale, 
  Printer, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  ChevronRight, 
  Building2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { LEGAL_POLICIES } from '../data/legalPolicies';

// Policy Icon Mapping
const POLICY_ICONS = {
  'privacy-policy': ShieldCheck,
  'terms': FileText,
  'refund-policy': RotateCcw,
  'shipping-policy': Truck,
  'cookie-policy': Database,
  'grievance': Scale,
};

export default function LegalPolicyPage() {
  const { policySlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active policy key based on path or param
  const activeSlug = useMemo(() => {
    if (policySlug && LEGAL_POLICIES[policySlug]) {
      return policySlug;
    }
    const path = location.pathname.replace(/^\//, '');
    if (LEGAL_POLICIES[path]) {
      return path;
    }
    if (path === 'return-policy' || path === 'cancellation-policy') return 'refund-policy';
    if (path === 'terms-and-conditions' || path === 'terms-of-service') return 'terms';
    if (path === 'cache-policy' || path === 'cache-policies') return 'cookie-policy';
    if (path === 'privacy') return 'privacy-policy';
    return 'privacy-policy';
  }, [policySlug, location.pathname]);

  const activePolicy = LEGAL_POLICIES[activeSlug] || LEGAL_POLICIES['privacy-policy'];

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Scroll to top when active document changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchQuery('');
  }, [activeSlug]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return activePolicy.sections;
    const q = searchQuery.toLowerCase();
    return activePolicy.sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.content.toLowerCase().includes(q)
    );
  }, [activePolicy, searchQuery]);

  return (
    <div className="min-h-screen bg-surface-cream text-typography-primary py-4 sm:py-6">
      <SeoHead
        title={`${activePolicy.title} — Sporekart (Shriyap Enterprise)`}
        description={activePolicy.summary}
        canonicalUrl={`https://sporekart.in/${activePolicy.slug}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Legal Center', path: '/policies' },
            { label: activePolicy.shortTitle, path: `/${activePolicy.slug}` }
          ]}
        />

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-br from-forest-950 via-forest-900 to-[#0A2015] text-white rounded-hero p-6 sm:p-10 border border-forest-800/80 shadow-level-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Legal & Regulatory Compliance</span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight">
              {activePolicy.title}
            </h1>

            <p className="text-xs sm:text-sm text-sage/90 leading-relaxed">
              {activePolicy.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-sage/80 pt-2 border-t border-forest-800/60">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Shriyap Enterprise, Davangere, Karnataka</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Last Revised: {activePolicy.lastUpdated}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {activePolicy.readTime}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Sidebar Navigation + Active Document */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Policy Directory (4 Columns) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Policy Navigation Tabs */}
            <div className="bg-surface-white rounded-container p-4 sm:p-5 border border-surface-border shadow-level-1 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-typography-muted px-2 mb-3">
                Legal Documents & Charters
              </h2>

              <nav className="space-y-1.5" aria-label="Legal documents directory">
                {Object.values(LEGAL_POLICIES).map((policy) => {
                  const Icon = POLICY_ICONS[policy.slug] || FileText;
                  const isActive = activeSlug === policy.slug;
                  return (
                    <button
                      key={policy.slug}
                      onClick={() => navigate(`/${policy.slug}`)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                        isActive
                          ? 'bg-forest-800 text-white font-semibold shadow-sm'
                          : 'hover:bg-surface-cream text-typography-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-emerald-600/30 text-emerald-300'
                              : 'bg-forest-900/5 text-forest-700 group-hover:bg-forest-800 group-hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs truncate">{policy.shortTitle}</p>
                          <p
                            className={`text-[10px] truncate ${
                              isActive ? 'text-sage' : 'text-typography-muted'
                            }`}
                          >
                            {policy.category}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive
                            ? 'text-emerald-300 translate-x-0.5'
                            : 'text-typography-muted group-hover:translate-x-0.5'
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Action Assistance Card */}
            <div className="bg-surface-white rounded-container p-5 border border-surface-border shadow-level-1 space-y-4">
              <div className="flex items-center gap-2 text-forest-900 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Statutory Compliance Desk</span>
              </div>
              <p className="text-xs text-typography-secondary leading-relaxed">
                Have inquiries regarding consumer rights, order dispatches, or data protection under the DPDP Act 2023?
              </p>
              
              <div className="p-3 bg-surface-cream rounded-xl border border-surface-border/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-forest-900 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-forest-700" />
                  <span>Shriyap Enterprise</span>
                </div>
                <div className="flex items-center gap-2 text-typography-secondary">
                  <Phone className="w-3.5 h-3.5 text-forest-700" />
                  <a href="tel:+917204709870" className="hover:text-forest-900 font-medium">+91 7204709870</a>
                </div>
                <div className="flex items-center gap-2 text-typography-secondary">
                  <Mail className="w-3.5 h-3.5 text-forest-700" />
                  <a href="mailto:support@sporekart.in" className="hover:text-forest-900 font-medium">support@sporekart.in</a>
                </div>
              </div>

              <a
                href="https://wa.me/917204709870?text=Hi%20Sporekart%20Team%2C%20I%20have%20a%20question%20regarding%20legal%20policies."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-forest-800 hover:bg-forest-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>WhatsApp Legal Desk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </aside>

          {/* Right Column: Document Reader & Search Filter (8 Columns) */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* Document Controls Bar: Search & Actions */}
            <div className="bg-surface-white rounded-card p-4 border border-surface-border shadow-level-1 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Within Document */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-typography-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${activePolicy.shortTitle}...`}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-cream rounded-xl border border-surface-border focus:outline-none focus:border-forest-700 text-forest-900 placeholder-typography-muted"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-typography-muted hover:text-forest-900"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Utility Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyLink}
                  aria-label="Copy direct policy link"
                  className="px-3 py-2 rounded-xl border border-surface-border bg-surface-white hover:bg-surface-cream text-xs text-forest-900 font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  aria-label="Print or save document as PDF"
                  className="px-3 py-2 rounded-xl border border-surface-border bg-surface-white hover:bg-surface-cream text-xs text-forest-900 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Document Body */}
            <article className="bg-surface-white rounded-container p-6 sm:p-10 border border-surface-border shadow-level-1 space-y-8 print:border-none print:shadow-none">
              
              {/* Document Subhead & Notice */}
              <div className="border-b border-surface-border pb-6 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest-900/5 text-forest-800 border border-forest-700/10">
                    {activePolicy.badge}
                  </span>
                  <span className="text-[11px] text-typography-muted">
                    Effective: {activePolicy.effectiveDate}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-forest-900 pt-2">
                  {activePolicy.title}
                </h2>
              </div>

              {/* Filter Notice when Search Query is Active */}
              {searchQuery && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                  <span>
                    Showing sections matching <strong>"{searchQuery}"</strong> ({filteredSections.length} results)
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="underline text-emerald-900 hover:text-emerald-950 font-medium"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Document Clauses */}
              {filteredSections.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-typography-muted mx-auto" />
                  <p className="text-sm font-semibold text-forest-900">No matching sections found</p>
                  <p className="text-xs text-typography-muted">
                    Try searching for another keyword like "spawn", "refund", "razorpay", or "karnataka".
                  </p>
                </div>
              ) : (
                <div className="space-y-8 divide-y divide-surface-border/60">
                  {filteredSections.map((section, idx) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className={`space-y-3 ${idx > 0 ? 'pt-8' : ''}`}
                    >
                      <h3 className="font-display font-bold text-base sm:text-lg text-forest-900">
                        {section.title}
                      </h3>
                      <div className="text-xs sm:text-sm text-typography-secondary leading-relaxed whitespace-pre-line space-y-2">
                        {section.content}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {/* Document Verification & Authentication Sign-off */}
              <div className="mt-12 pt-8 border-t border-surface-border bg-surface-cream/50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-6 sm:p-10 rounded-b-container space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-forest-900 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized Legal Disclosure</span>
                </div>
                <p className="text-xs text-typography-secondary leading-relaxed">
                  Published and enforced by <strong>Shriyap Enterprise</strong>, Davangere, Karnataka. All rights reserved under the laws of India. For dispute resolution or formal notice serving, address communications to the registered office at Basapura village, Behind Taralabalu school, Davangere-577001.
                </p>
              </div>

            </article>

            {/* Quick Policy Switcher Bar */}
            <div className="bg-surface-white rounded-card p-4 border border-surface-border shadow-level-1 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-typography-muted font-medium">Explore Related Policies:</span>
              <div className="flex flex-wrap items-center gap-2">
                {Object.values(LEGAL_POLICIES)
                  .filter((p) => p.slug !== activeSlug)
                  .map((p) => (
                    <Link
                      key={p.slug}
                      to={`/${p.slug}`}
                      className="px-2.5 py-1 rounded-lg bg-surface-cream hover:bg-forest-800 hover:text-white border border-surface-border transition-colors font-medium text-forest-900"
                    >
                      {p.shortTitle}
                    </Link>
                  ))}
              </div>
            </div>

          </main>

        </div>

      </div>
    </div>
  );
}

