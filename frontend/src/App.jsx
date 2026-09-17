import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import TrainingPage from './pages/TrainingPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BlogIndexPage from './pages/BlogIndexPage';
import BlogPostPage from './pages/BlogPostPage';
import CultivationGuidePage from './pages/CultivationGuidePage';
import SpawnGuidePage from './pages/SpawnGuidePage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import { authApi } from './api';

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
  }, []);

  return (
    <HelmetProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans">
            <Navbar user={user} setUser={setUser} />

            <main className="flex-grow">
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

                {/* User Account & Fallback */}
                <Route path="/dashboard" element={<DashboardPage user={user} />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            <Footer />
            <CartDrawer />
          </div>
        </Router>
      </CartProvider>
    </HelmetProvider>
  );
}
