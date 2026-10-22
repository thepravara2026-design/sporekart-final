import React from 'react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AboutSection from '../components/AboutSection';
import FarmTechnologySection from '../components/FarmTechnologySection';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-16 space-y-6 sm:space-y-8">
      <SeoHead
        title="About Sporekart — Shriyap Enterprise, Davangere"
        description="Learn about Sporekart managed by Shriyap Enterprise (Basapura village, Behind Taralabalu school, Davangere-577001). We provide lab-certified mushroom spawn seeds, fresh gourmet mushrooms, and commercial training."
        canonicalUrl="https://sporekart.in/about"
      />

      <Breadcrumbs items={[{ label: 'About Us', path: '/about' }]} />

      {/* Corporate Overview & Enterprise Info */}
      <AboutSection showLearnMore={false} isH1={true} />

      {/* Cultivation Facility & Agritech Showcase */}
      <div className="bg-surface-white rounded-hero p-4 sm:p-8 border border-surface-border shadow-level-1">
        <FarmTechnologySection showLearnMore={false} isContained={true} />
      </div>
    </div>
  );
}
