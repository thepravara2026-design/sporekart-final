import React from 'react';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import ContactSection from '../components/ContactSection';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Contact Sporekart — Shriyap Enterprise, Davangere & Customer Support"
        description="Get in touch with Sporekart (Shriyap Enterprise, Davangere-577001) for fresh mushroom bulk orders, spawn seed inquiries, farm setup consultancy, and workshop enrollments."
        canonicalUrl="https://sporekart.in/contact"
      />

      <Breadcrumbs items={[{ label: 'Contact Us', path: '/contact' }]} />

      <ContactSection 
        title="Contact Sporekart Support & Advisory"
        subtitle="Have questions about spawn seeds, orders, payments, shipments, or masterclass enrollments? Contact us directly or open a support ticket."
      />
    </div>
  );
}
