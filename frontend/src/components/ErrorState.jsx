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
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-feature bg-surface-white border border-rose-200 shadow-level-1 max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-container bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-6 shadow-level-1">
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2 font-display">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-typography-secondary max-w-md mb-8 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 btn-secondary px-5 py-2.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
        {showHomeButton && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 shadow-level-1"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        )}
      </div>
    </div>
  );
}
