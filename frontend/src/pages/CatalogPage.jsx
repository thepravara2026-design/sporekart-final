import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Sprout, Search, ShoppingBag, X, ChevronLeft, ChevronRight, ArrowUpDown, Sparkles, Flame, Star } from 'lucide-react';
import { catalogApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AvailabilityBadge from '../components/AvailabilityBadge';
import PageSkeleton from '../components/PageSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import MediaImage from '../components/MediaImage';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export default function CatalogPage({ onAddToCart: propOnAddToCart }) {
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const location = useLocation();
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();

  // Multi-tier category extraction from URL searchParams, route params, or path segment
  const rawPath = location.pathname.replace(/^\/products\/?/, '').replace(/^\/catalog\/?/, '').trim();
  const pathCategory = rawPath.split('/')[0] || '';
  const categoryParam = searchParams.get('category') || categorySlug || (pathCategory && pathCategory !== 'products' && pathCategory !== 'catalog' ? pathCategory : '');
  const typeParam = searchParams.get('type') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('newest');

  // Keep searchQuery in sync with URL searchParams if URL changes
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || '';
    setSearchQuery(q);
  }, [searchParams]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});

  // Load backend categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await catalogApi.getCategories();
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Reset page to 0 on filter / search changes
  useEffect(() => {
    setPage(0);
  }, [categoryParam, typeParam, searchQuery, sortBy]);

  useEffect(() => {
    const fetchCatalogProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await catalogApi.searchProducts({
          category: categoryParam,
          type: typeParam,
          q: searchQuery,
          page,
          size: pageSize,
          sortBy,
        });

        if (response.data && response.data.success) {
          const pageData = response.data.data;
          if (pageData && pageData.content) {
            setProducts(pageData.content);
            setTotalPages(pageData.totalPages || 1);
            setTotalElements(pageData.totalElements || 0);

            const initialVariants = {};
            pageData.content.forEach((p) => {
              if (p.variants && p.variants.length > 0) {
                initialVariants[p.id] = p.variants[0];
              }
            });
            setSelectedVariants(initialVariants);
          } else if (Array.isArray(pageData)) {
            setProducts(pageData);
            setTotalPages(1);
            setTotalElements(pageData.length);
          }
        }
      } catch (err) {
        console.error('Failed to load paginated catalog:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogProducts();
  }, [categoryParam, typeParam, searchQuery, sortBy, page, pageSize]);

  // Clean active category display name derivation
  const matchedCategory = categories.find((c) => {
    const catSlugNorm = c.slug?.toLowerCase().replace('_', '-');
    const paramNorm = categoryParam?.toLowerCase().replace('_', '-');
    return catSlugNorm === paramNorm || c.name?.toLowerCase() === categoryParam?.toLowerCase();
  });

  const activeCategoryDisplayName = matchedCategory 
    ? matchedCategory.name 
    : (categoryParam || '')
        .replace(/[-_]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

  const canonicalUrl = categorySlug
    ? `https://sporekart.in/products/${categorySlug}`
    : "https://sporekart.in/products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-16 space-y-6 sm:space-y-8 animate-fade-in">
      <SeoHead
        title="Mushroom Catalog — Fresh Mushrooms, Spawn Seeds & Growing Kits | Sporekart"
        description="Buy fresh organic button & oyster mushrooms, high-yield grain spawn seeds, dehydrated mushrooms, and indoor growing kits online across India."
        canonicalUrl={canonicalUrl}
      />

      {/* Breadcrumbs with clean Category Name */}
      <Breadcrumbs
        items={[
          { label: 'Products', path: '/products' },
          ...(categoryParam ? [{ label: activeCategoryDisplayName, path: `/products/${categoryParam}` }] : [])
        ]}
      />

      {/* Catalog Header, Controls & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-forest-900 flex items-center gap-2.5 sm:gap-3">
            <Sprout className="w-7 h-7 sm:w-8 sm:h-8 text-forest-700 shrink-0" />
            <span>
              {categoryParam
                ? `${activeCategoryDisplayName} Catalog`
                : 'Sporekart Product Catalog'}
            </span>
          </h1>
          <p className="text-typography-secondary text-xs sm:text-sm mt-1">
            Showing <strong className="text-forest-700">{totalElements}</strong> {categoryParam ? activeCategoryDisplayName.toLowerCase() : 'laboratory-certified mushroom'} products
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-white border border-surface-border rounded-input px-3 py-2.5 text-xs text-forest-900 font-semibold focus:outline-none focus:border-forest-700 shadow-level-1 cursor-pointer"
              aria-label="Sort products by price or date"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Local Filter Input */}
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-typography-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search spawn, button, oyster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-white border border-surface-border rounded-input pl-10 pr-10 py-2.5 text-xs text-forest-900 placeholder-typography-muted focus:outline-none focus:border-forest-700 shadow-level-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-typography-muted hover:text-forest-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Section: Focused Active Category Bar when a category is selected, or Discovery Pills when viewing all products */}
      {categoryParam ? (
        /* Modern Creative Active Category Bar (No other category pills shown) */
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 rounded-2xl bg-surface-white border border-surface-border shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-typography-muted font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Category:</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-900 text-white font-bold text-xs shadow-level-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeCategoryDisplayName}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-surface-cream text-forest-800 text-[11px] font-bold border border-surface-border">
              {totalElements} {totalElements === 1 ? 'Product' : 'Products'} Available
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Switch Category Dropdown */}
            {categories.length > 1 && (
              <select
                value={categoryParam}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    navigate('/products');
                  } else {
                    navigate(`/products/${e.target.value}`);
                  }
                }}
                className="text-xs font-semibold bg-surface-cream border border-surface-border rounded-full px-3.5 py-1.5 text-forest-900 hover:border-forest-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs cursor-pointer"
                aria-label="Switch to another category"
              >
                <option value={categoryParam}>Switch Category...</option>
                <option value="all">All Products</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            {/* Clear Filter & View All Button */}
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-forest-800 bg-surface-cream hover:bg-forest-900 hover:text-white border border-surface-border transition-all shadow-xs group cursor-pointer"
              title="Clear category filter and view all products"
            >
              <X className="w-3.5 h-3.5 text-forest-700 group-hover:text-white transition-colors" />
              <span>View All Products</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Discovery Category Pills when browsing All Products */
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 pb-2">
          <Link
            to="/products"
            className="px-4 py-2 rounded-full text-xs font-bold transition-all btn-primary shadow-level-1 shrink-0"
          >
            All Products
          </Link>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <Link
                key={cat.id || cat.slug}
                to={`/products/${cat.slug}`}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900 shadow-xs shrink-0"
              >
                {cat.name}
              </Link>
            ))
          ) : (
            <>
              <Link
                to="/products/fresh-mushrooms"
                className="px-4 py-2 rounded-full text-xs font-bold transition-all bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900 shadow-xs shrink-0"
              >
                Fresh Mushrooms
              </Link>
              <Link
                to="/products/dry-mushrooms"
                className="px-4 py-2 rounded-full text-xs font-bold transition-all bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900 shadow-xs shrink-0"
              >
                Dry Mushrooms
              </Link>
              <Link
                to="/products/spawn-seeds"
                className="px-4 py-2 rounded-full text-xs font-bold transition-all bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900 shadow-xs shrink-0"
              >
                Grain Spawn Seeds
              </Link>
              <Link
                to="/products/growing-kits"
                className="px-4 py-2 rounded-full text-xs font-bold transition-all bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900 shadow-xs shrink-0"
              >
                DIY Growing Kits
              </Link>
              <Link
                to="/products/equipment-supplies"
                className="px-4 py-2 rounded-full text-xs font-bold transition-all bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900 shadow-xs shrink-0"
              >
                Cultivation Equipment & Supplies
              </Link>
            </>
          )}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <PageSkeleton type="cards" count={6} />
      ) : error ? (
        <ErrorState
          title="Catalog Loading Error"
          message="Failed to load product catalog. Please check your connection and try again."
          onRetry={() => {
            setError(false);
            setPage(0);
          }}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No Products Found"
          description={searchQuery ? `No products match "${searchQuery}". Try adjusting your search or filters.` : "No products available in this category at the moment."}
          actionText="Clear Filters"
          actionLink="/products"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={propOnAddToCart}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-border">
          <p className="text-xs text-typography-secondary">
            Page <strong className="text-forest-900">{page + 1}</strong> of <strong className="text-forest-900">{totalPages}</strong> ({totalElements} items total)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2.5 rounded-input bg-surface-white border border-surface-border text-typography-primary disabled:opacity-40 hover:bg-surface-cream transition-all flex items-center gap-1 text-xs font-semibold button-press"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Desktop Page Numbers */}
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-9 h-9 rounded-input text-xs font-bold transition-all button-press ${
                    page === i
                      ? 'btn-primary shadow-level-1'
                      : 'bg-surface-white border border-surface-border text-typography-secondary hover:text-forest-900'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2.5 rounded-input bg-surface-white border border-surface-border text-typography-primary disabled:opacity-40 hover:bg-surface-cream transition-all flex items-center gap-1 text-xs font-semibold button-press"
              aria-label="Next Page"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
