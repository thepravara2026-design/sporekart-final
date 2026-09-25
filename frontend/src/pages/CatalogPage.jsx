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
              ? 'bg-[#16532f] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:text-[#16532f] hover:bg-[#f4f8f4]'
          }`}
        >
          Shop by Category
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
                    ? 'bg-[#16532f] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:text-[#16532f] hover:bg-[#f4f8f4]'
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
                  ? 'bg-[#16532f] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:text-[#16532f] hover:bg-[#f4f8f4]'
              }`}
            >
              Fresh Mushrooms
            </Link>
            <Link
              to="/products/dry-mushrooms"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                categoryParam === 'dry-mushrooms' || categoryParam === 'DRY_MUSHROOM'
                  ? 'bg-[#16532f] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:text-[#16532f] hover:bg-[#f4f8f4]'
              }`}
            >
              Dry Mushrooms
            </Link>
            <Link
              to="/products/spawn-seeds"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                categoryParam === 'spawn-seeds' || categoryParam === 'mushroom-spawn' || categoryParam === 'SPAWN_SEED'
                  ? 'bg-[#16532f] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:text-[#16532f] hover:bg-[#f4f8f4]'
              }`}
            >
              Grain Spawn Seeds
            </Link>
            <Link
              to="/products/growing-kits"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all button-press ${
                categoryParam === 'growing-kits' || categoryParam === 'GROWING_KIT'
                  ? 'bg-[#16532f] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:text-[#16532f] hover:bg-[#f4f8f4]'
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
                className="bg-white rounded-3xl overflow-hidden flex flex-col justify-between border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="p-5 space-y-3">
                    <span className="text-[10px] font-bold text-[#16532f] uppercase tracking-wider block">
                      {product.categoryName || 'SPAWN & SEEDS'}
                    </span>
                    <Link to={`/product/${product.slug}`} className="font-display font-bold text-lg text-gray-900 hover:text-[#16532f] transition-colors block">
                      {product.title}
                    </Link>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{product.description}</p>

                    {product.variants && product.variants.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariants({ ...selectedVariants, [product.id]: v })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                              activeVariant?.id === v.id
                                ? 'bg-[#e2f2e6] border-[#b8e2c2] text-[#16532f] font-bold'
                                : 'bg-[#f4f8f4] border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {v.variantName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between gap-3 mt-2">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-xl text-[#16532f]">
                        ₹{activeVariant?.priceInr || 0}
                      </span>
                      {activeVariant?.compareAtPriceInr && Number(activeVariant.compareAtPriceInr) > Number(activeVariant.priceInr) && (
                        <span className="text-xs text-gray-400 line-through font-medium" data-testid="strikeout-price">
                          ₹{activeVariant.compareAtPriceInr}
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#e2f2e6] text-[#16532f] text-[11px] font-semibold rounded-full">
                      Free shipping
                    </span>
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
                    className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all button-press shrink-0 ${
                      isAvailable && activeVariant && !isMaxInCart
                        ? 'bg-[#16532f] hover:bg-[#124426] text-white shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title={!isAvailable ? 'Out of Stock' : isMaxInCart ? `Max Stock (${currentInCart})` : 'Add to Cart'}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls - matching Image 2 */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-600">
          Showing 1–{products.length} of {totalElements || products.length} products
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 rounded-xl bg-[#f4f8f4] border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-[#e2f2e6] transition-all flex items-center justify-center button-press"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-gray-900 px-3">
            Page {page + 1} of {totalPages || 1}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="w-9 h-9 rounded-xl bg-[#f4f8f4] border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-[#e2f2e6] transition-all flex items-center justify-center button-press"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
