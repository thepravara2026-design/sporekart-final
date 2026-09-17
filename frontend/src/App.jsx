import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import PageSkeleton from './components/PageSkeleton';
import { authApi } from './api';
import { reportWebVitals } from './reportWebVitals';

// Code Splitting & Lazy Route Loading
const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const CultivationGuidePage = lazy(() => import('./pages/CultivationGuidePage'));
const SpawnGuidePage = lazy(() => import('./pages/SpawnGuidePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('sporekart_token');
    if (token) {
      authApi.getCurrentUser()
        .then((res) => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('sporekart_token');
          setUser(null);
        });
    }

    // Report Core Web Vitals (LCP, INP, CLS, TTFB)
    reportWebVitals((metric) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Core Web Vitals] ${metric.name}:`, metric.value);
      }
    });
  }, []);

  return (
    <HelmetProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans">
            <Navbar user={user} setUser={setUser} />

            <main id="main-content" tabIndex="-1" className="flex-grow focus:outline-none">
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  {/* Core SEO Routes */}
                  <Route path="/" element={<HomePage />} />
                  
                  {/* Product Catalog & Category Routes */}
                  <Route path="/products" element={<CatalogPage />} />
                  <Route path="/products/fresh-mushrooms" element={<CatalogPage />} />
                  <Route path="/products/dry-mushrooms" element={<CatalogPage />} />
                  <Route path="/products/mushroom-spawn" element={<CatalogPage />} />
                  <Route path="/products/growing-kits" element={<CatalogPage />} />
                  <Route path="/products/:categorySlug" element={<CatalogPage />} />
                  
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  
                  {/* Legacy URL Aliases */}
                  <Route path="/catalog" element={<Navigate to="/products" replace />} />
                  <Route path="/catalog/:slug" element={<CatalogPage />} />

                  {/* Cart & Checkout Routes */}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />

                  {/* Training & Masterclasses Routes */}
                  <Route path="/training" element={<TrainingPage user={user} />} />
                  <Route path="/training/mushroom-cultivation" element={<TrainingPage user={user} />} />
                  <Route path="/training/spawn-production" element={<TrainingPage user={user} />} />
                  <Route path="/training/:courseSlug" element={<CourseDetailPage user={user} />} />

                  {/* Company & Support Routes */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />

                  {/* Blog & Knowledge Center Routes */}
                  <Route path="/blog" element={<BlogIndexPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />

                  {/* Agronomist Guides */}
                  <Route path="/mushroom-cultivation-guide" element={<CultivationGuidePage />} />
                  <Route path="/mushroom-spawn-guide" element={<SpawnGuidePage />} />

                  {/* User Account & Admin Console */}
                  <Route path="/dashboard" element={<DashboardPage user={user} />} />
                  <Route path="/admin" element={<AdminDashboardPage user={user} />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />
            <CartDrawer />
          </div>
        </Router>
      </CartProvider>
    </HelmetProvider>
  );
}
