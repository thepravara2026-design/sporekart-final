import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Sprout, Search, ShoppingBag, Check } from 'lucide-react';
import { catalogApi } from '../api';
import SeoHead from '../components/SeoHead';
import Breadcrumbs from '../components/Breadcrumbs';

export default function CatalogPage({ onAddToCart }) {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  let activeTypeFilter = searchParams.get('type') || '';
  if (categorySlug === 'fresh-mushrooms') activeTypeFilter = 'FRESH_MUSHROOM';
  else if (categorySlug === 'dry-mushrooms') activeTypeFilter = 'DRY_MUSHROOM';
  else if (categorySlug === 'mushroom-spawn') activeTypeFilter = 'SPAWN_SEED';
  else if (categorySlug === 'growing-kits') activeTypeFilter = 'GROWING_KIT';

  const categoryFilter = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          catalogApi.getProducts(activeTypeFilter, categoryFilter),
          catalogApi.getCategories(),
        ]);
        setProducts(prodRes.data.data || []);
        setCategories(catRes.data.data || []);

        const initialVariants = {};
        (prodRes.data.data || []).forEach((p) => {
          if (p.variants && p.variants.length > 0) {
            initialVariants[p.id] = p.variants[0];
          }
        });
        setSelectedVariants(initialVariants);
      } catch (err) {
        console.error('Failed to load catalog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTypeFilter, categoryFilter]);

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canonicalUrl = categorySlug
    ? `https://sporekart.in/products/${categorySlug}`
    : "https://sporekart.in/products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Mushroom Catalog — Fresh Mushrooms, Spawn Seeds & Growing Kits | Sporekart"
        description="Buy fresh organic button & oyster mushrooms, high-yield grain spawn seeds, dehydrated mushrooms, and indoor growing kits online across India."
        canonicalUrl={canonicalUrl}
      />

      <Breadcrumbs
        items={[
          { label: 'Products', path: '/products' },
          ...(categorySlug ? [{ label: categorySlug.replace('-', ' '), path: `/products/${categorySlug}` }] : [])
        ]}
      />

      {/* Catalog Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-spore-800/40">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white flex items-center gap-3">
            <Sprout className="w-8 h-8 text-spore-400" /> Sporekart Product Catalog
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Explore fresh mushrooms, lab-certified grain spawn, dehydrated gourmet slices & home kits
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search spawn, button, oyster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-spore-700/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-spore-400"
          />
        </div>
      </div>

      {/* Type Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/products"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            !categorySlug && !activeTypeFilter
              ? 'bg-spore-500 text-slate-950 shadow-lg'
              : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900'
          }`}
        >
          All Products
        </Link>
        <Link
          to="/products/fresh-mushrooms"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            categorySlug === 'fresh-mushrooms' || activeTypeFilter === 'FRESH_MUSHROOM'
              ? 'bg-spore-500 text-slate-950 shadow-lg'
              : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900'
          }`}
        >
          Fresh Mushrooms
        </Link>
        <Link
          to="/products/dry-mushrooms"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            categorySlug === 'dry-mushrooms' || activeTypeFilter === 'DRY_MUSHROOM'
              ? 'bg-spore-500 text-slate-950 shadow-lg'
              : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900'
          }`}
        >
          Dry Mushrooms
        </Link>
        <Link
          to="/products/mushroom-spawn"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            categorySlug === 'mushroom-spawn' || activeTypeFilter === 'SPAWN_SEED'
              ? 'bg-spore-500 text-slate-950 shadow-lg'
              : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900'
          }`}
        >
          Grain Spawn Seeds
        </Link>
        <Link
          to="/products/growing-kits"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            categorySlug === 'growing-kits' || activeTypeFilter === 'GROWING_KIT'
              ? 'bg-spore-500 text-slate-950 shadow-lg'
              : 'bg-spore-950/60 border border-spore-800/60 text-slate-300 hover:bg-spore-900'
          }`}
        >
          DIY Growing Kits
        </Link>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card h-80 rounded-2xl animate-pulse bg-slate-900/40"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-400 space-y-3 glass-panel rounded-3xl">
          <Sprout className="w-12 h-12 mx-auto text-spore-700" />
          <p className="text-base font-medium">No products found for your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const activeVariant = selectedVariants[product.id] || product.variants?.[0];
            const image = product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80';

            return (
              <div key={product.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-spore-800/40 group">
                <div>
                  <Link to={`/product/${product.slug}`} className="relative h-52 overflow-hidden block">
                    <img
                      src={image}
                      alt={`${product.title} - Fresh mushroom supply India`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-spore-300 text-[10px] font-bold rounded-lg border border-spore-700/50 uppercase tracking-wider">
                      {product.categoryName}
                    </span>
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
                                ? 'bg-spore-950 border-spore-400 text-spore-300'
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
                    <span className="font-display font-extrabold text-xl text-white">
                      ₹{activeVariant?.priceInr || 0}
                    </span>
                  </div>

                  <button
                    onClick={() => activeVariant && onAddToCart(product, activeVariant)}
                    disabled={!activeVariant || activeVariant.stockQuantity <= 0}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      activeVariant && activeVariant.stockQuantity > 0
                        ? 'bg-spore-500 hover:bg-spore-400 text-slate-950 shadow-md shadow-spore-950'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {activeVariant && activeVariant.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
