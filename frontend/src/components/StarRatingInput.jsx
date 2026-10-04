import React, { useState } from 'react';
import { Star } from 'lucide-react';

const SATISFACTION_LABELS = {
  1: 'Very dissatisfied',
  2: 'Dissatisfied',
  3: 'Average',
  4: 'Satisfied',
  5: 'Very satisfied',
};

export default function StarRatingInput({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = true,
  className = '',
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const currentDisplayValue = hoverValue || value || 0;

  const handleKeyDown = (e, rating) => {
    if (readOnly) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange?.(rating);
    } else if (e.key === 'ArrowRight' && rating < 5) {
      e.preventDefault();
      onChange?.(rating + 1);
    } else if (e.key === 'ArrowLeft' && rating > 1) {
      e.preventDefault();
      onChange?.(rating - 1);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div
        className="flex items-center gap-1 focus:outline-none"
        role={readOnly ? 'img' : 'radiogroup'}
        aria-label={`Rating: ${value} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentDisplayValue;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => !readOnly && setHoverValue(0)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              tabIndex={readOnly ? -1 : 0}
              role={readOnly ? 'presentation' : 'radio'}
              aria-checked={value === star}
              aria-label={`${star} star${star > 1 ? 's' : ''} - ${SATISFACTION_LABELS[star]}`}
              className={`transition-all transform ${
                !readOnly
                  ? 'hover:scale-115 focus:scale-115 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full p-0.5 cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <Star
                className={`${starSizes[size] || starSizes.md} transition-colors ${
                  isFilled
                    ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && currentDisplayValue > 0 && (
        <span className="text-xs font-semibold text-amber-700 animate-fadeIn">
          {SATISFACTION_LABELS[currentDisplayValue]} ({currentDisplayValue}/5)
        </span>
      )}
    </div>
  );
}
