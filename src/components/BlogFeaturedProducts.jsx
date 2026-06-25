import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { ProductService } from '../services/ProductService';
import ProductCard from './ProductCard';

// Blog product data changes at most once a day — cache aggressively.
const STALE_MS  = 1000 * 60 * 60 * 4;  // treat as fresh for 4 hours
const GC_MS     = 1000 * 60 * 60 * 24; // keep in memory cache for 24 hours

async function fetchBlogProducts(tags, limit) {
  if (!tags.length) return [];

  const responses = await Promise.allSettled(
    tags.map(tag => ProductService.getProducts({ search: tag, page_size: limit }))
  );

  // Round-robin across tag buckets so the user sees variety
  const buckets = responses
    .filter(r => r.status === 'fulfilled')
    .map(r => { const d = r.value; return d?.results || d || []; });

  const seen   = new Set();
  const merged = [];
  let i = 0, exhausted = false;
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
    i++;
  }
  return merged;
}

export default function BlogFeaturedProducts({ tags = [], limit = 4, blogTitle = '' }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['blog-products', tags.slice().sort().join(','), limit],
    queryFn: () => fetchBlogProducts(tags, limit),
    enabled: tags.length > 0,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div style={{ marginTop: '4rem', padding: '2rem', backgroundColor: '#f1f5f9', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
        Loading recommended products…
      </div>
    );
  }

  if (!products.length) {
    return (
      <div style={{ marginTop: '4rem', padding: '2.5rem', backgroundColor: '#0A3029', color: 'white', borderRadius: '20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#c9972b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
          <ShoppingBag size={14} /> Shop the Guide
        </div>
        <h3 style={{ fontFamily: 'serif', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
          We're sourcing specimens for this guide.
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
          In the meantime, browse the full collection from our verified growers.
        </p>
        <Link
          to="/shop"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#c9972b', color: '#0A3029', padding: '0.85rem 1.75rem', borderRadius: '100px', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Browse Shop <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            <ShoppingBag size={14} /> Shop the Guide
          </div>
          <h3 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontFamily: 'serif', color: '#0A3029', margin: 0, lineHeight: 1.2 }}>
            {blogTitle ? `Recommended for "${blogTitle}"` : 'Recommended Products'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.5rem', marginBottom: 0 }}>
            Hand-picked specimens and supplies from verified Junglyst growers.
          </p>
        </div>
        <Link
          to="/shop"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0A3029', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', borderBottom: '2px solid #c9972b', paddingBottom: '0.15rem' }}
        >
          Browse all <ChevronRight size={16} />
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
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
