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
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-feature bg-surface-white border border-surface-border shadow-level-1 max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-container bg-surface-cream border border-surface-border flex items-center justify-center text-forest-700 mb-6 shadow-level-1 animate-pulse">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 opacity-90" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2 font-display">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-typography-secondary max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 btn-primary px-6 py-3 shadow-level-1"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={onActionClick}
            className="inline-flex items-center gap-2 btn-primary px-6 py-3 shadow-level-1"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )
      )}
    </div>
  );
}
