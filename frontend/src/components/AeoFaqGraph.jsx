import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, BookOpen, Package, GraduationCap, ArrowRight, Share2, CheckCircle2 } from 'lucide-react';

export default function AeoFaqGraph({ faqs = [], title = "Answer Engine Knowledge Graph (AEO)" }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-700/50 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-spore-800/60 pb-4">
        <div>
          <span className="px-3 py-1 bg-spore-950 text-spore-300 text-[11px] font-bold rounded-full border border-spore-700/50 uppercase tracking-wider">
            AEO Content Graph Architecture
          </span>
          <h2 className="font-display font-bold text-2xl text-white mt-1.5 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-spore-400" /> {title}
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {faqs.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.id || idx}
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? 'bg-slate-900/90 border-spore-500/50 shadow-lg shadow-spore-950/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-spore-500/20 text-spore-300 text-xs font-extrabold flex items-center justify-center shrink-0 border border-spore-500/40">
                    Q{idx + 1}
                  </span>
                  <h3 className="font-display font-bold text-base sm:text-lg text-white">
                    {item.question}
                  </h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-spore-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Answer & Graph Links Body */}
              {isOpen && (
                <div className="px-5 pb-6 space-y-6 border-t border-slate-800/80 pt-4 animate-fade-in text-xs sm:text-sm">
                  {/* Direct Authoritative Answer */}
                  <div className="p-4 rounded-xl bg-spore-950/80 border border-spore-600/50 text-spore-200 font-medium leading-relaxed flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-spore-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-spore-400 block text-xs uppercase tracking-wider mb-0.5">Authoritative Answer:</span>
                      <p>{item.answer}</p>
                    </div>
                  </div>

                  {/* Interlinked AEO Graph Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                    {/* Related Questions Column */}
                    {item.relatedQuestions && item.relatedQuestions.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                        <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-spore-400">
                          <HelpCircle className="w-3.5 h-3.5" /> Related Questions
                        </h4>
                        <ul className="space-y-1.5">
                          {item.relatedQuestions.map((rq, rIdx) => (
                            <li key={rIdx}>
                              <a
                                href={rq.anchor || '#'}
                                className="text-slate-300 hover:text-spore-300 transition-colors flex items-center gap-1 leading-snug"
                              >
                                <ArrowRight className="w-3 h-3 text-spore-500 shrink-0" /> {rq.question}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Related Articles & Guides Column */}
                    {item.relatedArticles && item.relatedArticles.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                        <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-spore-400">
                          <BookOpen className="w-3.5 h-3.5" /> Agronomist Articles
                        </h4>
                        <ul className="space-y-1.5">
                          {item.relatedArticles.map((ra, aIdx) => (
                            <li key={aIdx}>
                              <Link
                                to={ra.path}
                                className="text-slate-300 hover:text-spore-300 transition-colors flex items-center gap-1 line-clamp-1"
                              >
                                <ArrowRight className="w-3 h-3 text-spore-500 shrink-0" /> {ra.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Related Products & Training Courses Column */}
                    {item.relatedProducts && item.relatedProducts.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                        <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-spore-400">
                          <Package className="w-3.5 h-3.5" /> Products & Courses
                        </h4>
                        <ul className="space-y-1.5">
                          {item.relatedProducts.map((rp, pIdx) => (
                            <li key={pIdx}>
                              <Link
                                to={rp.path}
                                className="text-spore-300 font-bold hover:underline flex items-center justify-between gap-2"
                              >
                                <span className="line-clamp-1 text-slate-200 hover:text-spore-300">{rp.title}</span>
                                {rp.price && <span className="text-[11px] bg-spore-900 px-1.5 py-0.5 rounded text-spore-400 shrink-0">{rp.price}</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
