import ProductCard from './ProductCard';

export default function CompleteYourSetup({ products = [] }) {
  if (products.length === 0) return null;

  return (
    <section aria-label="Complementary products" style={{ padding: '0 1rem' }}>
      <h2 style={{
        fontSize: '1.75rem',
        fontFamily: 'var(--font-serif)',
        color: 'var(--bg-deep)',
        marginBottom: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '1rem',
        letterSpacing: '-0.02em'
      }}>
        Complete Your Setup
      </h2>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        marginTop: '0'
      }}>
        Everything this specimen needs to thrive
      </p>
      <div className="grid-responsive">
        {products.map(product => (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            name={product.name || product.title}
            price={product.price}
            image={product.imageUrl || product.image_url || product.image}
            reviews={product.rating || 4.8}
            stockStatus={product.stock > 0 ? 'In Stock' : 'Listing Soon'}
            seller={product.seller}
            stock={product.stock}
            variants={product.variants}
          />
        ))}
      </div>
    </section>
  );
}
