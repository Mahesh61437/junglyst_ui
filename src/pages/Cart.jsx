import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Truck, ArrowLeft, ShoppingBag, ShieldCheck, Leaf, ChevronRight, Bookmark, Info, HelpCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUtils';

export default function Cart() {
  const { cart, loading, updateItemQuantity, removeItem, GLOBAL_FREE_SHIPPING, PLANT_SINGLE_SELLER_FREE } = useCart();
  const { addToWishlist } = useWishlist();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
        <div className="fade-in" style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800 }}>Analyzing Logistics...</div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '8rem 1.5rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ backgroundColor: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#cbd5e1' }}>
            <ShoppingBag size={32} strokeWidth={1} />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)' }}>Your Sanctuary is Empty</h1>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>Explore Gallery</Link>
        </div>
      </div>
    );
  }

  const sellerGroups = cart.seller_groups || {};

  return (
    <div className="container" style={{ padding: '3rem 1rem 10rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>

        {/* Main Cart Content */}
        <div className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Shopping Cart</h1>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Price</span>
            </div>

            {/* Seller Grouping */}
            {Object.entries(sellerGroups).map(([sellerId, group]) => (
              <div key={sellerId} style={{ marginBottom: '4rem' }}>
                {/* Seller Header & Progress */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fcfdfc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sold by: {group.seller?.seller_profile?.store_name || "Botanical Studio"}</span>
                      <div style={{ height: '12px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>Verified Grower</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Group Subtotal: ₹{group.subtotal.toLocaleString()}</span>
                  </div>

                  {/* Logistics Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flexGrow: 1, height: '4px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (group.subtotal / PLANT_SINGLE_SELLER_FREE) * 100)}%`, backgroundColor: '#10b981', transition: 'width 0.5s ease' }}></div>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: group.subtotal >= PLANT_SINGLE_SELLER_FREE ? '#10b981' : '#64748b' }}>
                      {group.subtotal >= PLANT_SINGLE_SELLER_FREE ? 'FREE DELIVERY UNLOCKED' : `Add ₹${(PLANT_SINGLE_SELLER_FREE - group.subtotal).toLocaleString()} for Free Shipping`}
                    </span>
                  </div>
                </div>

                {/* Items in this group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {group.items.map((item, idx) => {
                    const product = item.product || {};
                    const variant = item.variant || {};
                    return (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 100px', gap: '2rem' }}>
                        <div style={{ width: '180px', height: '180px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                          <img src={getImageUrl(variant.image_url || product.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--bg-deep)' }}>{product.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                            In Stock • Rare Specimen
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Variant: {variant.name || 'Standard'} • {variant.weight || 0.5}kg</span>

                          {/* Controls Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: 'auto', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.2rem' }}>
                              <button onClick={() => updateItemQuantity(cart.items.indexOf(item), -1)} style={{ padding: '0.25rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>-</button>
                              <span style={{ padding: '0 0.5rem', fontSize: '0.9rem', fontWeight: 800 }}>{item.quantity}</span>
                              <button onClick={() => updateItemQuantity(cart.items.indexOf(item), 1)} style={{ padding: '0.25rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>+</button>
                            </div>
                            <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                            <button onClick={() => removeItem(cart.items.indexOf(item))} style={{ background: 'none', border: 'none', color: '#007185', fontSize: '0.8rem', cursor: 'pointer' }}>Delete</button>
                            <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                            <button onClick={() => addToWishlist(product.id)} style={{ background: 'none', border: 'none', color: '#007185', fontSize: '0.8rem', cursor: 'pointer' }}>Save for later</button>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.25rem' }}>
                          ₹{((variant.price || product.price || 0) * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amazon-Style Sidebar */}
        <aside style={{ position: 'sticky', top: '2rem' }}>
          {/* Subtotal Card */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '1rem' }}>
              <CheckCircle size={18} fill="#10b981" color="white" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Your order qualifies for FREE Delivery.</span>
            </div>

            <div style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              Subtotal ({cart.total_items} items): <strong style={{ fontWeight: 800 }}>₹{cart.subtotal.toLocaleString()}</strong>
            </div>

            <button onClick={() => navigate('/checkout')} style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: '#ffd814',
              border: '1px solid #fcd200',
              borderRadius: '100px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(213,217,217,.5)'
            }}>
              Proceed to Buy
            </button>

            <div style={{ marginTop: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.85rem' }}>EMI Available</span>
              <ChevronRight size={18} />
            </div>
          </div>

          {/* Related Specimens (Mock Discovery) */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.25rem' }}>Recommended for your Collection</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[1, 2].map(i => (
                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '8px', flexShrink: 0 }}></div>
                  <div>
                    <h5 style={{ fontSize: '0.8rem', color: '#007185', margin: '0 0 0.25rem', cursor: 'pointer' }}>Rare Monstera Adansonii Variegata</h5>
                    <div style={{ color: '#c45500', fontSize: '0.75rem', fontWeight: 700 }}>₹2,499.00</div>
                    <button style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.7rem', backgroundColor: 'white', border: '1px solid #d5d9d9', borderRadius: '100px', cursor: 'pointer' }}>Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckCircle({ size, fill, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
