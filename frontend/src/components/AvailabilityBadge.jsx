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
          bg: 'bg-green-600/10 border-green-600/30 text-green-600',
          dot: 'bg-green-600 animate-pulse',
          icon: CheckCircle2,
          defaultLabel: 'In Stock'
        };
      case 'LIMITED_STOCK':
        return {
          bg: 'bg-gold/15 border-gold/40 text-soil',
          dot: 'bg-gold animate-pulse',
          icon: AlertTriangle,
          defaultLabel: 'Limited Stock'
        };
      case 'LOW_STOCK':
        return {
          bg: 'bg-soil/15 border-soil/30 text-soil',
          dot: 'bg-soil animate-pulse',
          icon: AlertCircle,
          defaultLabel: 'Low Stock'
        };
      case 'OUT_OF_STOCK':
        return {
          bg: 'bg-surface-neutral border-surface-border text-typography-muted',
          dot: 'bg-typography-muted',
          icon: XCircle,
          defaultLabel: 'Out of Stock'
        };
      default:
        return {
          bg: 'bg-green-600/10 border-green-600/30 text-green-600',
          dot: 'bg-green-600',
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border text-xs font-semibold tracking-wide shadow-level-1 transition-all duration-200 ${theme.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
      <Icon className="w-3.5 h-3.5 opacity-90" />
      <span>{displayLabel}</span>
    </span>
  );
}
