import { useState, useEffect, useMemo, useRef } from 'react';
import { trackSearch } from '../utils/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams, useNavigationType } from 'react-router-dom';
import { useScrollRestoration } from '../utils/useScrollRestoration';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { ProductService } from '../services/ProductService';
import { Search, X, Leaf, SlidersHorizontal, Check, IndianRupee } from 'lucide-react';

export default function Shop() {
  const { category } = useParams();
  const navigate = useNavigate();
  const navigationType = useNavigationType(); // 'POP' = back button, 'PUSH' = forward nav

  // Restore filter state when user navigates back (POP), otherwise start fresh.
  // Declared here so all useState calls below can reference it.
  const _saved = navigationType === 'POP' ? (() => { try { return JSON.parse(sessionStorage.getItem('shopFilters') || 'null'); } catch { return null; } })() : null;

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(_saved?.sortBy || 'Featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    const handleOpenFilter = () => setIsMobileFilterOpen(true);
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileFilterOpen(false);
      }
    };
    window.addEventListener('openMobileFilter', handleOpenFilter);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('openMobileFilter', handleOpenFilter);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [categories, setCategories] = useState(_saved?.categories || {});
  const [difficulties, setDifficulties] = useState(_saved?.difficulties || {
    'Easy': false,
    'Medium': false,
    'Advanced': false,
  });
  const [inStock, setInStock] = useState(_saved?.inStock || false);
  const [minPrice, setMinPrice] = useState(_saved?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(_saved?.maxPrice || '');
  const [selectedSubCat, setSelectedSubCat] = useState(_saved?.selectedSubCat || '');
  const [page, setPage] = useState(_saved?.page || 1);

  const [categoryData, setCategoryData] = useState([]);

  // Load categories from API, preserving any already-active selections
  useEffect(() => {
    ProductService.getCategories().then(data => {
      const cats = data.results || data || [];
      setCategoryData(cats);
      setCategories(prev => {
        const merged = {};
        cats.forEach(c => { merged[c.name] = prev[c.name] ?? false; });
        return merged;
      });
    }).catch(() => { });
  }, []);

  // Persist filter state to sessionStorage so back navigation can restore it
  useEffect(() => {
    sessionStorage.setItem('shopFilters', JSON.stringify({ categories, difficulties, page, sortBy, inStock, minPrice, maxPrice, selectedSubCat }));
  }, [categories, difficulties, page, sortBy, inStock, minPrice, maxPrice, selectedSubCat]);

  const gridRef = useRef(null);
  const isFirstRender = useRef(true);
  const isFirstSearchSync = useRef(true);

  // ── Derive API query params from filter state ──────────────────────────────
  const activeCats = useMemo(
    () => Object.keys(categories).filter(cat => categories[cat]),
    [categories],
  );
  const activeDiffs = useMemo(
    () => Object.keys(difficulties).filter(k => difficulties[k]),
    [difficulties],
  );
  // Subcategories for currently-selected single category
  const availableSubCats = useMemo(() => {
    if (activeCats.length !== 1) return [];
    const cat = categoryData.find(c => c.name === activeCats[0]);
    return cat?.subcategories || [];
  }, [activeCats, categoryData]);

  const sortParam = useMemo(() => {
    if (sortBy === 'Price: Low to High') return 'price';
    if (sortBy === 'Price: High to Low') return '-price';
    return '-rating'; // Featured → sort by rating desc
  }, [sortBy]);

  // Build the full params object sent to the API
  const apiParams = useMemo(() => {
    const p = { page, ordering: sortParam };
    if (searchTerm.trim()) p.search = searchTerm.trim();
    if (activeCats.length === 1) p.category = activeCats[0];   // single cat filter
    if (activeDiffs.length > 0) p.care_level = activeDiffs.join(',');
    if (inStock) p.in_stock = 'true';
    if (minPrice) p.min_price = minPrice;
    if (maxPrice) p.max_price = maxPrice;
    if (selectedSubCat) p.sub_category_id = selectedSubCat;
    return p;
  }, [page, sortParam, searchTerm, activeCats, activeDiffs, inStock, minPrice, maxPrice, selectedSubCat]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', apiParams],
    queryFn: () => ProductService.getProducts(apiParams),
    keepPreviousData: true,   // smooth transition between pages
    staleTime: 30_000,
  });

  useScrollRestoration(!isLoading);

  // ── Derived product list & pagination ─────────────────────────────────────
  const products = data?.results || [];
  const totalCount = data?.count ?? 0;
  const PAGE_SIZE = 20;  // must match backend page_size
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Client-side filter only when multiple categories selected (API doesn't support OR filter natively)
  const displayedProducts = useMemo(() => {
    let list = products.filter(p => p?.is_active !== false);

    // Multi-category OR filter client side (single cat is already handled server-side)
    if (activeCats.length > 1) {
      list = list.filter(product => {
        const matchesCat = activeCats.includes(product.category);
        const matchesSub = product.sub_category && activeCats.includes(product.sub_category.name);
        return matchesCat || matchesSub;
      });
    }

    return list;
  }, [products, activeCats]);

  // ── Sync URL category param into filter state ──────────────────────────────
  // Fires on every navbar category click; also clears all filters on plain /shop
  useEffect(() => {
    if (navigationType === 'POP') return; // back button: restore from sessionStorage instead
    setCategories(prev => {
      const cleared = Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {});
      return category ? { ...cleared, [category]: true } : cleared;
    });
    setDifficulties(prev => Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    setInStock(false);
    setMinPrice('');
    setMaxPrice('');
    setSelectedSubCat('');
    setPage(1);
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to top on pagination change (skip first render — ScrollToTop handles entry) ──
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (navigationType === 'POP') return; // back nav: scroll handled by useScrollRestoration
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (cat) => {
    setCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    setPage(1);
  };

  const handleDifficultyChange = (diff) => {
    setDifficulties(prev => ({ ...prev, [diff]: !prev[diff] }));
    setPage(1);
  };

  // Track search events with 700ms debounce (fires once user stops typing)
  useEffect(() => {
    if (!searchTerm.trim()) return;
    const t = setTimeout(() => {
      trackSearch({ query: searchTerm.trim(), resultsCount: data?.count ?? null });
    }, 700);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Sync search from URL — skip the very first render so that page restored
  // from sessionStorage (on back navigation) isn't immediately reset to 1.
  useEffect(() => {
    if (isFirstSearchSync.current) {
      isFirstSearchSync.current = false;
      return;
    }
    const query = searchParams.get('search') || '';
    if (query !== searchTerm) setSearchTerm(query);
    setPage(1);
  }, [searchParams, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearAllFilters = () => {
    setCategories(Object.keys(categories).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    setDifficulties(Object.keys(difficulties).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    setInStock(false);
    setMinPrice('');
    setMaxPrice('');
    setSelectedSubCat('');
    setSearchTerm('');
    setPage(1);
    if (category) navigate('/shop');
  };

  const activeFilterCount =
    Object.values(categories).filter(Boolean).length +
    Object.values(difficulties).filter(Boolean).length +
    (inStock ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (selectedSubCat ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0 || !!searchTerm;

  // ── Pagination page numbers with ellipsis ─────────────────────────────────
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, page]);
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
      result.push(sorted[i]);
    }
    return result;
  }, [totalPages, page]);

  // ─── Shared filter content (used in both sidebar + bottom sheet) ──────────
  const FilterContent = () => (
    <div>
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          style={{
            width: '100%', padding: '0.7rem', marginBottom: '1.5rem',
            backgroundColor: '#fef2f2', color: '#b91c1c',
            border: '1px solid #fecaca', borderRadius: '12px',
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          <X size={13} /> Reset all filters
        </button>
      )}

      {/* Categories */}
      <p style={{
        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.15em', color: 'var(--brand-gold)', marginBottom: '0.875rem',
      }}>
        Specimen Categories
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '2rem' }}>
        {Object.keys(categories).map(cat => {
          const active = categories[cat];
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.875rem', borderRadius: '12px', cursor: 'pointer',
                border: `1.5px solid ${active ? '#10b981' : '#e8ede9'}`,
                backgroundColor: active ? '#ecfdf5' : 'white',
                color: active ? '#065f46' : '#4b5563',
                fontWeight: active ? 700 : 500, fontSize: '0.875rem',
                transition: 'all 0.18s', textAlign: 'left',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{
                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                border: `1.5px solid ${active ? '#10b981' : '#d1d5db'}`,
                backgroundColor: active ? '#10b981' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
              }}>
                {active && <Check size={12} color="white" strokeWidth={3} />}
              </span>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Subcategory — only shown when exactly one parent category is selected */}
      {availableSubCats.length > 0 && (
        <>
          <p style={{
            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.15em', color: 'var(--brand-gold)', marginBottom: '0.875rem', marginTop: '1.5rem',
          }}>
            Sub-Category
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '2rem' }}>
            {availableSubCats.map(sub => {
              const active = selectedSubCat === String(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubCat(active ? '' : String(sub.id)); setPage(1); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.875rem', borderRadius: '12px', cursor: 'pointer',
                    border: `1.5px solid ${active ? '#10b981' : '#e8ede9'}`,
                    backgroundColor: active ? '#ecfdf5' : 'white',
                    color: active ? '#065f46' : '#4b5563',
                    fontWeight: active ? 700 : 500, fontSize: '0.875rem',
                    transition: 'all 0.18s', textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                    border: `1.5px solid ${active ? '#10b981' : '#d1d5db'}`,
                    backgroundColor: active ? '#10b981' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                  }}>
                    {active && <Check size={12} color="white" strokeWidth={3} />}
                  </span>
                  {sub.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Care Level */}
      <p style={{
        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.15em', color: 'var(--brand-gold)', marginBottom: '0.875rem',
      }}>
        Care Level
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {Object.keys(difficulties).map(diff => {
          const active = difficulties[diff];
          const palette = {
            Easy: { bg: '#f0fdf4', border: '#86efac', text: '#166534', activeBg: '#22c55e' },
            Medium: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', activeBg: '#f59e0b' },
            Advanced: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', activeBg: '#ef4444' },
          };
          const p = palette[diff];
          return (
            <button
              key={diff}
              onClick={() => handleDifficultyChange(diff)}
              style={{
                padding: '0.45rem 1.1rem', borderRadius: '50px', cursor: 'pointer',
                border: `1.5px solid ${active ? p.activeBg : p.border}`,
                backgroundColor: active ? p.activeBg : p.bg,
                color: active ? 'white' : p.text,
                fontWeight: 700, fontSize: '0.78rem',
                transition: 'all 0.18s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {/* Price Range */}
      <p style={{
        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.15em', color: 'var(--brand-gold)', marginBottom: '0.875rem',
      }}>
        Price Range (₹)
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <IndianRupee size={11} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            min="0"
            onChange={e => { setMinPrice(e.target.value); setPage(1); }}
            style={{
              width: '100%', padding: '0.55rem 0.5rem 0.55rem 1.75rem',
              borderRadius: '10px', border: `1.5px solid ${minPrice ? '#10b981' : '#e8ede9'}`,
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <span style={{ color: '#9ca3af', fontSize: '0.75rem', flexShrink: 0 }}>—</span>
        <div style={{ position: 'relative', flex: 1 }}>
          <IndianRupee size={11} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            min="0"
            onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
            style={{
              width: '100%', padding: '0.55rem 0.5rem 0.55rem 1.75rem',
              borderRadius: '10px', border: `1.5px solid ${maxPrice ? '#10b981' : '#e8ede9'}`,
              fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
      </div>

      {/* In Stock */}
      <button
        onClick={() => { setInStock(v => !v); setPage(1); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          width: '100%', padding: '0.75rem 0.875rem', borderRadius: '12px', cursor: 'pointer',
          border: `1.5px solid ${inStock ? '#10b981' : '#e8ede9'}`,
          backgroundColor: inStock ? '#ecfdf5' : 'white',
          color: inStock ? '#065f46' : '#4b5563',
          fontWeight: inStock ? 700 : 500, fontSize: '0.875rem',
          transition: 'all 0.18s', textAlign: 'left',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{
          width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
          border: `1.5px solid ${inStock ? '#10b981' : '#d1d5db'}`,
          backgroundColor: inStock ? '#10b981' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s',
        }}>
          {inStock && <Check size={12} color="white" strokeWidth={3} />}
        </span>
        In Stock Only
      </button>
    </div>
  );

  return (
    <div className="container" style={{ padding: '4rem 1.5rem', minHeight: '80vh', fontFamily: 'var(--font-sans)' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem 0' }}>
            The Collection
          </h1>

          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
            {/* Mobile filter trigger */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="mobile-only"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: '10px',
                border: activeFilterCount > 0 ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                backgroundColor: activeFilterCount > 0 ? '#ecfdf5' : 'white',
                color: activeFilterCount > 0 ? '#065f46' : '#374151',
                cursor: 'pointer', flexShrink: 0,
                position: 'relative'
              }}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '3rem' }}>

        {/* ── Desktop Sidebar ── */}
        <aside className="desktop-only" style={{ width: '240px', flexShrink: 0, position: 'sticky', top: '8rem', height: 'fit-content' }}>
          <FilterContent />
        </aside>

        {/* ── Mobile Bottom-Sheet Filter ── */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 1200,
                  backgroundColor: 'rgba(10,20,18,0.55)', backdropFilter: 'blur(4px)',
                }}
              />

              {/* Sheet panel */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 150) {
                    setIsMobileFilterOpen(false);
                  }
                }}
                style={{
                  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1300,
                  backgroundColor: 'white',
                  borderRadius: '24px 24px 0 0',
                  boxShadow: '0 -20px 60px rgba(0,0,0,0.2)',
                  maxHeight: '90vh',
                  display: 'flex', flexDirection: 'column',
                  touchAction: 'none'
                }}
              >
                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', paddingBottom: '0.5rem' }}>
                  <div style={{ width: '40px', height: '5px', borderRadius: '4px', backgroundColor: '#e2e8f0' }} />
                </div>

                {/* Sheet header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 1.5rem 1rem',
                  borderBottom: '1px solid #f1f5f1',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <SlidersHorizontal size={18} color="#10b981" />
                    <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#0A3029', margin: 0 }}>
                      Filter Collection
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    style={{
                      background: '#f1f5f4', border: 'none', borderRadius: '50%',
                      width: '34px', height: '34px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#6b7280',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable body */}
                <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1, touchAction: 'pan-y' }}>
                  <FilterContent />
                </div>

                {/* Sticky footer */}
                <div style={{
                  padding: '1.25rem 1.5rem 2rem',
                  borderTop: '1px solid #f1f5f1',
                  backgroundColor: 'white',
                  display: 'flex', gap: '0.75rem',
                }}>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { clearAllFilters(); }}
                      style={{
                        flex: 1, padding: '1rem', borderRadius: '14px',
                        border: '1.5px solid #e2e8f0', backgroundColor: 'white',
                        color: '#4b5563', fontWeight: 700, fontSize: '0.875rem',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    style={{
                      flex: 2, padding: '1rem', borderRadius: '14px',
                      border: 'none', backgroundColor: '#0A3029',
                      color: 'white', fontWeight: 700, fontSize: '0.875rem',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      boxShadow: '0 10px 20px rgba(10,48,41,0.2)'
                    }}
                  >
                    Show Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Product Grid ── */}
        <div ref={gridRef} style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700 }}>
              {isFetching && !isLoading
                ? 'Updating…'
                : `${totalCount} result${totalCount !== 1 ? 's' : ''}${hasActiveFilters ? ' · filtered' : ''}`
              }
            </p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '0.55rem 1.1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                fontSize: '0.8rem', backgroundColor: 'white', fontWeight: 700,
                outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '8rem 0', color: '#9ca3af' }}>Assembling catalog…</div>
          ) : (
            <>
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid-responsive"
                style={{ display: 'grid' }}
              >
                {displayedProducts.map(product => (
                  (() => {
                    const variant = Array.isArray(product.variants) ? product.variants?.[0] : null;
                    const basePrice = parseFloat(
                      product.base_price ??
                      product.basePrice ??
                      variant?.base_price ??
                      variant?.compare_at_price ??
                      product.compare_at_price ??
                      product.compareAtPrice ??
                      NaN
                    );
                    const price = parseFloat(product.price ?? NaN);
                    const originalPrice = Number.isFinite(basePrice) && Number.isFinite(price) && basePrice > price ? basePrice : undefined;
                    return (
                      <ProductCard
                        key={product.id}
                        {...product}
                        originalPrice={originalPrice}
                      />
                    );
                  })()
                ))}
              </motion.div>

              {/* ── Pagination ── */}
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />

              {displayedProducts.length === 0 && !isLoading && (
                <div style={{
                  padding: '6rem 2rem', textAlign: 'center',
                  backgroundColor: '#fcfdfc', borderRadius: '24px',
                  border: '1px dashed #e2e8f0',
                }}>
                  <Leaf size={44} style={{ color: '#d1d5db', marginBottom: '1.25rem' }} />
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                    No specimens found
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Try adjusting your filters
                  </p>
                  <button
                    onClick={clearAllFilters}
                    style={{
                      background: 'none', border: 'none', color: '#10b981',
                      fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem',
                    }}
                  >Clear all filters</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
