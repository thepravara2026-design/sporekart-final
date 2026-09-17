import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SeoHead({
  title = "Sporekart — India's Premier Mushroom E-Commerce & Cultivation Training Platform",
  description = "Buy fresh & dry mushrooms, lab-certified spawn seeds, and DIY growing kits in India. Join certified mushroom cultivation and spawn production training courses.",
  canonicalUrl = "https://sporekart.in",
  ogType = "website",
  ogImage = "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=80",
  noindex = false,
  structuredData = null,
}) {
  const defaultOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Sporekart Agritech India",
    "url": "https://sporekart.in",
    "logo": "https://sporekart.in/logo.png",
    "sameAs": [
      "https://facebook.com/sporekart",
      "https://twitter.com/sporekart",
      "https://instagram.com/sporekart"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9876543210",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }
  };

  const defaultLocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Sporekart Agritech Center",
    "image": ogImage,
    "telephone": "+91-9876543210",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Agri Tech Park",
      "addressLocality": "Pune",
      "addressRegion": "Maharashtra",
      "postalCode": "411001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 18.5204,
      "longitude": 73.8567
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  };

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content="Sporekart" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Default Organization JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(defaultOrganizationSchema)}
      </script>

      {/* Default LocalBusiness JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(defaultLocalBusinessSchema)}
      </script>

      {/* Custom Page-Specific JSON-LD */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
