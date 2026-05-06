import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Heart, LogOut, X, ChevronRight, Store, LayoutDashboard, Package, Bell, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import NaturalLogo from './NaturalLogo';
import { getImageUrl } from '../utils/imageUtils';

export default function Navbar() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isGrower = user?.role === 'grower' || user?.role === 'admin';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

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
    { name: 'Verified Sellers', path: '/sellers' },
    { name: 'Care Guides', path: '/guides' },
  ];

  return (
    <header className="navbar" style={{
      boxShadow: scrolled ? 'var(--shadow-md)' : 'none'
    }}>
      {/* Top Utility Bar */}
      <div className="desktop-only" style={{
        backgroundColor: 'var(--bg-deep)',
        color: 'white',
        fontSize: '0.65rem',
        textAlign: 'center',
        padding: '0.5rem 0',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase'
      }}>
        Free Expert Packaging on All Orders Above ₹999
      </div>

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'var(--nav-height-mobile)',
        gap: '0.5rem'
      }}>
        {/* Left: Hamburger / Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center'
            }}
          >
            <Menu size={24} />
          </button>

          <div className="desktop-only" style={{
            position: 'relative',
            width: '240px'
          }}>
            <input
              type="text"
              placeholder="Search Junglyst..."
              style={{
                width: '100%',
                padding: '0.6rem 0.5rem 0.6rem 2.5rem',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: 'transparent',
                transition: 'border-color var(--transition-fast)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-gold)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            <Search size={18} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>
        </div>

        {/* Center: Brand Logo */}
        <Link to="/" style={{
          textDecoration: 'none',
          display: 'flex',
          justifyContent: 'center',
          flexGrow: 1,
          transform: scrolled ? 'scale(0.85)' : 'scale(1)',
          transition: 'transform var(--transition-base)'
        }}>
          <NaturalLogo textColor="var(--text-primary)" size={scrolled ? 36 : 42} />
        </Link>

        {/* Right: Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'clamp(0.75rem, 2vw, 1.5rem)',
          flexShrink: 0,
          color: 'var(--text-primary)'
        }}>
          {(user?.is_staff || user?.role === 'admin') && (
            <Link to="/super-admin" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <ShieldCheck size={20} strokeWidth={1.5} color="var(--brand-gold)" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: window.innerWidth > 768 ? 'block' : 'none', color: 'var(--brand-gold)' }}>Admin</span>
            </Link>
          )}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Profile Dropdown */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsProfileOpen(prev => !prev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                    padding: 0
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden',
                    border: '1.5px solid var(--brand-gold)',
                    padding: '2px',
                    transition: 'box-shadow 0.2s',
                    boxShadow: isProfileOpen ? '0 0 0 3px rgba(229,196,139,0.25)' : 'none'
                  }}>
                    <img
                      src={getImageUrl(user.avatar_url) || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name || user.username}&backgroundColor=1b2d2a&fontFamily=serif&fontSize=40&fontWeight=700`}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: window.innerWidth > 768 ? 'block' : 'none' }}>
                    {(user.full_name || user.username || 'User').split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Panel */}
                {isProfileOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                    minWidth: '220px',
                    overflow: 'hidden',
                    zIndex: 100
                  }}>
                    {/* User info header */}
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{user.full_name || user.username}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0', textTransform: 'capitalize' }}>
                        {user.role === 'grower' ? '🌿 Grower' : user.role === 'admin' ? '⚙️ Admin' : '🪴 Collector'}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '0.5rem' }}>
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.85rem 1rem', borderRadius: '10px',
                          color: 'var(--text-primary)', textDecoration: 'none',
                          fontSize: '0.875rem', fontWeight: 600,
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <User size={16} /> Collector Hub
                      </Link>

                      {user.role === 'grower' && (
                        <Link
                          to="/seller/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.85rem 1rem', borderRadius: '10px',
                            color: 'var(--brand-green)', textDecoration: 'none',
                            fontSize: '0.875rem', fontWeight: 700,
                            transition: 'background 0.15s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <LayoutDashboard size={16} /> Seller Dashboard
                        </Link>
                      )}

                      {(user.is_staff || user.role === 'admin') && (
                        <Link
                          to="/super-admin"
                          onClick={() => setIsProfileOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.85rem 1rem', borderRadius: '10px',
                            color: 'var(--text-primary)', textDecoration: 'none',
                            fontSize: '0.875rem', fontWeight: 600,
                            transition: 'background 0.15s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <ShieldCheck size={16} /> Super Admin Portal
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.85rem 1rem', borderRadius: '10px',
                          color: '#ef4444', textDecoration: 'none',
                          fontSize: '0.875rem', fontWeight: 600,
                          background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                          textAlign: 'left', transition: 'background 0.15s'
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
            </div>
          ) : (
            <Link to="/login" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <User size={20} strokeWidth={1.5} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: window.innerWidth > 768 ? 'block' : 'none' }}>Sign In</span>
            </Link>
          )}

          <Link to="/wishlist" style={{ color: 'inherit', position: 'relative', display: 'flex' }}>
            <Heart size={20} strokeWidth={1.5} color={wishlist.length > 0 ? 'var(--brand-gold)' : 'currentColor'} fill={wishlist.length > 0 ? 'var(--brand-gold)' : 'none'} />
            {wishlist.length > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: 'var(--bg-deep)', color: 'white', fontSize: '0.6rem', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', color: 'inherit' }}>
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

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
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
                {(user.is_staff || user.role === 'admin') && (
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
                  <Link to="/profile" state={{ tab: 'history' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Package size={18} /> Acquisition History
                  </Link>
                  <Link to="/profile" state={{ tab: 'wishlist' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Heart size={18} /> Curated Wishlist
                  </Link>
                  <Link to="/profile" state={{ tab: 'notifications' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={18} /> Studio Updates
                  </Link>
                  <Link to="/profile" state={{ tab: 'security' }} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={18} /> Security & Access
                  </Link>
                  {/* Seller Dashboard — only for verified growers */}
                  {user.role === 'grower' && (
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
