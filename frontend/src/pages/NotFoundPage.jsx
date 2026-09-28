import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Search, Home, GraduationCap } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function NotFoundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-8 text-typography-primary">
      <SeoHead
        title="404 — Page Not Found | Sporekart India"
        description="The requested page could not be found on Sporekart."
        noindex={true}
      />

      <div className="w-20 h-20 bg-forest-900/10 border border-forest-900/20 rounded-3xl mx-auto flex items-center justify-center text-forest-700 shadow-level-1">
        <Sprout className="w-10 h-10" />
      </div>

      <div className="space-y-3">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-typography-primary">404 — Page Not Found</h1>
        <p className="text-typography-secondary text-sm max-w-md mx-auto">
          We couldn't find the page or product you were looking for. Explore our fresh mushroom catalog or certified cultivation courses below.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/catalog"
          className="w-full sm:w-auto btn-primary px-6 py-3 text-xs font-bold flex items-center justify-center gap-2"
        >
          <Sprout className="w-4 h-4" /> Browse Catalog
        </Link>
        <Link
          to="/training"
          className="w-full sm:w-auto btn-secondary px-6 py-3 text-xs font-bold flex items-center justify-center gap-2"
        >
          <GraduationCap className="w-4 h-4 text-forest-700" /> Training Workshops
        </Link>
      </div>
    </div>
  );
}
