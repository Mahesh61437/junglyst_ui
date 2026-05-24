import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { ProductService } from '../services/ProductService';
import ProductCard from './ProductCard';

/**
 * Fetches products related to a blog post by running parallel searches against
 * each productTag, deduping results, and rendering up to `limit` ProductCards.
 *
 * Falls back silently to nothing when:
 *  - no tags were supplied on the blog
 *  - the API fails
 *  - none of the searches return matches
 *
 * Renders the existing ProductCard, which carries its own Add to Cart and
 * quantity-stepper UI — so users can purchase directly from the blog page.
 */
export default function BlogFeaturedProducts({ tags = [], limit = 4, blogTitle = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRelated = async () => {
      if (!tags || tags.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Run a search per tag in parallel — DRF SearchFilter matches
        // ?search= against product name, tag name, and scientific name.
        const responses = await Promise.allSettled(
          tags.map(tag =>
            ProductService.getProducts({ search: tag, page_size: limit })
          )
        );

        // Normalise each tag's results to a list, then round-robin across
        // tags so the user sees variety (e.g. one anubias, one cryptocoryne,
        // one moss…) instead of four anubias variants.
        const buckets = responses
          .filter(r => r.status === 'fulfilled')
          .map(r => {
            const d = r.value;
            return d?.results || d || [];
          });

        const seen = new Set();
        const merged = [];
        let exhausted = false;
        let i = 0;
        while (!exhausted && merged.length < limit) {
          exhausted = true;
          for (const bucket of buckets) {
            if (i >= bucket.length) continue;
            exhausted = false;
            const p = bucket[i];
            if (!p?.id || seen.has(p.id)) continue;
            seen.add(p.id);
            merged.push(p);
            if (merged.length >= limit) break;
          }
          i += 1;
        }

        if (!cancelled) setProducts(merged);
      } catch (err) {
        console.error('BlogFeaturedProducts fetch failed:', err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRelated();
    return () => { cancelled = true; };
  }, [JSON.stringify(tags), limit]);

  // Hide entire block if we have nothing to show — keeps blog page clean
  if (loading) {
    return (
      <div style={{
        marginTop: '4rem',
        padding: '2rem',
        backgroundColor: '#f1f5f9',
        borderRadius: '16px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.9rem'
      }}>
        Loading featured products...
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div style={{
        marginTop: '4rem',
        padding: '2.5rem',
        backgroundColor: '#0A3029',
        color: 'white',
        borderRadius: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#E5C48B',
          fontSize: '0.7rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1rem'
        }}>
          <ShoppingBag size={14} /> Shop the Guide
        </div>
        <h3 style={{
          fontFamily: 'serif',
          fontSize: '1.5rem',
          margin: '0 0 0.5rem'
        }}>
          We're sourcing specimens for this guide.
        </h3>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.95rem',
          margin: '0 0 1.5rem'
        }}>
          In the meantime, browse the full collection from our verified growers.
        </p>
        <Link
          to="/shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#E5C48B',
            color: '#0A3029',
            padding: '0.85rem 1.75rem',
            borderRadius: '100px',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}
        >
          Browse Shop <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '4rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#10b981',
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '0.75rem'
          }}>
            <ShoppingBag size={14} /> Shop the Guide
          </div>
          <h3 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontFamily: 'serif',
            color: '#0A3029',
            margin: 0,
            lineHeight: 1.2
          }}>
            {blogTitle ? `Featured for "${blogTitle}"` : 'Featured Products'}
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: '0.95rem',
            marginTop: '0.5rem',
            marginBottom: 0
          }}>
            Hand-picked specimens and supplies from verified Junglyst sellers.
          </p>
        </div>

        <Link
          to="/shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#0A3029',
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
            borderBottom: '2px solid #E5C48B',
            paddingBottom: '0.15rem'
          }}
        >
          Browse all <ChevronRight size={16} />
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {products.map(product => (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            name={product.name || product.title}
            scientific_name={product.scientific_name}
            care_level={product.care_level}
            origin={product.origin}
            growth_rate={product.growth_rate}
            price={product.price}
            originalPrice={product.original_price}
            image={product.imageUrl || product.image_url || product.image}
            reviews={product.rating || 4.8}
            stockStatus={product.stock > 0 ? 'In Stock' : 'Listing Soon'}
            seller={product.seller}
            stock={product.stock}
            variants={product.variants}
          />
        ))}
      </div>
    </div>
  );
}
