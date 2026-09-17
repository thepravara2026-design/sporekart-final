import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Package, ShoppingBag, Plus, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { adminApi } from '../api';
import SeoHead from '../components/SeoHead';

export default function AdminDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('cms');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Blog Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Product Form State
  const [productTitle, setProductTitle] = useState('');
  const [productSlug, setProductSlug] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productType, setProductType] = useState('FRESH_MUSHROOM');

  const fetchAdminPosts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBlogPosts();
      setPosts(res.data.data?.content || []);
    } catch (err) {
      console.error('Failed to load admin posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPosts();
  }, []);

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    try {
      await adminApi.createBlogPost({
        title,
        slug,
        summary,
        content,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || summary,
        isIndexable: false,
      });
      setStatusMessage('Blog Post Draft created successfully!');
      setTitle('');
      setSlug('');
      setSummary('');
      setContent('');
      fetchAdminPosts();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create blog post draft');
    }
  };

  const handlePublishPost = async (postId) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await adminApi.publishBlogPost(postId);
      setStatusMessage(`Blog Post ${postId} published successfully! Indexable status updated.`);
      fetchAdminPosts();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to publish post');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    try {
      await adminApi.createProduct({
        title: productTitle,
        slug: productSlug,
        description: productDescription,
        productType: productType,
        status: 'ACTIVE',
      });
      setStatusMessage('Catalog Product created successfully!');
      setProductTitle('');
      setProductSlug('');
      setProductDescription('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create catalog product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SeoHead
        title="Admin Control Center — Sporekart Agritech"
        description="Administrative management portal for Sporekart catalog, content CMS, orders, and training."
        noindex={true}
      />

      {/* Admin Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-600/50 bg-gradient-to-r from-spore-950 via-slate-900 to-spore-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-spore-500/20 border border-spore-500/50 flex items-center justify-center text-spore-400">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-white">Sporekart Admin Console</h1>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-full uppercase tracking-wider">
                ROLE_ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authorized System Administrator • Backend API Base: <code className="text-spore-300">/api/v1/admin</code>
            </p>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {statusMessage && (
        <div className="p-4 bg-spore-950/90 border border-spore-500/60 rounded-2xl text-xs text-spore-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-spore-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-950/80 border border-red-800/60 rounded-2xl text-xs text-red-300 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-spore-800/60 pb-3">
        <button
          onClick={() => setActiveTab('cms')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'cms'
              ? 'bg-spore-500 text-slate-950 shadow-lg'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-spore-800/50'
          }`}
        >
          <FileText className="w-4 h-4" /> Content / Blog CMS Manager
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'catalog'
              ? 'bg-spore-500 text-slate-950 shadow-lg'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-spore-800/50'
          }`}
        >
          <Package className="w-4 h-4" /> Catalog & Product Creator
        </button>
      </div>

      {/* Tab Content: Blog CMS */}
      {activeTab === 'cms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Draft Form */}
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-spore-400" /> Draft New Blog Article
            </h3>
            <form onSubmit={handleCreateBlog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mastering Oyster Mushroom Spawn Storage"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-spore-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">SEO URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mastering-oyster-mushroom-spawn-storage"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-spore-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Short Executive Summary</label>
                <textarea
                  rows={2}
                  placeholder="Summary snippet for search results and social cards..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-spore-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Markdown Body Content *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="## Storage Requirements&#10;Store spawn at 2-4°C refrigeration..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-spore-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-spore-950/40"
              >
                Save Article Draft
              </button>
            </form>
          </div>

          {/* Posts List & Actions */}
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-spore-400" /> Articles Overview ({posts.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {posts.map((post) => (
                <div key={post.id} className="p-4 bg-slate-900/90 rounded-xl border border-spore-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white">{post.title}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${post.status === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{post.summary || post.content}</p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 font-mono">/{post.slug}</span>
                    {post.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handlePublishPost(post.id)}
                        className="px-3 py-1 bg-spore-500/20 hover:bg-spore-500/30 text-spore-300 border border-spore-500/50 font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Publish Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {posts.length === 0 && !loading && (
                <p className="text-xs text-slate-400 text-center py-8">No articles found. Draft one above!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Catalog Manager */}
      {activeTab === 'catalog' && (
        <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 max-w-2xl mx-auto space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-spore-400" /> Create Agritech Catalog Item
          </h3>
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Organic King Oyster Mushrooms"
                value={productTitle}
                onChange={(e) => {
                  setProductTitle(e.target.value);
                  if (!productSlug) setProductSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }}
                className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-spore-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">SEO Slug *</label>
              <input
                type="text"
                required
                placeholder="e.g. organic-king-oyster-mushrooms"
                value={productSlug}
                onChange={(e) => setProductSlug(e.target.value)}
                className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-spore-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Product Type *</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-spore-400"
              >
                <option value="FRESH_MUSHROOM">Fresh Mushroom</option>
                <option value="DRY_MUSHROOM">Dry Mushroom</option>
                <option value="SPAWN_SEED">Mushroom Spawn / Seed</option>
                <option value="GROWING_KIT">DIY Growing Kit</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Description</label>
              <textarea
                rows={4}
                placeholder="Agronomist technical details, harvesting instructions..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-spore-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-spore-500 hover:bg-spore-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-spore-950/40"
            >
              Add Product to Catalog
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
