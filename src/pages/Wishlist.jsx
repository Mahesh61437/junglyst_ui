import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { Heart, ArrowRight, ShoppingBag } from 'lucide-react';

export default function Wishlist() {
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="container" style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem',
            color: 'var(--brand-gold)'
          }}>
            <Heart size={32} />
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Specimen Wishlist</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '4rem', maxWidth: '500px', margin: '0 auto 4rem' }}>
             You haven't prioritized any specimens yet. Discover our latest arrivals to begin your curated collection.
          </p>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1.125rem 3.5rem' }}>
            Start Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <header style={{ marginBottom: '6rem', textAlign: 'center' }} className="slide-up">
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '1.5rem', display: 'block' }}>Private Gallery</span>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>Specimen Wishlist</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          A curated selection of botanical masterpieces you are tracking for future acquisition.
        </p>
      </header>

      <div className="grid-responsive slide-up" style={{ animationDelay: '0.2s' }}>
        {wishlist.map(product => (
          <ProductCard 
            key={product.id}
            {...product}
            name={product.name || product.title}
          />
        ))}
      </div>

      <div style={{ marginTop: '8rem', textAlign: 'center' }} className="slide-up">
        <Link to="/shop" className="btn btn-outline" style={{ padding: '1.125rem 3.5rem' }}>
           Continue Shopping
        </Link>
      </div>
    </div>
  );
}

