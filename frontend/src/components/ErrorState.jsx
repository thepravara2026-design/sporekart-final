import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ErrorState({
  title = "Something Went Wrong",
  message = "We encountered an issue loading this information. Please check your connection and try again.",
  onRetry,
  showHomeButton = true,
  className = ""
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl glass-card border border-rose-900/30 max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mb-6 shadow-inner">
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2 font-display">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-slate-400 max-w-md mb-8 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-all button-press"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
        {showHomeButton && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-spore-600 hover:bg-spore-500 text-white font-medium transition-all button-press"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        )}
      </div>
    </div>
  );
}
