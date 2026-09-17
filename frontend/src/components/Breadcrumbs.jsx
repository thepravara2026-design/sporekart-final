import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Breadcrumbs({ items }) {
  const breadcrumbListSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://sporekart.in/"
      },
      ...items.map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 2,
        "name": item.label,
        "item": `https://sporekart.in${item.path}`
      }))
    ]
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbListSchema)}
        </script>
      </Helmet>

      <nav aria-label="Breadcrumb" className="py-3">
        <ol className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <li>
            <Link to="/" className="hover:text-spore-400 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-spore-400" />
              <span>Home</span>
            </Link>
          </li>

          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;

            return (
              <li key={item.path} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                {isLast ? (
                  <span className="text-spore-300 font-bold" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.path} className="hover:text-spore-400 transition-colors">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
