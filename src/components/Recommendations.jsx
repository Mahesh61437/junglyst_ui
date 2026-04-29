import { useState, useEffect } from 'react';
import { ProductService } from '../services/ProductService';
import ProductCard from './ProductCard';

export default function Recommendations({ category, currentProductId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await ProductService.getProducts();
        const results = data.results || data || [];
        // Filter by same category, exclude current product, and take top 4
        const filtered = results
          .filter(p => p.category === category && p.id !== currentProductId)
          .slice(0, 4);
        setProducts(filtered);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [category, currentProductId]);

  if (loading || products.length === 0) return null;

  return (
    <div style={{ padding: '0 1rem' }}>
      <h3 style={{ 
        fontSize: '1.75rem', 
        fontFamily: 'var(--font-serif)', 
        color: 'var(--bg-deep)', 
        marginBottom: '2.5rem', 
        borderBottom: '1px solid var(--border-subtle)', 
        paddingBottom: '1rem',
        letterSpacing: '-0.02em'
      }}>
        Specimens You May Highly Value
      </h3>
      <div className="grid-responsive">
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            id={product.id}
            name={product.name || product.title}
            price={product.price}
            image={product.imageUrl || product.image_url || product.image}
            reviews={product.rating || 4.8}
            stockStatus={product.stock > 0 ? "In Stock" : "Listing Soon"}
            seller={product.seller}
            stock={product.stock}
          />
        ))}
      </div>
    </div>
  );
}
