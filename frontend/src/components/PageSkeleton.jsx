import React from 'react';
import { Sprout } from 'lucide-react';

export default function PageSkeleton({ type = "default", count = 6 }) {
  if (type === "cards") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-8 w-48 skeleton-shimmer rounded-input"></div>
          <div className="h-10 w-full sm:w-64 skeleton-shimmer rounded-input"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-card bg-surface-white p-4 space-y-4 border border-surface-border shadow-level-1">
              <div className="aspect-square w-full skeleton-shimmer rounded-card"></div>
              <div className="h-5 w-3/4 skeleton-shimmer rounded-compact"></div>
              <div className="h-4 w-1/2 skeleton-shimmer rounded-compact"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-24 skeleton-shimmer rounded-compact"></div>
                <div className="h-9 w-28 skeleton-shimmer rounded-input"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square w-full skeleton-shimmer rounded-container"></div>
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-20 skeleton-shimmer rounded-input"></div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-6 w-32 skeleton-shimmer rounded-pill"></div>
            <div className="h-10 w-3/4 skeleton-shimmer rounded-input"></div>
            <div className="h-8 w-40 skeleton-shimmer rounded-compact"></div>
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full skeleton-shimmer rounded-micro"></div>
              <div className="h-4 w-5/6 skeleton-shimmer rounded-micro"></div>
              <div className="h-4 w-2/3 skeleton-shimmer rounded-micro"></div>
            </div>
            <div className="h-12 w-full skeleton-shimmer rounded-input pt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-input bg-surface-cream border border-surface-border flex items-center justify-center">
          <Sprout className="w-5 h-5 text-forest-700 animate-spin" />
        </div>
        <div className="h-6 w-48 skeleton-shimmer rounded-compact"></div>
      </div>
      <div className="h-48 w-full skeleton-shimmer rounded-hero"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 skeleton-shimmer rounded-card"></div>
        ))}
      </div>
    </div>
  );
}
