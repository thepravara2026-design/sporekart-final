import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Loader2, Sprout, Layers, GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import { searchApi } from '../api';
import MediaImage from './MediaImage';

export default function GlobalSearch({ isMobile = false, onCloseMobile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], categories: [], training: [], blogs: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Debounced Search API Trigger
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ products: [], categories: [], training: [], blogs: [] });
      setLoading(false);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const response = await searchApi.globalSearch(query.trim());
        if (response.data && response.data.success) {
          setResults(response.data.data);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults =
    (results.products?.length || 0) +
    (results.categories?.length || 0) +
    (results.training?.length || 0) +
    (results.blogs?.length || 0);

  const flatList = [
    ...(results.products || []),
    ...(results.categories || []),
    ...(results.training || []),
    ...(results.blogs || []),
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (onCloseMobile) onCloseMobile();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatList.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && flatList[selectedIndex]) {
      e.preventDefault();
      const item = flatList[selectedIndex];
      handleSelectResult(item.url);
    }
  };

  const handleSelectResult = (url) => {
    setIsOpen(false);
    setQuery('');
    if (onCloseMobile) onCloseMobile();
    navigate(url);
  };

  return (
    <div ref={searchRef} className={`relative ${isMobile ? 'w-full' : 'w-full'}`} tabIndex={-1}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-typography-muted absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, spawn, courses..."
          className="w-full bg-surface-neutral border border-surface-border rounded-input pl-10 pr-10 py-2 text-xs sm:text-sm text-typography-primary placeholder-typography-muted focus:outline-none focus:border-forest-700 focus:bg-surface-white focus:ring-2 focus:ring-forest-700/15 transition-all shadow-level-1"
          aria-label="Search Sporekart products, categories, workshops, and articles"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-forest-700 animate-spin absolute right-3" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 text-typography-muted hover:text-typography-primary p-1"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown Overlay */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-white border border-surface-border rounded-card shadow-level-3 backdrop-blur-xl z-50 overflow-hidden max-h-[80vh] flex flex-col animate-scale-in">
          {loading ? (
            <div className="p-6 text-center text-xs text-typography-secondary flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-forest-700 animate-spin" />
              <span>Searching Sporekart catalog & content...</span>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-typography-primary font-semibold">
                No results found for "<span className="text-forest-700">{query}</span>"
              </p>
              <p className="text-[11px] text-typography-muted">Try checking spelling or explore our popular categories:</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Link
                  to="/products"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-surface-cream hover:bg-surface-border text-forest-900 text-[11px] font-bold rounded-compact border border-surface-border"
                >
                  Products
                </Link>
                <Link
                  to="/products/fresh-mushrooms"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-surface-cream hover:bg-surface-border text-forest-900 text-[11px] font-bold rounded-compact border border-surface-border"
                >
                  Fresh Mushrooms
                </Link>
                <Link
                  to="/training"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-gold/15 hover:bg-gold/25 text-soil text-[11px] font-bold rounded-compact border border-gold/30"
                >
                  Workshops
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto p-2 divide-y divide-surface-border">
              {/* Products Section */}
              {results.products && results.products.length > 0 && (
                <div className="py-2 first:pt-0">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-700 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5" /> Products ({results.products.length})
                  </div>
                  {results.products.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item.url)}
                      className="w-full text-left px-3 py-2 rounded-input hover:bg-surface-cream flex items-center justify-between gap-3 group transition-all button-press"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.imageUrl && (
                          <div className="w-10 h-10 rounded-compact overflow-hidden shrink-0 border border-surface-border bg-surface-cream">
                            <MediaImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-forest-900 group-hover:text-forest-700 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-typography-muted truncate">{item.subtitle}</p>
                        </div>
                      </div>
                      {item.priceInr && (
                        <span className="text-xs font-bold text-forest-700 shrink-0">
                          ₹{item.priceInr}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Categories Section */}
              {results.categories && results.categories.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Categories ({results.categories.length})
                  </div>
                  {results.categories.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item.url)}
                      className="w-full text-left px-3 py-2 rounded-input hover:bg-surface-cream flex items-center justify-between gap-3 group transition-all button-press"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-forest-700 shrink-0"></span>
                        <p className="text-xs font-bold text-forest-900 group-hover:text-forest-700 truncate">
                          {item.title}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-typography-muted group-hover:text-forest-700 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Training Courses Section */}
              {results.training && results.training.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-soil flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Training Workshops ({results.training.length})
                  </div>
                  {results.training.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item.url)}
                      className="w-full text-left px-3 py-2 rounded-input hover:bg-surface-cream flex items-center justify-between gap-3 group transition-all button-press"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-forest-900 group-hover:text-soil truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-typography-muted truncate">{item.subtitle}</p>
                      </div>
                      {item.priceInr && (
                        <span className="text-xs font-bold text-soil shrink-0">
                          ₹{item.priceInr}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Blog Articles Section */}
              {results.blogs && results.blogs.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Agritech Blog ({results.blogs.length})
                  </div>
                  {results.blogs.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item.url)}
                      className="w-full text-left px-3 py-2 rounded-input hover:bg-surface-cream flex items-center justify-between gap-3 group transition-all button-press"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-forest-900 group-hover:text-forest-700 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-typography-muted truncate">{item.subtitle}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-typography-muted group-hover:text-forest-700 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
