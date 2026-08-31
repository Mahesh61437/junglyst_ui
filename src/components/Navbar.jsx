import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, User, Menu, Heart, LogOut, X, ChevronRight, Store, LayoutDashboard, Package, Bell, ShieldCheck, SlidersHorizontal, MapPin, Truck, Trophy, ArrowRight, Bug } from 'lucide-react';
import { ProductService } from '../services/ProductService';

const COMPETITION_LAUNCH = new Date('2026-06-01T00:00:00+05:30');

function TopBar() {
  const isOpen = Date.now() < COMPETITION_LAUNCH.getTime();
  const [slide, setSlide] = useState(0); // 0 = competition, 1 = packaging
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSlide(p => (p + 1) % 2);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(t);
  }, [isOpen]);

  const bar = isOpen && slide === 0 ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Trophy size={11} color="#c9972b" />
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        Aquascape Competition 2026 — ₹1,000 Prize — 500 Slots Only
      </span>
      <Link
        to="/competition"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          backgroundColor: '#c9972b', color: '#0a1f1c',
          padding: '0.18rem 0.65rem', borderRadius: '100px',
          fontSize: '0.6rem', fontWeight: 800,
          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em',
          flexShrink: 0,
        }}
      >
        Enter Now <ArrowRight size={9} />
      </Link>
    </div>
  ) : (
    <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
      Free Expert Packaging on All Orders Above ₹999
    </span>
  );

  return (
    <div className="navbar-topbar desktop-flex" style={{
      backgroundColor: '#0a1f1c',
      borderBottom: '1px solid rgba(201,151,43,0.15)',
      textAlign: 'center',
      padding: '0.45rem 1rem',
      transition: 'opacity 0.35s ease',
      opacity: visible ? 1 : 0,
      minHeight: '28px',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {bar}
    </div>
  );
}
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import NaturalLogo from './NaturalLogo';
import NotificationBell from './NotificationBell';
import MobileSearchOverlay from './MobileSearchOverlay';
import { getImageUrl } from '../utils/imageUtils';

export default function Navbar() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(new URLSearchParams(location.search).get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const isGrower = user?.is_staff && (user?.role === 'grower' || user?.role === 'admin');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  // Debounce raw input into a search-preview query (no URL navigation here).
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Live preview results for dropdown — only fires when input has content.
  const { data: previewData, isFetching: isPreviewLoading } = useQuery({
    queryKey: ['navbar-search-preview', debouncedSearch],
    queryFn: () => ProductService.getProducts({ search: debouncedSearch, page: 1 }),
    enabled: !!debouncedSearch,
    staleTime: 30_000,
    keepPreviousData: true,
  });
  const previewResults = (previewData?.results || []).slice(0, 5);
  const previewTotal = previewData?.count ?? 0;

  // Sync input with URL if it changes externally (e.g. back button)
  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search') || '';
    if (query !== searchInput) {
      setSearchInput(query);
    }
  }, [location.search]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search dropdown on navigation
  useEffect(() => { setIsSearchOpen(false); }, [location.pathname, location.search]);

  const commitSearch = (q) => {
    const trimmed = (q ?? searchInput).trim();
    setIsSearchOpen(false);
    if (trimmed) {
      navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/shop');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'New Arrivals', path: '/shop' },
    { name: 'Plants', path: '/shop/Aquatic Plants' },
    { name: 'Hardscape', path: '/shop/Hardscape' },
    { name: 'Combos', path: '/combos' },
    { name: 'Verified Sellers', path: '/sellers' },
    { name: 'Care Guides', path: '/guides' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <header className="navbar" style={{
      boxShadow: scrolled ? 'var(--shadow-md)' : 'none'
    }}>
      <TopBar />

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        height: 'var(--nav-height-mobile)',
        gap: '0.5rem',
      }}>

        {/* ── Mobile: Logo left ─────────────────────────────────────────────── */}
        <div className="mobile-only" style={{ flexShrink: 0 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', transform: scrolled ? 'scale(0.9)' : 'scale(1)', transition: 'transform var(--transition-base)' }}>
            <NaturalLogo textColor="var(--text-primary)" size={scrolled ? 18 : 21} />
          </Link>
        </div>

        {/* ── Desktop: Hamburger + Search left ──────────────────────────────── */}
        <div className="desktop-flex" style={{ alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} />
          </button>
          <div ref={searchRef} style={{ position: 'relative', width: '280px' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); commitSearch(); }}
              style={{ position: 'relative' }}
            >
              <input
                type="text"
                placeholder="Search Junglyst..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setIsSearchOpen(true); }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--brand-gold)';
                  if (searchInput.trim()) setIsSearchOpen(true);
                }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
                style={{
                  width: '100%', padding: '0.6rem 0.5rem 0.6rem 2.5rem',
                  border: 'none', borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.9rem', outline: 'none', backgroundColor: 'transparent',
                  transition: 'border-color var(--transition-fast)'
                }}
              />
              <Search size={18} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setIsSearchOpen(false); }}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: '0.25rem', top: '50%', transform: 'translateY(-50%)',
                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                    width: '20px', height: '20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b'
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </form>

            {/* Dropdown — only when input has content and is open */}
            {isSearchOpen && debouncedSearch && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                backgroundColor: 'white', borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                overflow: 'hidden', zIndex: 100,
              }}>
                {isPreviewLoading && previewResults.length === 0 ? (
                  <div style={{ padding: '1.25rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
                    Searching…
                  </div>
                ) : previewResults.length === 0 ? (
                  <div style={{ padding: '1.25rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
                    No matches for "{debouncedSearch}"
                  </div>
                ) : (
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {previewResults.map(p => {
                      const img = getImageUrl(p.image);
                      return (
                        <Link
                          key={p.id}
                          to={`/product/${p.slug || p.id}`}
                          onClick={() => setIsSearchOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.65rem',
                            padding: '0.55rem 0.75rem', textDecoration: 'none',
                            color: 'var(--text-primary)', borderBottom: '1px solid #f1f5f1',
                            transition: 'background 0.15s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '8px',
                            backgroundColor: '#f1f5f1', flexShrink: 0, overflow: 'hidden',
                          }}>
                            {img && (
                              <img src={img} alt={p.name}
                                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.82rem', fontWeight: 600,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>{p.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                              ₹{Number(p.price).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => commitSearch()}
                  style={{
                    width: '100%', padding: '0.7rem 1rem',
                    backgroundColor: 'var(--bg-deep)', color: 'white',
                    border: 'none', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  }}
                >
                  View All {previewTotal > 0 ? `(${previewTotal})` : ''} <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop: Center Logo ───────────────────────────────────────────── */}
        <Link to="/" className="desktop-flex" style={{
          textDecoration: 'none', justifyContent: 'center',
          flexGrow: 1,
          transform: scrolled ? 'scale(0.85)' : 'scale(1)',
          transition: 'transform var(--transition-base)'
        }}>
          <NaturalLogo textColor="var(--text-primary)" size={scrolled ? 18 : 22} />
        </Link>

        {/* ── Right Actions ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(0.75rem, 2vw, 1.25rem)',
          marginLeft: 'auto', flexShrink: 0,
          color: 'var(--text-primary)'
        }}>
          {/* Admin — desktop only */}
          {user?.is_superuser && (
            <Link to="/super-admin" className="desktop-flex" style={{ color: 'inherit', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <ShieldCheck size={20} strokeWidth={1.5} color="var(--brand-gold)" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-gold)' }}>Admin</span>
            </Link>
          )}

          {/* Profile dropdown — desktop only */}
          {user ? (
            <div ref={profileRef} className="desktop-only" style={{ position: 'relative', display: 'block' }}>
              <button
                onClick={() => setIsProfileOpen(prev => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 0 }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden',
                  border: '1.5px solid var(--brand-gold)', padding: '2px',
                  transition: 'box-shadow 0.2s',
                  boxShadow: isProfileOpen ? '0 0 0 3px rgba(229,196,139,0.25)' : 'none'
                }}>
                  <img
                    src={getImageUrl(user.avatar_url) || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name || user.username}&backgroundColor=1b2d2a&fontFamily=serif&fontSize=40&fontWeight=700`}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {(user.full_name || user.username || 'User').split(' ')[0]}
                </span>
              </button>

              {isProfileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                  backgroundColor: 'white', borderRadius: '16px',
                  border: '1px solid var(--border-subtle)', boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                  minWidth: '220px', maxWidth: 'calc(100vw - 1rem)', overflow: 'hidden', zIndex: 100
                }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{user.full_name || user.username}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0', textTransform: 'capitalize' }}>
                      {user.role === 'grower' ? '🌿 Grower' : user.role === 'admin' ? '⚙️ Admin' : '🪴 Collector'}
                    </p>
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    {[
                      { to: '/profile', label: 'Collector Hub', icon: <User size={16} /> },
                      { to: '/profile', state: { tab: 'addresses' }, label: 'Saved Addresses', icon: <MapPin size={16} /> },
                      ...(isGrower ? [{ to: '/seller/dashboard', label: 'Seller Dashboard', icon: <LayoutDashboard size={16} />, accent: true }] : []),
                      ...(user.is_superuser ? [{ to: '/super-admin', label: 'Super Admin Portal', icon: <ShieldCheck size={16} /> }] : []),
                    ].map(item => (
                      <Link
                        key={item.label}
                        to={item.to}
                        state={item.state}
                        onClick={() => setIsProfileOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.85rem 1rem', borderRadius: '10px',
                          color: item.accent ? 'var(--brand-green)' : 'var(--text-primary)',
                          textDecoration: 'none', fontSize: '0.875rem',
                          fontWeight: item.accent ? 700 : 600, transition: 'background 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {item.icon} {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={() => { setIsProfileOpen(false); logout(); navigate('/login'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.85rem 1rem', borderRadius: '10px', color: '#ef4444',
                        fontSize: '0.875rem', fontWeight: 600,
                        background: 'none', border: 'none', cursor: 'pointer',
                        width: '100%', textAlign: 'left', transition: 'background 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={16} /> Secure Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="desktop-flex" style={{ color: 'inherit', alignItems: 'center', gap: '0.6rem' }}>
              <User size={20} strokeWidth={1.5} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sign In</span>
            </Link>
          )}

          {/* Mobile: search overlay trigger */}
          <button
            className="mobile-only"
            onClick={() => setIsMobileSearchOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', padding: '2px' }}
            aria-label="Search"
          >
            <Search size={21} strokeWidth={1.5} />
          </button>

          {/* Notification bell — both mobile & desktop when logged in */}
          {user && <NotificationBell />}

          {/* Mobile: sign-in icon when logged out */}
          {!user && (
            <Link to="/login" className="mobile-only" style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <User size={21} strokeWidth={1.5} />
            </Link>
          )}

          {/* Wishlist — both mobile & desktop */}
          <Link to="/wishlist" style={{ color: 'inherit', position: 'relative', display: 'flex' }}>
            <Heart size={20} strokeWidth={1.5}
              color={wishlist.length > 0 ? 'var(--brand-gold)' : 'currentColor'}
              fill={wishlist.length > 0 ? 'var(--brand-gold)' : 'none'} />
            {wishlist.length > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: 'var(--bg-deep)', color: 'white', fontSize: '0.6rem', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart — desktop only; mobile uses the FAB */}
          <Link to="/cart" className="desktop-flex" style={{ alignItems: 'center', gap: '0.5rem', position: 'relative', color: 'inherit' }}>
            <ShoppingCart size={20} strokeWidth={1.5} />
            {cart?.total_items > 0 && (
              <span style={{
                position: 'absolute', top: '-8px', right: '-8px',
                backgroundColor: 'var(--brand-gold)', color: 'white',
                fontSize: '0.65rem', borderRadius: '50%', width: '17px', height: '17px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {cart.total_items}
              </span>
            )}
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Desktop Sub-nav */}
      <nav className="desktop-only" style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'white'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3.5rem',
          padding: '0.85rem 0'
        }}>
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.path}
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: location.pathname === link.path ? 'var(--brand-gold)' : 'var(--text-primary)',
                transition: 'color var(--transition-fast)'
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        open={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          onTouchEnd={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 31, 28, 0.4)', backdropFilter: 'blur(4px)',
            zIndex: 2000, transition: 'all 0.4s'
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: isMobileMenuOpen ? 0 : '-100%',
        width: '100%', maxWidth: '350px', height: '100vh', backgroundColor: 'white',
        zIndex: 2001, transition: 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <NaturalLogo size={36} />
          <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 700,
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '1rem'
              }}
            >
              <Store size={20} color="var(--brand-gold)" /> Home
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Gallery Sections</p>
            {navLinks.filter(l => l.name !== 'Home').map(link => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 700,
                  color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                {link.name} <ChevronRight size={18} color="var(--border-subtle)" />
              </Link>
            ))}

            {location.pathname.startsWith('/shop') && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.dispatchEvent(new Event('openMobileFilter'));
                }}
                style={{
                  fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 700,
                  color: 'var(--brand-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                  marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem'
                }}
              >
                Filter Catalog <SlidersHorizontal size={18} />
              </button>
            )}
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {user ? (
              <>
                {user.is_superuser && (
                  <>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Admin Hub</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                      <Link to="/super-admin" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={18} color="var(--brand-gold)" /> Super Admin Dashboard
                      </Link>
                    </div>
                  </>
                )}
                {isGrower && (
                  <>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Seller Hub</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                      <Link to="/seller/dashboard" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Store size={18} color="var(--brand-green)" /> Seller Dashboard
                      </Link>
                    </div>
                  </>
                )}
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Collector Hub</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Link to="/profile" state={{ tab: 'identity' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <User size={18} /> Identity Details
                  </Link>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Package size={18} /> My Orders
                  </Link>
                  <Link to="/profile" state={{ tab: 'history' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Package size={18} /> Order History
                  </Link>
                  <Link to="/profile" state={{ tab: 'wishlist' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Heart size={18} /> Curated Wishlist
                  </Link>
                  <Link to="/profile" state={{ tab: 'notifications' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={18} /> Studio Updates
                    {unreadCount > 0 && (
                      <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, borderRadius: '20px', padding: '2px 7px', minWidth: '20px', textAlign: 'center' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" state={{ tab: 'security' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={18} /> Security & Access
                  </Link>
                  {/* Seller Dashboard — only for verified growers */}
                  {isGrower && (
                    <Link to="/seller/dashboard" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <LayoutDashboard size={18} /> Seller Dashboard
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Account</p>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--brand-gold)' }}>Member Sign In</Link>
              </>
            )}

            {/* Track Order & Report Bug - Available to all users */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Quick Access</p>
              <Link to="/track" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Truck size={18} /> Track Order
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.dispatchEvent(new Event('openBugReport'));
                }}
                style={{
                  fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left'
                }}
              >
                <Bug size={18} /> Report a Bug
              </button>
            </div>
            {user && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                style={{
                  marginTop: 'auto',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  color: '#ef4444', fontSize: '1rem', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '1rem 0'
                }}
              >
                <LogOut size={18} /> Secure Sign Out
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '2rem 1.5rem', backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Junglyst Boutique © 2026<br />
          Verified Botanical Specimens
        </div>
      </div>
    </header>
  );
}
