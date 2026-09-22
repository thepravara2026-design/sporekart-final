import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';

export default function AvailabilityBadge({ availability, className = '' }) {
  if (!availability) return null;

  let status = 'AVAILABLE';
  let label = 'In Stock';

  if (typeof availability === 'object') {
    status = availability.status || 'AVAILABLE';
    label = availability.label || 'In Stock';
  } else if (typeof availability === 'string') {
    status = availability.toUpperCase();
    label = availability;
  }

  const getTheme = () => {
    switch (status) {
      case 'AVAILABLE':
      case 'IN_STOCK':
        return {
          bg: 'bg-emerald-950/70 border-emerald-800/50 text-emerald-400',
          dot: 'bg-emerald-400 animate-pulse',
          icon: CheckCircle2,
          defaultLabel: 'In Stock'
        };
      case 'LIMITED_STOCK':
        return {
          bg: 'bg-amber-950/70 border-amber-800/50 text-amber-300',
          dot: 'bg-amber-400 animate-pulse',
          icon: AlertTriangle,
          defaultLabel: 'Limited Stock'
        };
      case 'LOW_STOCK':
        return {
          bg: 'bg-orange-950/70 border-orange-800/50 text-orange-400',
          dot: 'bg-orange-400 animate-pulse',
          icon: AlertCircle,
          defaultLabel: 'Low Stock'
        };
      case 'OUT_OF_STOCK':
        return {
          bg: 'bg-rose-950/70 border-rose-800/50 text-rose-400',
          dot: 'bg-rose-500',
          icon: XCircle,
          defaultLabel: 'Out of Stock'
        };
      default:
        return {
          bg: 'bg-emerald-950/70 border-emerald-800/50 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
          defaultLabel: 'In Stock'
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;
  const displayLabel = label || theme.defaultLabel;

  return (
    <span
      data-testid="product-availability"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide backdrop-blur-md shadow-sm transition-all duration-200 ${theme.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
      <Icon className="w-3.5 h-3.5 opacity-90" />
      <span>{displayLabel}</span>
    </span>
  );
}
