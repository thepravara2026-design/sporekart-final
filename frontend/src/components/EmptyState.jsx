import React from 'react';
import { PackageOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "No Items Found",
  description = "We couldn't find anything matching your request right now.",
  actionText,
  actionLink,
  onActionClick,
  className = ""
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl glass-card border border-slate-800/80 max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-spore-950/80 border border-spore-800/50 flex items-center justify-center text-spore-400 mb-6 shadow-inner animate-pulse">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 opacity-90" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2 font-display">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-slate-400 max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-spore-600 to-emerald-600 hover:from-spore-500 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-spore-950/50 transition-all button-press hover-lift"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={onActionClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-spore-600 to-emerald-600 hover:from-spore-500 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-spore-950/50 transition-all button-press hover-lift"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )
      )}
    </div>
  );
}
