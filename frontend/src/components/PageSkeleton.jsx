import React from 'react';
import { Sprout } from 'lucide-react';

export default function PageSkeleton({ type = "default", count = 6 }) {
  if (type === "cards") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-8 w-48 skeleton-shimmer rounded-xl"></div>
          <div className="h-10 w-full sm:w-64 skeleton-shimmer rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-2xl glass-card p-4 space-y-4 border border-slate-800/80">
              <div className="aspect-square w-full skeleton-shimmer rounded-xl"></div>
              <div className="h-5 w-3/4 skeleton-shimmer rounded-lg"></div>
              <div className="h-4 w-1/2 skeleton-shimmer rounded-lg"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-24 skeleton-shimmer rounded-lg"></div>
                <div className="h-9 w-28 skeleton-shimmer rounded-xl"></div>
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
            <div className="aspect-square w-full skeleton-shimmer rounded-3xl"></div>
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-20 skeleton-shimmer rounded-xl"></div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-6 w-32 skeleton-shimmer rounded-full"></div>
            <div className="h-10 w-3/4 skeleton-shimmer rounded-xl"></div>
            <div className="h-8 w-40 skeleton-shimmer rounded-lg"></div>
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full skeleton-shimmer rounded"></div>
              <div className="h-4 w-5/6 skeleton-shimmer rounded"></div>
              <div className="h-4 w-2/3 skeleton-shimmer rounded"></div>
            </div>
            <div className="h-12 w-full skeleton-shimmer rounded-xl pt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Sprout className="w-5 h-5 text-spore-400 animate-spin" />
        </div>
        <div className="h-6 w-48 skeleton-shimmer rounded-lg"></div>
      </div>
      <div className="h-48 w-full skeleton-shimmer rounded-3xl"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 skeleton-shimmer rounded-2xl"></div>
        ))}
      </div>
    </div>
  );
}
