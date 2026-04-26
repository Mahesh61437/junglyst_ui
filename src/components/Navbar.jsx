import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Heart, LogOut, X, ChevronRight, Store } from 'lucide-react';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'New Arrivals', path: '/shop' },
    { name: 'Plants', path: '/shop/Aquatic Plants' },
    { name: 'Hardscape', path: '/shop/Hardscape' },
    { name: 'Verified Sellers', path: '/sellers' },
    { name: 'Care Guides', path: '/guides' },
  ];

  return (
    <header style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      fontFamily: 'var(--font-sans)',
      transition: 'all var(--transition-base)',
      boxShadow: scrolled ? 'var(--shadow-md)' : 'none'
    }}>
      {/* Top Utility Bar */}
      <div style={{ 
        backgroundColor: 'var(--bg-deep)', 
        color: 'white', 
        fontSize: '0.7rem', 
        textAlign: 'center', 
        padding: '0.6rem 0',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase'
      }}>
        Free Expert Packaging on All Orders Above ₹999
      </div>

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '5.5rem'
      }}>
        {/* Left: Hamburger (Mobile) / Search (Desktop) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center'
            }}
          >
            <Menu size={24} />
          </button>
          
          <div style={{ 
            position: 'relative', 
            width: '240px',
            display: window.innerWidth > 768 ? 'block' : 'none'
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
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          transform: scrolled ? 'scale(0.9)' : 'scale(1)',
          transition: 'transform var(--transition-base)'
        }}>
          <NaturalLogo textColor="var(--text-primary)" size={scrolled ? 42 : 48} />
        </Link>
        
        {/* Right: Actions */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          gap: '1.5rem', 
          flex: 1,
          color: 'var(--text-primary)' 
        }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
               <Link 
                to="/profile" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'inherit' }}
               >
                 <div style={{ 
                   width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', 
                   border: '1.5px solid var(--brand-gold)', padding: '2px' 
                 }}>
                    <img 
                      src={getImageUrl(user.avatar_url) || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name || user.username}&backgroundColor=1b2d2a&fontFamily=serif&fontSize=40&fontWeight=700`} 
                      alt="P" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                    />
                 </div>
                 <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: window.innerWidth > 768 ? 'block' : 'none' }}>
                   {(user.full_name || user.username || 'User').split(' ')[0]}
                 </span>
               </Link>
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
      <nav style={{ 
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'white',
        display: window.innerWidth > 768 ? 'block' : 'none'
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
        position: 'fixed', top: 0, left: isMobileMenuOpen ? 0 : '-320px', 
        width: '300px', height: '100vh', backgroundColor: 'white', 
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
                style={{ 
                  fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 700, 
                  color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                {link.name} <ChevronRight size={18} color="var(--border-subtle)" />
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Account</p>
            {user ? (
              <>
                <Link to="/profile" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>My Profile</Link>
                <Link to="/seller/dashboard" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--brand-green)' }}>Grower Dashboard</Link>
                <button onClick={logout} style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogOut size={18} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--brand-gold)' }}>Member Sign In</Link>
            )}
          </div>
        </div>

        <div style={{ padding: '2rem 1.5rem', backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Junglyst Boutique © 2026<br/>
          Verified Botanical Specimens
        </div>
      </div>
    </header>
  );
}

