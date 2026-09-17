import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Search, Home, GraduationCap } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function NotFoundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-8">
      <SeoHead
        title="404 — Page Not Found | Sporekart India"
        description="The requested page could not be found on Sporekart."
        noindex={true}
      />

      <div className="w-20 h-20 bg-spore-950 border border-spore-700/50 rounded-3xl mx-auto flex items-center justify-center text-spore-400 shadow-2xl">
        <Sprout className="w-10 h-10" />
      </div>

      <div className="space-y-3">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white">404 — Page Not Found</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          We couldn't find the page or product you were looking for. Explore our fresh mushroom catalog or certified cultivation courses below.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/catalog"
          className="w-full sm:w-auto bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2"
        >
          <Sprout className="w-4 h-4" /> Browse Catalog
        </Link>
        <Link
          to="/training"
          className="w-full sm:w-auto glass-panel text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-spore-700/50"
        >
          <GraduationCap className="w-4 h-4 text-spore-400" /> Training Workshops
        </Link>
      </div>
    </div>
  );
}
