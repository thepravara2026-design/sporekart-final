import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useLocation, Link } from 'react-router-dom';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
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

  const canonicalUrl = categorySlug
    ? `https://sporekart.in/products/${categorySlug}`
    : "https://sporekart.in/products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <SeoHead
        title="Mushroom Catalog — Fresh Mushrooms, Spawn Seeds & Growing Kits | Sporekart"
        description="Buy fresh organic button & oyster mushrooms, high-yield grain spawn seeds, dehydrated mushrooms, and indoor growing kits online across India."
        canonicalUrl={canonicalUrl}
      />

      <Breadcrumbs
        items={[
          { label: 'Products', path: '/products' },
          ...(categoryParam ? [{ label: categoryParam.replace('-', ' '), path: `/products/${categoryParam}` }] : [])
        ]}
      />

      {/* Catalog Header, Controls & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="font-display font-bold text-3xl text-forest-900 flex items-center gap-3 capitalize">
            <Sprout className="w-8 h-8 text-forest-700 shrink-0" />
            {categoryParam
              ? `${categoryParam.replace(/[-_]/g, ' ')} Catalog`
              : 'Sporekart Product Catalog'}
          </h1>
          <p className="text-typography-secondary text-xs sm:text-sm mt-1">
            Showing <strong className="text-forest-700">{totalElements}</strong> {categoryParam ? categoryParam.replace(/[-_]/g, ' ') : 'laboratory-certified mushroom'} products
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-white border border-surface-border rounded-input px-3 py-2.5 text-xs text-forest-900 font-semibold focus:outline-none focus:border-forest-700 shadow-level-1"
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

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/products"
          className={`px-4 py-2 rounded-input text-xs font-bold transition-all button-press ${
            !categoryParam && !typeParam
              ? 'btn-primary shadow-level-1'
              : 'bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900'
          }`}
        >
          All Products
        </Link>
        {categories.length > 0 ? (
          categories.map((cat) => {
            const catSlugNorm = cat.slug.toLowerCase().replace('_', '-');
            const paramNorm = categoryParam.toLowerCase().replace('_', '-');

            const isSelected = 
              paramNorm === catSlugNorm || 
              categoryParam.toLowerCase() === cat.name.toLowerCase() ||
              (catSlugNorm === 'fresh-mushrooms' && (paramNorm === 'fresh-mushroom' || paramNorm === 'fresh_mushroom' || categoryParam === 'FRESH_MUSHROOM')) ||
              (catSlugNorm === 'dry-mushrooms' && (paramNorm === 'dry-mushroom' || paramNorm === 'dry_mushroom' || categoryParam === 'DRY_MUSHROOM')) ||
              (catSlugNorm === 'spawn-seeds' && (paramNorm === 'spawn-seed' || paramNorm === 'spawn_seed' || categoryParam === 'SPAWN_SEED' || paramNorm === 'mushroom-spawn')) ||
              (catSlugNorm === 'growing-kits' && (paramNorm === 'growing-kit' || paramNorm === 'growing_kit' || categoryParam === 'GROWING_KIT')) ||
              (catSlugNorm === 'equipment-supplies' && (paramNorm === 'equipment-supplies' || paramNorm === 'cultivation-supplies' || paramNorm === 'cultivation-equipment-supplies' || paramNorm === 'equipment_supplies' || categoryParam === 'EQUIPMENT_SUPPLIES'));

            return (
              <Link
                key={cat.id}
                to={`/products/${cat.slug}`}
                className={`px-4 py-2 rounded-input text-xs font-bold transition-all button-press ${
                  isSelected
                    ? 'btn-primary shadow-level-1'
                    : 'bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900'
                }`}
              >
                {cat.name}
              </Link>
            );
          })
        ) : (
          <>
            <Link
              to="/products/fresh-mushrooms"
              className={`px-4 py-2 rounded-input text-xs font-bold transition-all button-press ${
                categoryParam === 'fresh-mushrooms' || categoryParam === 'FRESH_MUSHROOM'
                  ? 'btn-primary shadow-level-1'
                  : 'bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900'
              }`}
            >
              Fresh Mushrooms
            </Link>
            <Link
              to="/products/dry-mushrooms"
              className={`px-4 py-2 rounded-input text-xs font-bold transition-all button-press ${
                categoryParam === 'dry-mushrooms' || categoryParam === 'DRY_MUSHROOM'
                  ? 'btn-primary shadow-level-1'
                  : 'bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900'
              }`}
            >
              Dry Mushrooms
            </Link>
            <Link
              to="/products/spawn-seeds"
              className={`px-4 py-2 rounded-input text-xs font-bold transition-all button-press ${
                categoryParam === 'spawn-seeds' || categoryParam === 'mushroom-spawn' || categoryParam === 'SPAWN_SEED'
                  ? 'btn-primary shadow-level-1'
                  : 'bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900'
              }`}
            >
              Grain Spawn Seeds
            </Link>
            <Link
              to="/products/growing-kits"
              className={`px-4 py-2 rounded-input text-xs font-bold transition-all button-press ${
                categoryParam === 'growing-kits' || categoryParam === 'GROWING_KIT'
                  ? 'btn-primary shadow-level-1'
                  : 'bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900'
              }`}
            >
              DIY Growing Kits
            </Link>
            <Link
              to="/products/equipment-supplies"
              className={`px-4 py-2 rounded-input text-xs font-bold transition-all button-press ${
                categoryParam === 'equipment-supplies' || categoryParam === 'cultivation-supplies' || categoryParam === 'EQUIPMENT_SUPPLIES'
                  ? 'btn-primary shadow-level-1'
                  : 'bg-surface-white border border-surface-border text-typography-secondary hover:bg-surface-cream hover:text-forest-900'
              }`}
            >
              Cultivation Equipment & Supplies
            </Link>
          </>
        )}
      </div>

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
