import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { ProductService } from '../services/ProductService';
import { Search, X, Leaf, SlidersHorizontal, Check } from 'lucide-react';

export default function Shop() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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

  const [categories, setCategories] = useState({});
  const [difficulties, setDifficulties] = useState({
    'Easy': false,
    'Medium': false,
    'Advanced': false,
  });

  // Load categories from API
  useEffect(() => {
    ProductService.getCategories().then(data => {
      const cats = data.results || data || [];
      setCategories(prev => {
        const merged = {};
        cats.forEach(c => { merged[c.name] = prev[c.name] ?? false; });
        return merged;
      });
    }).catch(() => {});
  }, []);

  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: async () => {
      const res = await ProductService.getProducts({ page });
      return res;
    },
  });

  const products = data?.results || [];
  const activeProducts = useMemo(() => products.filter((p) => p?.is_active !== false), [products]);
  const totalCount = activeProducts.length;
  const totalPages = Math.ceil(totalCount / 20);

  useEffect(() => {
    if (category) {
      setCategories(prev => ({
        ...Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {}),
        [category]: true,
      }));
    }
  }, [category]);

  const handleCategoryChange = (cat) => {
    setCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    setPage(1);
  };

  const handleDifficultyChange = (diff) => {
    setDifficulties(prev => ({ ...prev, [diff]: !prev[diff] }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setCategories(Object.keys(categories).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    setDifficulties(Object.keys(difficulties).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    setSearchTerm('');
    setPage(1);
    if (category) navigate('/shop');
  };

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(product => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = (product.name || product.title || '').toLowerCase().includes(query);
        if (!matchesName) return false;
      }
      const activeCats = Object.keys(categories).filter(cat => categories[cat]);
      if (activeCats.length > 0) {
        const matchesCategory = activeCats.includes(product.category);
        const matchesSubCategory = product.sub_category && activeCats.includes(product.sub_category.name);
        if (!matchesCategory && !matchesSubCategory) return false;
      }
      const activeDiffs = Object.keys(difficulties).filter(k => difficulties[k]);
      if (activeDiffs.length > 0 && (!product.care_level || !activeDiffs.includes(product.care_level))) return false;
      return true;
    });
  }, [activeProducts, categories, difficulties, searchTerm]);

  const displayedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    if (sortBy === 'Price: Low to High') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'Price: High to Low') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted;
  }, [filteredProducts, sortBy]);

  const activeFilterCount =
    Object.values(categories).filter(Boolean).length +
    Object.values(difficulties).filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || !!searchTerm;

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

      {/* Care Level */}
      <p style={{
        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.15em', color: 'var(--brand-gold)', marginBottom: '0.875rem',
      }}>
        Care Level
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Object.keys(difficulties).map(diff => {
          const active = difficulties[diff];
          const palette = {
            Easy:     { bg: '#f0fdf4', border: '#86efac', text: '#166534', activeBg: '#22c55e' },
            Medium:   { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', activeBg: '#f59e0b' },
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
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem', minHeight: '80vh', fontFamily: 'var(--font-sans)' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
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

            {/* Search bar */}
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input
                type="text"
                placeholder="Find a specimen…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '0.85rem', outline: 'none', backgroundColor: 'white',
                  fontFamily: 'var(--font-sans)',
                  height: '40px'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
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
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700 }}>
              {displayedProducts.length} result{displayedProducts.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' · filtered' : ''}
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
              <div className="grid-responsive" style={{ display: 'grid' }}>
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '5rem' }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    style={{
                      padding: '0.7rem 1.4rem', borderRadius: '10px',
                      border: '1.5px solid #e2e8f0', backgroundColor: 'white',
                      fontSize: '0.8rem', fontWeight: 700,
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      opacity: page === 1 ? 0.4 : 1,
                    }}
                  >Previous</button>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        style={{
                          width: '38px', height: '38px', borderRadius: '10px', border: 'none',
                          backgroundColor: page === i + 1 ? '#0A3029' : 'transparent',
                          color: page === i + 1 ? 'white' : '#64748b',
                          fontWeight: 700, cursor: 'pointer',
                        }}
                      >{i + 1}</button>
                    ))}
                  </div>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    style={{
                      padding: '0.7rem 1.4rem', borderRadius: '10px',
                      border: '1.5px solid #e2e8f0', backgroundColor: 'white',
                      fontSize: '0.8rem', fontWeight: 700,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      opacity: page === totalPages ? 0.4 : 1,
                    }}
                  >Next</button>
                </div>
              )}

              {displayedProducts.length === 0 && (
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
