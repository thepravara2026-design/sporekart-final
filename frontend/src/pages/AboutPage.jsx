import React from 'react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AboutSection from '../components/AboutSection';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="About Sporekart — Shriyap Enterprise, Davangere"
        description="Learn about Sporekart managed by Shriyap Enterprise (Basapura village, Behind Taralabalu school, Davangere-577001). We provide lab-certified mushroom spawn seeds, fresh gourmet mushrooms, and commercial training."
        canonicalUrl="https://sporekart.in/about"
      />

      <Breadcrumbs items={[{ label: 'About Us', path: '/about' }]} />

      <AboutSection showLearnMore={false} />
    </div>
  );
}
