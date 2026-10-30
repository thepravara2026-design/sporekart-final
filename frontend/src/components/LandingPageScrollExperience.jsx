import React, { useState, useEffect } from 'react';

/**
 * LandingPageScrollExperience
 * 
 * Provides smooth, organic, scoped scroll animations exclusively for the landing page:
 * 1. Scoped smooth scrolling behaviour enabled only while the landing page is mounted.
 * 2. Elegant top-edge reading progress indicator.
 * 3. Fluid scroll-driven section reveal animations via IntersectionObserver.
 * 
 * All effects are automatically cleaned up on unmount so no other pages are affected.
 */
export default function LandingPageScrollExperience() {
  const [scrollProgress, setScrollProgress] = useState(0);

  // 1. Scope smooth-scrolling to landing page only
  useEffect(() => {
    const root = document.documentElement;
    const prevScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'smooth';
    root.classList.add('landing-page-scroll-active');

    return () => {
      root.style.scrollBehavior = prevScrollBehavior || '';
      root.classList.remove('landing-page-scroll-active');
    };
  }, []);

  // 2. Track scroll progress for the top ambient bar
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset || 0;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(Math.max((scrollY / docHeight) * 100, 0), 100) : 0;
          
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Scroll reveal observer for elements with .landing-scroll-reveal
  useEffect(() => {
    // Respect reduced motion settings
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      document.querySelectorAll('.landing-scroll-reveal').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.landing-scroll-reveal').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const revealElements = document.querySelectorAll('.landing-scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    /* Slim Top Ambient Reading Progress Bar */
    <div 
      className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none"
      aria-hidden="true"
    >
      <div 
        className="h-full bg-gradient-to-r from-emerald-500 via-forest-600 to-amber-500 shadow-[0_0_8px_rgba(47,107,69,0.45)] transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}
