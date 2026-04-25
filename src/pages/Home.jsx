import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ProductService } from '../services/ProductService';
import { ShieldCheck, ArrowRight, Star, Leaf, Award, Truck } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await ProductService.getProducts();
        const results = data.results || data || [];
        setProducts(results.slice(0, 8)); // Only show top 8 on home
      } catch (error) {
        console.error("Failed to fetch products API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* Exhibition Carousel */}
      <HeroCarousel />

      {/* Trust Standards */}
      <section style={{ backgroundColor: 'white', padding: '6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '4rem' 
        }}>
          <div className="slide-up" style={{ display: 'flex', gap: '1.5rem', animationDelay: '0.1s' }}>
             <div style={{ color: 'var(--brand-gold)', flexShrink: 0 }}><Award size={32} strokeWidth={1.5} /></div>
             <div>
               <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Verified Growers Only</h4>
               <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Every plant on Junglyst is sourced from vetted experts with proven cultivation standards.</p>
             </div>
          </div>
          <div className="slide-up" style={{ display: 'flex', gap: '1.5rem', animationDelay: '0.2s' }}>
             <div style={{ color: 'var(--brand-gold)', flexShrink: 0 }}><Truck size={32} strokeWidth={1.5} /></div>
             <div>
               <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Expert Packaging</h4>
               <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Proprietary moisture-lock methods ensure your delivery arrives in pristine, nursery condition.</p>
             </div>
          </div>
          <div className="slide-up" style={{ display: 'flex', gap: '1.5rem', animationDelay: '0.3s' }}>
             <div style={{ color: 'var(--brand-gold)', flexShrink: 0 }}><ShieldCheck size={32} strokeWidth={1.5} /></div>
             <div>
               <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Pest-Free Guarantee</h4>
               <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>We guarantee all specimens are treated and inspected for quality before leaving the farm.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="container" style={{ padding: '8rem 1.5rem' }}>
        <div className="slide-up" style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--brand-gold)' }}></span>
            <span style={{ color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Current Curation</span>
            <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--brand-gold)' }}></span>
          </div>
          <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Seasonal Exhibitions</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
            A curated selection of the finest specimens currently in peak health across our verified partner farms.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem' }}>
            <div className="fade-in" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Curating your collection...</div>
          </div>
        ) : (
          <div className="grid-responsive slide-up" style={{ animationDelay: '0.2s' }}>
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                id={product.id}
                name={product.name || product.title}
                price={product.price}
                originalPrice={product.compare_at_price || product.originalPrice}
                image={product.imageUrl || product.image_url || product.image}
                trending={product.is_trending}
                reviews={product.rating || 4.8}
                stockStatus={product.stock > 0 ? "In Stock" : "Sold Out"}
                seller={{ name: product.seller?.name || "Verified Grower" }}
              />
            ))}
          </div>
        )}

        <div className="slide-up" style={{ marginTop: '5rem', textAlign: 'center', animationDelay: '0.4s' }}>
          <Link to="/shop" className="btn btn-outline" style={{ padding: '1.125rem 3.5rem' }}>
            Explore the full gallery
          </Link>
        </div>
      </section>

      {/* Grower Spotlight */}
      <section style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '10rem 0', overflow: 'hidden' }}>
        <div className="container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '6rem', 
          alignItems: 'center' 
        }}>
          <div className="slide-up" style={{ position: 'relative' }}>
             <div style={{ 
               position: 'absolute', top: '-30px', left: '-30px', width: '100%', height: '100%', 
               border: '1px solid rgba(255,255,255,0.08)', zIndex: 0 
             }} />
             <img 
               src="https://images.unsplash.com/photo-1616645391185-36f78fecadad?w=800&q=80" 
               alt="Grower Studio" 
               style={{ width: '100%', height: '500px', objectFit: 'cover', position: 'relative', zIndex: 1, boxShadow: '20px 20px 60px rgba(0,0,0,0.3)' }} 
             />
             <div style={{ 
               position: 'absolute', bottom: '40px', right: '-20px', backgroundColor: 'var(--brand-gold)', 
               padding: '2rem', color: 'white', zIndex: 2, boxShadow: 'var(--shadow-lg)'
             }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Studio Profile</p>
                <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>Aquatic Exotica</p>
             </div>
          </div>
          
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <span style={{ color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Featured Grower</span>
            <h2 style={{ fontSize: '4rem', margin: '1.5rem 0 2rem' }}>Cultivating the Extraordinary</h2>
            <p style={{ fontSize: '1.25rem', opacity: 0.85, lineHeight: 1.8, marginBottom: '3rem', fontWeight: 300 }}>
              Based in the lush Western Ghats, Aquatic Exotica specializes in rare Bucephalandra and mosses. Every specimen is grown with precision in proprietary water-scapes, ensuring seamless transition to your aquarium.
            </p>
            <Link to="/shop" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '1rem', 
                color: 'var(--brand-gold)', 
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Shop the Collection <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter / Registry */}
      <section style={{ padding: '8rem 0', textAlign: 'center' }}>
        <div className="container slide-up">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Join the Registry</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.7 }}>
              Be the first to know about new exhibitions, rare specimens, and expert care guides.
            </p>
            <form style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input 
                type="email" 
                placeholder="collector@example.com" 
                style={{ 
                  padding: '1.125rem 1.5rem', borderRadius: '100px', border: '1px solid var(--border-subtle)',
                  minWidth: '300px', outline: 'none', fontSize: '1rem'
                }} 
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '1.125rem 3rem' }}>Register</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
