import React from 'react';
import { Sprout } from 'lucide-react';

export default function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Sprout className="w-5 h-5 text-spore-600 animate-spin" />
        </div>
        <div className="h-6 w-48 bg-slate-900 rounded-lg"></div>
      </div>
      <div className="h-40 bg-slate-900/60 rounded-3xl border border-slate-800/80"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-900/40 rounded-2xl border border-slate-800/60"></div>
        <div className="h-64 bg-slate-900/40 rounded-2xl border border-slate-800/60"></div>
        <div className="h-64 bg-slate-900/40 rounded-2xl border border-slate-800/60"></div>
      </div>
    </div>
  );
}
