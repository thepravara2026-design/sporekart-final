import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Sprout, Search, ShoppingBag, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { catalogApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AvailabilityBadge from '../components/AvailabilityBadge';
import PageSkeleton from '../components/PageSkeleton';
import EmptyState from '../components/EmptyState';
import MediaImage from '../components/MediaImage';
import { useCart } from '../context/CartContext';

export default function CatalogPage({ onAddToCart: propOnAddToCart }) {
  const { addToCart, cart } = useCart();
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();

  const categoryParam = searchParams.get('category') || categorySlug || '';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-spore-800/40">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white flex items-center gap-3">
            <Sprout className="w-8 h-8 text-spore-400" /> Sporekart Product Catalog
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Showing <strong className="text-spore-300">{totalElements}</strong> laboratory-certified mushroom products
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-spore-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-spore-400"
              aria-label="Sort products by price or date"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Local Filter Input */}
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search spawn, button, oyster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-spore-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
            !categoryParam && !typeParam
              ? 'bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 shadow-lg shadow-spore-950/40'
              : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900 hover:text-white'
          }`}
        >
          All Products
        </Link>
        {categories.length > 0 ? (
          categories.map((cat) => {
            const isSelected = categoryParam.toLowerCase() === cat.slug.toLowerCase() || categoryParam.toLowerCase() === cat.name.toLowerCase();
            return (
              <Link
                key={cat.id}
                to={`/products/${cat.slug}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                  isSelected
                    ? 'bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 shadow-lg shadow-spore-950/40'
                    : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900 hover:text-white'
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                categoryParam === 'fresh-mushrooms' || categoryParam === 'FRESH_MUSHROOM'
                  ? 'bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 shadow-lg shadow-spore-950/40'
                  : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900 hover:text-white'
              }`}
            >
              Fresh Mushrooms
            </Link>
            <Link
              to="/products/dry-mushrooms"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                categoryParam === 'dry-mushrooms' || categoryParam === 'DRY_MUSHROOM'
                  ? 'bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 shadow-lg shadow-spore-950/40'
                  : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900 hover:text-white'
              }`}
            >
              Dry Mushrooms
            </Link>
            <Link
              to="/products/spawn-seeds"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                categoryParam === 'spawn-seeds' || categoryParam === 'mushroom-spawn' || categoryParam === 'SPAWN_SEED'
                  ? 'bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 shadow-lg shadow-spore-950/40'
                  : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900 hover:text-white'
              }`}
            >
              Grain Spawn Seeds
            </Link>
            <Link
              to="/products/growing-kits"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                categoryParam === 'growing-kits' || categoryParam === 'GROWING_KIT'
                  ? 'bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 shadow-lg shadow-spore-950/40'
                  : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900 hover:text-white'
              }`}
            >
              DIY Growing Kits
            </Link>
          </>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <PageSkeleton type="cards" count={6} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No Products Found"
          description={searchQuery ? `No products match "${searchQuery}". Try adjusting your search or filters.` : "No products available in this category at the moment."}
          actionText="Clear Filters"
          actionLink="/products"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const activeVariant = selectedVariants[product.id] || product.variants?.[0];
            const stock = activeVariant?.stockQuantity !== undefined ? activeVariant.stockQuantity : 999;
            const currentInCart = cart?.items?.find((i) => i.variantId === activeVariant?.id)?.quantity || 0;
            const isMaxInCart = currentInCart >= stock && stock > 0;
            const image = product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80';
            const availability = activeVariant?.availability || {
              status: (stock > 0 || !activeVariant) ? 'AVAILABLE' : 'OUT_OF_STOCK',
              label: (stock > 0 || !activeVariant) ? 'In Stock' : 'Out of Stock'
            };
            const isAvailable = availability.status !== 'OUT_OF_STOCK' && stock > 0;

            return (
              <div 
                key={product.id} 
                data-testid="product-card"
                className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-spore-800/40 group hover-lift"
              >
                <div>
                  <Link to={`/product/${product.slug}`} className="relative h-56 overflow-hidden block">
                    <MediaImage
                      src={image}
                      alt={`${product.title} - Fresh mushroom supply India`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-spore-300 text-[10px] font-bold rounded-xl border border-spore-700/50 uppercase tracking-wider">
                      {product.categoryName}
                    </span>
                    <div className="absolute top-3 right-3">
                      <AvailabilityBadge availability={availability} />
                    </div>
                  </Link>

                  <div className="p-5 space-y-3">
                    <Link to={`/product/${product.slug}`} className="font-display font-bold text-lg text-white group-hover:text-spore-300 transition-colors block">
                      {product.title}
                    </Link>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{product.description}</p>

                    {product.variants && product.variants.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariants({ ...selectedVariants, [product.id]: v })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                              activeVariant?.id === v.id
                                ? 'bg-spore-950 border-spore-400 text-spore-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {v.variantName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-slate-900 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-xl text-white">
                        ₹{activeVariant?.priceInr || 0}
                      </span>
                      {activeVariant?.compareAtPriceInr && Number(activeVariant.compareAtPriceInr) > Number(activeVariant.priceInr) && (
                        <span className="text-xs text-slate-500 line-through font-medium" data-testid="strikeout-price">
                          ₹{activeVariant.compareAtPriceInr}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    data-testid="add-to-cart"
                    onClick={() => {
                      if (isAvailable && activeVariant && !isMaxInCart) {
                        if (propOnAddToCart) propOnAddToCart(product, activeVariant);
                        else addToCart(activeVariant.id, 1, stock);
                      }
                    }}
                    disabled={!isAvailable || !activeVariant || isMaxInCart}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all button-press ${
                      isAvailable && activeVariant && !isMaxInCart
                        ? 'bg-gradient-to-r from-spore-500 to-emerald-500 hover:from-spore-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-spore-950'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {!isAvailable ? 'Out of Stock' : isMaxInCart ? `Max Stock (${currentInCart})` : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-spore-800/40">
          <p className="text-xs text-slate-400">
            Page <strong className="text-white">{page + 1}</strong> of <strong className="text-white">{totalPages}</strong> ({totalElements} items total)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2.5 rounded-xl bg-slate-900 border border-spore-800 text-slate-300 disabled:opacity-40 hover:bg-spore-900 transition-all flex items-center gap-1 text-xs font-bold button-press"
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
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all button-press ${
                    page === i
                      ? 'bg-gradient-to-r from-spore-500 to-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2.5 rounded-xl bg-slate-900 border border-spore-800 text-slate-300 disabled:opacity-40 hover:bg-spore-900 transition-all flex items-center gap-1 text-xs font-bold button-press"
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
