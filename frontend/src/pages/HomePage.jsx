import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi } from '../api';
import SeoHead from '../components/SeoHead';
import CircularCategoryNav from '../components/CircularCategoryNav';
import HeroCarousel from '../components/HeroCarousel';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import BestSellersSection from '../components/BestSellersSection';
import AllProductsSection from '../components/AllProductsSection';
import FloatingOrderBar from '../components/FloatingOrderBar';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useCart } from '../context/CartContext';

export default function HomePage({ user: propUser, onAddToCart: propOnAddToCart }) {
  const { addToCart } = useCart();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(propUser || null);
  const { addItem: trackView } = useRecentlyViewed(currentUser);

  // Authenticate user for personalized browsing history
  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
      return;
    }
    const token = localStorage.getItem('sporekart_token');
    if (token) {
      authApi.getCurrentUser()
        .then((res) => {
          if (res.data?.data) setCurrentUser(res.data.data);
        })
        .catch(() => setCurrentUser(null));
    } else {
      setCurrentUser(null);
    }
  }, [propUser]);

  // Hash anchor navigation smooth scrolling (e.g. /#all-products, /#bestsellers)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          const yOffset = -80;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }, 120);
      }
    }
  }, [location]);

  const handleAddToCart = (product, variant) => {
    if (propOnAddToCart) {
      propOnAddToCart(product, variant);
    } else if (variant?.id) {
      const stock = variant.stockQuantity !== undefined ? variant.stockQuantity : 999;
      addToCart(variant.id, 1, stock);
    }
  };

  const handleTrackView = (item) => {
    if (item) {
      trackView(item);
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sporekart",
    "url": "https://sporekart.in",
    "description": "Premium Indian agritech brand offering daily harvested gourmet mushrooms, 1st-generation pure wheat grain spawn, and certified commercial grower training.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sporekart.in/products?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-surface-cream text-typography-primary pb-24 md:pb-16 relative">
      <SeoHead
        title="Sporekart — Fresh Mushrooms, Pure Grain Spawn & Certified Grower Training in India"
        description="Fresh gourmet button & oyster mushrooms harvested daily at 5:00 AM, 1st-generation pure wheat grain spawn with 99.8% viability, and certified grower masterclasses in Davangere, Karnataka."
        canonicalUrl="https://sporekart.in"
        structuredData={websiteSchema}
      />

      {/* Layer 3 Navigation: Circular Product Category Discovery */}
      <CircularCategoryNav />

      {/* 1. Four-Slide Automatic Hero Carousel */}
      <div id="hero" className="scroll-mt-20">
        <HeroCarousel />
      </div>

      {/* 2. Personalized Recently Viewed Section (Products & Training) */}
      <RecentlyViewedSection user={currentUser} />

      {/* 3. Best Sellers Section (6-10 Products from Actual Completed Orders) */}
      <div id="bestsellers" className="scroll-mt-24">
        <BestSellersSection 
          onAddToCart={handleAddToCart}
          onTrackView={handleTrackView}
        />
      </div>

      {/* 4. All Products Discovery Grid with Functional Pagination */}
      <div id="all-products" className="scroll-mt-24">
        <AllProductsSection 
          onAddToCart={handleAddToCart}
          onTrackView={handleTrackView}
        />
      </div>

      {/* 5. Fixed Bottom Floating Order Now + WhatsApp Conversion Bar */}
      <FloatingOrderBar />
    </div>
  );
}
