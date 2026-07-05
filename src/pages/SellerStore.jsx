import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { ShieldCheck, MapPin, Package, Star, ArrowLeft, Leaf, Heart, ShoppingCart, Info, Award, Calendar, ExternalLink, Sparkles, CheckCircle2, Search, X, Check, IndianRupee } from 'lucide-react';
import { ProductService } from '../services/ProductService';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import TrustBadges from '../components/TrustBadges';
import { motion, AnimatePresence } from 'framer-motion';

const isLight = (color) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

export default function SellerStore() {
  const { sellerName } = useParams(); // This is the slug
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters — all scoped to this seller's catalogue via seller_slug.
  const [categoryData, setCategoryData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [careLevel, setCareLevel] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState('Featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [debouncedMin, setDebouncedMin] = useState('');
  const [debouncedMax, setDebouncedMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 12;

  const [sellerInfo, setSellerInfo] = useState({
    name: '',
    tagline: 'Rare Botanical Specimens & Collector Rarities',
    expertise: 'Curating life with precision and passion.',
    location: 'India',
    heroImage: '/assets/default-banner.jpg',
    iconUrl: '',
    logoUrl: '/assets/default-logo.jpg',
    brandColor: '#1b2d2a',
    rating: 5.0,
    reviews: 0,
    founded: 2024,
    badges: ['Verified Seller', 'Master Grower', 'Eco-Pioneer']
  });
  const [profileFound, setProfileFound] = useState(true);

  // Fetch the public store profile (once per slug).
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get(`/sellers/store/${sellerName}/`).catch(() => null);
        if (profileRes && profileRes.data) {
          const profile = profileRes.data;
          setSellerInfo({
            name: profile.store_name,
            tagline: profile.tagline || 'Rare Botanical Specimens & Collector Rarities',
            expertise: profile.bio || 'Sharing rare specimens from our studio.',
            location: profile.location_city || 'India',
            heroImage: getImageUrl(profile.banner_url) || '/assets/default-banner.jpg',
            iconUrl: getImageUrl(profile.icon_url) || '',
            logoUrl: getImageUrl(profile.logo_url) || '',
            brandColor: profile.brand_color || '#1b2d2a',
            rating: parseFloat(profile.rating) || 5.0,
            reviews: parseInt(profile.total_sales) || 0,
            founded: new Date(profile.created_at).getFullYear(),
            badges: profile.identity_verified ? ['Identity Verified', 'Verified Seller', 'Master Grower'] : ['Verified Seller', 'Purity Verified', 'Premium Logistics'],
            expertise_tags: profile.expertise_tags || [],
            infrastructure: profile.infrastructure_details || '',
            experience: profile.experience_years || 0,
            isVerified: profile.identity_verified
          });
          setProfileFound(true);
        } else {
          setProfileFound(false);
        }
      } catch (error) {
        console.error("Failed to fetch seller profile:", error);
        setProfileFound(false);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    window.scrollTo(0, 0);
  }, [sellerName]);

  // Load the category list once for the filter control.
  useEffect(() => {
    ProductService.getCategories().then(setCategoryData).catch(() => setCategoryData([]));
  }, []);

  // Debounce the search box so we don't hit the API on every keystroke.
  // Resetting to page 1 whenever the query changes keeps the result set valid.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Debounce price inputs the same way.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedMin(minPrice);
      setDebouncedMax(maxPrice);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [minPrice, maxPrice]);

  const sortParam = useMemo(() => {
    if (sortBy === 'Price: Low to High') return 'price';
    if (sortBy === 'Price: High to Low') return '-price';
    return null; // Featured → backend default (in-stock first, newest)
  }, [sortBy]);

  // Fetch the current page of products server-side. The backend paginates
  // (page_size=20 by default), so the store must request each page explicitly
  // instead of fetching once and slicing client-side — otherwise only the first
  // page of a seller's catalogue is ever visible. Every filter is sent alongside
  // seller_slug so it only ever narrows THIS seller's products.
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const params = {
          seller_slug: sellerName,
          page: currentPage,
          page_size: itemsPerPage,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory) params.category = selectedCategory;
        if (careLevel) params.care_level = careLevel;
        if (inStock) params.in_stock = 'true';
        if (debouncedMin) params.min_price = debouncedMin;
        if (debouncedMax) params.max_price = debouncedMax;
        if (sortParam) params.ordering = sortParam;
        const data = await ProductService.getProducts(params);
        const results = data.results || data || [];
        setProducts(results.filter((p) => p?.is_active !== false));
        setTotalCount(typeof data.count === 'number' ? data.count : results.length);
      } catch (error) {
        console.error("Failed to fetch seller products:", error);
        setProducts([]);
        setTotalCount(0);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [sellerName, currentPage, debouncedSearch, selectedCategory, careLevel, inStock, debouncedMin, debouncedMax, sortParam]);

  const textColor = isLight(sellerInfo.brandColor) ? 'var(--text-primary)' : 'white';
  const accentColor = isLight(sellerInfo.brandColor) ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (careLevel ? 1 : 0) +
    (inStock ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0 || !!searchQuery;

  const clearAllFilters = () => {
    setSelectedCategory('');
    setCareLevel('');
    setInStock(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('Featured');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const productsRef = React.useRef(null);

  const goToPage = (p) => {
    setCurrentPage(p);
    if (productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: '40px', height: '40px', border: '3px solid var(--bg-secondary)', borderTopColor: sellerInfo.brandColor, borderRadius: '50%', marginBottom: '2rem' }}
        />
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Loading store...</p>
      </div>
    );
  }

  if (!profileFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '2rem', textAlign: 'center' }}>
        <Leaf size={64} color="var(--brand-gold)" style={{ marginBottom: '2rem' }} />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', marginBottom: '1rem' }}>Store Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 3rem', fontSize: '1.1rem' }}>This store may have moved or changed its name.</p>
        <Link to="/shop" className="btn btn-primary">Return to Marketplace</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9f8f4', minHeight: '100vh', paddingBottom: '6rem', fontFamily: 'Inter, sans-serif', color: '#1a1a1a' }}>
      <SEO
        title={`${sellerInfo.name || sellerName} — Verified Grower | Junglyst`}
        description={sellerInfo.tagline || `Browse rare aquatic plants and botanicals from ${sellerInfo.name || sellerName} on Junglyst.`}
        path={`/store/${sellerName}`}
        image={sellerInfo.heroImage?.startsWith('/') ? undefined : sellerInfo.heroImage}
      />

      {/* 1. Fashion Editorial Hero */}
      <section className="seller-hero" style={{ position: 'relative', backgroundColor: '#f3f4f1' }}>
        {/* Hero Image (top on mobile, right on desktop) */}
        <div className="seller-hero-image" style={{ position: 'relative', overflow: 'hidden' }}>
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2 }}
            style={{ width: '100%', height: '100%' }}
          >
            <img
              src={sellerInfo.heroImage}
              alt="Studio View"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.src = '/assets/default-banner.jpg' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #f3f4f1 100%)' }} />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="seller-hero-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/sellers" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b',
              textDecoration: 'none', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.2em', marginBottom: '2rem'
            }}>
              <ArrowLeft size={14} /> All Stores
            </Link>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {sellerInfo.badges.map(badge => (
                <span key={badge} style={{
                  fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: '#10b981',
                  borderBottom: '1px solid #10b981', paddingBottom: '0.2rem'
                }}>
                  {badge}
                </span>
              ))}
            </div>

            {/* Brand icon + Store name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px', height: '64px', flexShrink: 0,
                backgroundColor: sellerInfo.brandColor || '#1b2d2a', borderRadius: '50%',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {sellerInfo.iconUrl ? (
                  <img
                    src={sellerInfo.iconUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    alt={sellerInfo.name}
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span style="color:white;font-family:var(--font-serif);font-size:1.5rem;font-weight:600">${(sellerInfo.name || '?').charAt(0).toUpperCase()}</span>`; }}
                  />
                ) : (
                  <span style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>
                    {(sellerInfo.name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', margin: 0 }}>Store Profile</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', margin: 0, lineHeight: 1.1 }}>{sellerInfo.name}</h2>
              </div>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontFamily: 'var(--font-serif)', lineHeight: 1,
              letterSpacing: '-0.03em', margin: '0 0 1.25rem 0'
            }}>
              {sellerInfo.name.split(' ')[0]}
              {sellerInfo.name.split(' ').length > 1 && (
                <><br /><span style={{ fontStyle: 'italic', color: '#64748b' }}>& </span>{sellerInfo.name.split(' ').slice(1).join(' ')}</>
              )}
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#4b5563',
              maxWidth: '480px', fontWeight: 400, margin: 0, lineHeight: 1.5,
              fontFamily: 'var(--font-serif)', fontStyle: 'italic'
            }}>
              "{sellerInfo.tagline}"
            </p>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '3rem' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{sellerInfo.rating}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Curator Rating</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{sellerInfo.experience}y</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Mastery Tenure</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{totalCount}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Specimens</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Studio Ethos & Expertise */}
      <section style={{ padding: 'clamp(4rem, 8vw, 10rem) 0' }}>
        <div className="container">
          <div className="seller-ethos-grid">
            <div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981', marginBottom: '1.5rem' }}>The Botanical Mandate</h3>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontFamily: 'var(--font-serif)', lineHeight: 1.1, marginBottom: '1.5rem' }}>Philosophy of Cultivation</h2>
              <div style={{ width: '48px', height: '2px', backgroundColor: '#1a1a1a' }} />
            </div>
            <div>
              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#4b5563', lineHeight: 1.8, marginBottom: '2.5rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                "{sellerInfo.expertise}"
              </p>
              <div className="seller-pillars-grid">
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Infrastructure</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>{sellerInfo.infrastructure || 'Advanced climate-controlled propagation systems with custom light spectrum optimization.'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Studio Pillars</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(sellerInfo.expertise_tags?.length > 0 ? sellerInfo.expertise_tags : ['Sustainability', 'Purity', 'Rare Stock']).map(tag => (
                      <span key={tag} style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '100px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Seasonal Selections */}
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 6rem)' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Seasonal Selections</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af' }}>
            {debouncedSearch ? `${totalCount} RESULT${totalCount === 1 ? '' : 'S'}` : `${totalCount} SPECIMENS FROM THE STORE`}
          </p>
        </div>

        {/* Search + Filter Toolbar (all scoped to this seller) */}
        <div ref={productsRef} style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              position: 'relative',
              flex: '1 1 320px',
              maxWidth: '500px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '24px',
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <Search size={20} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search products in this store..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  backgroundColor: 'transparent'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#9ca3af', fontSize: '1.2rem' }}
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '0.8rem 1.1rem', border: '1px solid #e5e7eb', borderRadius: '14px',
                fontSize: '0.85rem', backgroundColor: 'white', fontWeight: 600,
                outline: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#1a1a1a'
              }}
            >
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>

            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.8rem 1.25rem', borderRadius: '14px', cursor: 'pointer',
                border: `1.5px solid ${activeFilterCount > 0 ? '#1a1a1a' : '#e5e7eb'}`,
                backgroundColor: activeFilterCount > 0 ? '#1a1a1a' : 'white',
                color: activeFilterCount > 0 ? 'white' : '#1a1a1a',
                fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit'
              }}
            >
              <Sparkles size={16} /> Filters
              {activeFilterCount > 0 && (
                <span style={{
                  backgroundColor: 'white', color: '#1a1a1a', borderRadius: '100px',
                  fontSize: '0.7rem', fontWeight: 800, minWidth: '18px', height: '18px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px'
                }}>{activeFilterCount}</span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  marginTop: '1.25rem', padding: '1.75rem',
                  backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '20px',
                  display: 'flex', flexDirection: 'column', gap: '1.75rem'
                }}>
                  {/* Categories */}
                  {categoryData.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', marginBottom: '0.875rem' }}>Category</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {categoryData.map(cat => {
                          const active = selectedCategory === cat.name;
                          return (
                            <button
                              key={cat.id ?? cat.name}
                              onClick={() => { setSelectedCategory(active ? '' : cat.name); setCurrentPage(1); }}
                              style={{
                                padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer',
                                border: `1.5px solid ${active ? '#1a1a1a' : '#e5e7eb'}`,
                                backgroundColor: active ? '#1a1a1a' : 'white',
                                color: active ? 'white' : '#4b5563',
                                fontWeight: active ? 700 : 500, fontSize: '0.8rem', fontFamily: 'inherit'
                              }}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Care Level */}
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', marginBottom: '0.875rem' }}>Care Level</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {['Easy', 'Medium', 'Advanced'].map(level => {
                        const active = careLevel === level;
                        return (
                          <button
                            key={level}
                            onClick={() => { setCareLevel(active ? '' : level); setCurrentPage(1); }}
                            style={{
                              padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer',
                              border: `1.5px solid ${active ? '#1a1a1a' : '#e5e7eb'}`,
                              backgroundColor: active ? '#1a1a1a' : 'white',
                              color: active ? 'white' : '#4b5563',
                              fontWeight: active ? 700 : 500, fontSize: '0.8rem', fontFamily: 'inherit'
                            }}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price + In Stock */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', alignItems: 'flex-end' }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', marginBottom: '0.875rem' }}>Price Range (₹)</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative' }}>
                          <IndianRupee size={11} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            type="number" placeholder="Min" value={minPrice} min="0"
                            onChange={e => setMinPrice(e.target.value)}
                            style={{ width: '110px', padding: '0.55rem 0.5rem 0.55rem 1.75rem', borderRadius: '10px', border: `1.5px solid ${minPrice ? '#1a1a1a' : '#e5e7eb'}`, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          />
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                        <div style={{ position: 'relative' }}>
                          <IndianRupee size={11} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            type="number" placeholder="Max" value={maxPrice} min="0"
                            onChange={e => setMaxPrice(e.target.value)}
                            style={{ width: '110px', padding: '0.55rem 0.5rem 0.55rem 1.75rem', borderRadius: '10px', border: `1.5px solid ${maxPrice ? '#1a1a1a' : '#e5e7eb'}`, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setInStock(v => !v); setCurrentPage(1); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 1rem', borderRadius: '12px', cursor: 'pointer',
                        border: `1.5px solid ${inStock ? '#1a1a1a' : '#e5e7eb'}`,
                        backgroundColor: inStock ? '#1a1a1a' : 'white',
                        color: inStock ? 'white' : '#4b5563',
                        fontWeight: inStock ? 700 : 500, fontSize: '0.82rem', fontFamily: 'inherit'
                      }}
                    >
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                        border: `1.5px solid ${inStock ? 'white' : '#d1d5db'}`,
                        backgroundColor: inStock ? 'white' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {inStock && <Check size={11} color="#1a1a1a" strokeWidth={3} />}
                      </span>
                      In Stock Only
                    </button>

                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.6rem 1rem', borderRadius: '12px', cursor: 'pointer',
                          border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c',
                          fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit'
                        }}
                      >
                        <X size={13} /> Reset all
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {productsLoading ? (
          <div style={{ padding: 'clamp(4rem, 8vw, 8rem) 2rem', display: 'flex', justifyContent: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: sellerInfo.brandColor, borderRadius: '50%' }}
            />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid-responsive" style={{ display: 'grid', marginBottom: '3rem' }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name || product.title}
                  price={product.price}
                  image={product.image_url || product.image}
                  seller={product.seller}
                  brandColor={sellerInfo.brandColor}
                  reviews={product.rating}
                  stock={product.stock}
                  variants={product.variants}
                />
              ))}
            </div>

            {/* Pagination — server-driven, so every page of the seller's catalogue is reachable */}
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={itemsPerPage}
              onPageChange={goToPage}
              onScrollTop={() => productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </>
        ) : (
          <div style={{ padding: 'clamp(4rem, 8vw, 8rem) 2rem', textAlign: 'center', backgroundColor: 'white', border: '1px solid #f3f4f6', borderRadius: '24px' }}>
            <Leaf size={44} color="#e5e7eb" style={{ marginBottom: '1.5rem' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>
              {hasActiveFilters ? 'No Products Found' : 'Collection Dormant'}
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: hasActiveFilters ? '1.5rem' : 0 }}>
              {searchQuery
                ? `No products match "${searchQuery}". Try a different search or adjust filters.`
                : hasActiveFilters
                  ? 'No products match the selected filters.'
                  : 'This grower is currently nurturing their next batch of rare specimens.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Verified Excellence / Commitment */}
      <div className="container" style={{ marginTop: '12rem', marginBottom: '4rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ 
            backgroundColor: 'var(--bg-deep, #1b2d2a)',
            borderRadius: '40px',
            padding: 'clamp(2.5rem,6vw,6rem) clamp(1.5rem,4vw,4rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(2rem,5vw,6rem)',
            alignItems: 'center',
            color: 'white', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 40px 100px -20px rgba(27, 45, 42, 0.4)'
          }}
        >
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.03, transform: 'rotate(15deg)' }}><Leaf size={400} /></div>
          <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(16, 185, 129, 0.05), transparent)' }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '50px', height: '1px', backgroundColor: 'var(--brand-gold, #c5a059)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--brand-gold, #c5a059)' }}>The Standard</span>
            </div>
            
            <h2 style={{ fontSize: '4rem', fontFamily: 'serif', lineHeight: 1.1, marginBottom: '2rem', color: 'white' }}>Verified<br/>Excellence</h2>
            
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '3rem', fontFamily: 'serif', fontStyle: 'italic' }}>
              Every specimen from {sellerInfo.name} has passed our rigorous botanical screening process. We guarantee health, purity, and sustainable cultivation practices from farm to display.
            </p>
            
            <div style={{ display: 'flex', gap: '2rem', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>100%</p>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>Purity Guarantee</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>0</p>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>Harmful Chemicals</p>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
             {/* We use a custom layout for TrustBadges here to make it look dense and premium */}
             <div style={{ 
               display: 'grid', 
               gridTemplateColumns: 'repeat(2, 1fr)', 
               gap: '1.5rem',
               backgroundColor: 'rgba(255,255,255,0.03)',
               padding: '3rem',
               borderRadius: '24px',
               border: '1px solid rgba(255,255,255,0.05)',
               backdropFilter: 'blur(10px)'
             }}>
                {[
                  { title: 'Farm-Direct Dispatch', icon: <ShieldCheck size={20} /> },
                  { title: 'Pathogen-Free Guarantee', icon: <Leaf size={20} /> },
                  { title: 'Eco-Friendly Packaging', icon: <Package size={20} /> },
                  { title: 'Species-Specific Guarantee', icon: <Award size={20} /> },
                  { title: 'Sustainably Cultivated', icon: <Heart size={20} /> },
                  { title: 'Expert Horticultural Support', icon: <Sparkles size={20} /> }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '14px', 
                      backgroundColor: 'rgba(197, 160, 89, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--brand-gold, #c5a059)'
                    }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{item.title}</span>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Hero: desktop = side by side, mobile = stacked */
        .seller-hero {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          min-height: 85vh;
        }
        .seller-hero-image {
          order: 2;
        }
        .seller-hero-content {
          order: 1;
          padding: 5% 8%;
        }

        /* Ethos grid */
        .seller-ethos-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 6rem;
          align-items: flex-start;
        }
        .seller-pillars-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .seller-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .seller-hero-image {
            order: 1;
            height: 55vw;
            max-height: 420px;
          }
          .seller-hero-content {
            order: 2;
            padding: 2.5rem 2rem 3rem;
          }
          .seller-ethos-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .seller-hero-image {
            height: 56vw;
            max-height: 280px;
          }
          .seller-hero-content {
            padding: 1.5rem 1rem 2.5rem;
          }
          .seller-pillars-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}


