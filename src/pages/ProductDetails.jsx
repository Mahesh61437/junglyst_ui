import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Droplets,
  Sun,
  Thermometer,
  Share2,
  ArrowLeft,
  ChevronRight,
  Star,
  Leaf,
  Award,
  Box,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { ProductService } from '../services/ProductService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { trackViewContent, trackAddToCart, trackAddToWishlist } from '../utils/metaPixel';
import ReviewSection from '../components/ReviewSection';
import Recommendations from '../components/Recommendations';
import TrustBadges from '../components/TrustBadges';
import { getImageUrl } from '../utils/imageUtils';
import api from '../services/api';

function MoreFromSeller({ sellerId, sellerName, currentProductId }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!sellerId) return;
    api.get(`/core/products/?seller=${sellerId}&limit=6`)
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setItems(all.filter(p => p.id !== currentProductId).slice(0, 5));
      })
      .catch(() => {});
  }, [sellerId, currentProductId]);

  if (!items.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', margin: 0 }}>More from {sellerName}</h2>
        <Link to={`/shop?seller=${sellerId}`} style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          View All →
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem' }}>
        {items.map(p => {
          const img = p.primary_image || p.images?.[0]?.image_url || p.image_url;
          const price = p.variants?.[0]?.price || p.price;
          return (
            <Link key={p.id} to={`/product/${p.slug || p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ height: '160px', overflow: 'hidden', backgroundColor: '#f8faf8' }}>
                  {img ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '2rem' }}>🌿</div>}
                </div>
                <div style={{ padding: '0.875rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  {price && <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '0.9rem', color: 'var(--bg-deep)' }}>₹{parseFloat(price).toLocaleString('en-IN')}</p>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { slug } = useParams();
  const id = slug; // ProductService auto-detects UUID vs slug
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('Standard');
  const [isMobile, setIsMobile] = useState(false);
  const { addToCart, addItemToCart, LIGHT_FREE_THRESHOLD, HEAVY_FREE_THRESHOLD, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  // HOOKS MUST BE AT THE TOP - Fix for "Rules of Hooks" violation
  const botanicalFacts = useMemo(() => {
    if (!product) return {
      scientificName: 'Tropical Specimen',
      origin: 'Southeast Asia / South America',
      temp: '22°C - 28°C',
      ph: '6.0 - 7.5',
      light: 'Medium',
      co2: 'Recommended',
      history: 'This specimen represents the resilient beauty of natural aquatic ecosystems.'
    };

    const nameStr = (product.name || product.title || "").toLowerCase();
    const isBuce = nameStr.includes('buce');
    const isAnubias = nameStr.includes('anubias');
    const isFern = nameStr.includes('fern');

    if (isBuce) return {
      scientificName: 'Bucephalandra sp.',
      origin: 'Borneo, Indonesia',
      temp: '22°C - 28°C',
      ph: '6.0 - 7.5',
      light: 'Low to Medium',
      co2: 'Recommended',
      history: 'Discovered in the dense rainforests of Kalimantan, Borneo. These rheophytic plants grow primarily on rocks along fast-moving tropical streams, making them exceptionally hardy for aquarium current.'
    };
    if (isAnubias) return {
      scientificName: 'Anubias barteri var. nana',
      origin: 'West Africa',
      temp: '20°C - 30°C',
      ph: '6.0 - 8.0',
      light: 'Low',
      co2: 'Optional',
      history: 'Native to the shaded edges of forest rivers in West Africa. Anubias was first cataloged in the late 19th century.'
    };
    if (isFern) return {
      scientificName: 'Microsorum pteropus',
      origin: 'Southeast Asia',
      temp: '20°C - 28°C',
      ph: '5.5 - 7.5',
      light: 'Low to Medium',
      co2: 'Optional',
      history: 'A classic of the nature aquarium world, Java Fern grows naturally on rocks and driftwood in the waterfalls and streams of Southeast Asia.'
    };

    return {
      scientificName: 'Tropical Specimen',
      origin: 'Southeast Asia / South America',
      temp: '22°C - 28°C',
      ph: '6.0 - 7.5',
      light: 'Medium',
      co2: 'Recommended',
      history: 'This specimen originates from high-biodiversity tropical regions where it has adapted to fluctuating water levels and balanced nutrient loads.'
    };
  }, [product]);

  const images = useMemo(() => {
    const list = [];
    if (!product) return [getImageUrl("")];

    // Check all possible image property names (camelCase from middleware, snake_case from DB)
    const primaryImg = product.imageUrl || product.image_url || product.image;
    if (primaryImg) list.push(getImageUrl(primaryImg));

    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (typeof img === 'string') list.push(getImageUrl(img));
        else if (img.imageUrl) list.push(getImageUrl(img.imageUrl));
        else if (img.image_url) list.push(getImageUrl(img.image_url));
      });
    }
    return list.length > 0 ? list : [getImageUrl("")];
  }, [product]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await ProductService.getProduct(id);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        trackViewContent({ productId: id, name: data.name, price: data.variants?.[0]?.price || data.price });
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const stockLimit = useMemo(() => {
    const raw =
      selectedVariant?.stock ??
      product?.stock ??
      product?.variants?.[0]?.stock;
    const parsed = typeof raw === 'number' ? raw : parseInt(raw ?? '', 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedVariant, product]);

  const hasStockLimit = stockLimit !== null;
  const isSoldOut = hasStockLimit && stockLimit <= 0;
  const lowStock = hasStockLimit && stockLimit > 0 && stockLimit < 10;

  useEffect(() => {
    if (!hasStockLimit) return;
    if (stockLimit <= 0) {
      setQuantity(1);
      return;
    }
    setQuantity((q) => Math.max(1, Math.min(q, stockLimit)));
  }, [hasStockLimit, stockLimit]);

  const handleBuyNow = async () => {
    const safeQty = hasStockLimit ? Math.max(1, Math.min(quantity, Math.max(0, stockLimit))) : quantity;
    if (hasStockLimit && safeQty < 1) return;
    
    const existingItem = cart?.items?.find(i => 
      i.product.id === id && (!selectedVariant?.id || i.variant?.id === selectedVariant?.id)
    );

    if (!existingItem) {
      await addItemToCart(id, safeQty, selectedVariant?.id, product, selectedVariant);
    } else if (existingItem.quantity < safeQty) {
      // Only add the difference if the cart has less than what the user wants to buy right now
      await addItemToCart(id, safeQty - existingItem.quantity, selectedVariant?.id, product, selectedVariant);
    }
    
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '8rem 1.5rem', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Identifying specimen origins...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '8rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Specimen Lost</h2>
        <p>This botanical item is no longer in our vault.</p>
        <Link to="/shop" style={{ display: 'inline-block', marginTop: '2rem', color: 'var(--brand-gold)', fontWeight: 700 }}>Browse Collection</Link>
      </div>
    );
  }

  const name = product?.name || product?.title || "Unknown Specimen";
  const displayPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
  const originalPrice = selectedVariant?.compare_at_price || product.compareAtPrice || product.compare_at_price || Math.round(displayPrice * 1.15);
  const discount = originalPrice > displayPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

  const sellerAvatar = product.seller?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${product.seller?.full_name || product.seller?.username}&backgroundColor=1b2d2a&fontFamily=serif`;

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '8rem' }}>
      <div className="container" style={{ padding: '1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '2rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Junglyst</Link>
          <ChevronRight size={10} style={{ color: 'var(--brand-gold)' }} />
          <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Collection</Link>
          <ChevronRight size={10} style={{ color: 'var(--brand-gold)' }} />
          <span style={{ color: 'var(--brand-green)' }}>{product.category?.name || product.category || 'Specimens'}</span>
        </nav>

        <div className="product-layout-grid">

          {/* Column 1: Media Gallery */}
          <div className="col-media" style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? undefined : '100px', maxWidth: '100%', overflow: 'hidden' }}>
            {isMobile ? (
              <div>
                {/* Mobile carousel */}
                <div style={{
                  position: 'relative',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  backgroundColor: '#fcfcfc',
                  boxShadow: 'var(--shadow-sm)',
                  aspectRatio: '1 / 1',
                }}>
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: `${images.length * 100}%`,
                    transform: `translateX(-${activeImageIdx * (100 / Math.max(1, images.length))}%)`,
                    transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ width: `${100 / Math.max(1, images.length)}%`, height: '100%', flexShrink: 0 }}>
                        <img
                          src={img}
                          alt={name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#cbd5e1;background:#f1f5f9;"><span style="font-size:5rem;margin-bottom:1rem">🌿</span><p style="font-size:0.8rem;font-weight:700;color:var(--text-secondary)">Specimen Image Unstable</p></div>';
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIdx((i) => (i - 1 + images.length) % images.length)}
                        style={{
                          position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                          width: '40px', height: '40px', borderRadius: '999px',
                          backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
                        }}
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setActiveImageIdx((i) => (i + 1) % images.length)}
                        style={{
                          position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                          width: '40px', height: '40px', borderRadius: '999px',
                          backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
                        }}
                        aria-label="Next image"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  <button style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Share2 size={18} color="var(--bg-deep)" />
                  </button>
                </div>

                {/* Dots */}
                {images.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.9rem' }}>
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        style={{
                          width: idx === activeImageIdx ? '20px' : '8px',
                          height: '8px',
                          borderRadius: '999px',
                          backgroundColor: idx === activeImageIdx ? 'var(--bg-deep)' : '#d1d5db',
                          transition: 'all 200ms',
                        }}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Thumbnails strip */}
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingTop: '1rem', justifyContent: 'center' }}>
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          border: idx === activeImageIdx ? '2px solid var(--brand-gold)' : '1px solid var(--border-subtle)',
                          flexShrink: 0,
                          padding: 0,
                          background: 'white'
                        }}
                        aria-label={`Thumbnail ${idx + 1}`}
                      >
                        <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fcfcfc', boxShadow: 'var(--shadow-sm)' }}>
                  <img
                    src={images[activeImageIdx]}
                    alt={name}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:1;color:#cbd5e1;background:#f1f5f9;"><span style="font-size:5rem;margin-bottom:1rem">🌿</span><p style="font-size:0.8rem;font-weight:700;color:var(--text-secondary)">Specimen Image Unstable</p></div>';
                    }}
                  />
                  <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Share2 size={18} color="var(--bg-deep)" />
                  </button>
                </div>
                {images.length > 1 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '0.75rem',
                    overflowX: 'auto',
                    justifyContent: 'center',
                    paddingBottom: '0.5rem'
                  }}>
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onMouseEnter={() => setActiveImageIdx(idx)}
                        onFocus={() => setActiveImageIdx(idx)}
                        style={{
                          width: '80px', height: '80px', border: activeImageIdx === idx ? '2.5px solid var(--brand-gold)' : '1px solid var(--border-subtle)',
                          borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', padding: 0, transition: 'all 0.3s', flexShrink: 0
                        }}
                      >
                        <img
                          src={img}
                          alt="thumb"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#cbd5e1;background:#f1f5f9;font-size:1.5rem">🌿</div>';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Desktop Buy Box / Wishlist (below image) */}
            {/* <div className="desktop-only" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '20px', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--text-secondary)', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ships from</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Junglyst Distribution</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Verified Seller</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-gold)' }}>{product.seller?.username || product.seller?.name || 'Aquatic Exotica'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Guarantee</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-green)' }}>Live Arrival Secured</span>
                </div>
              </div>

              <button 
                onClick={() => toggleWishlist({ id: product.id || product._id, name, price: displayPrice, image: (product?.imageUrl || product?.image_url || product?.image), seller: product?.seller })}
                style={{
                  width: '100%', marginTop: '1.5rem', padding: '1rem', borderRadius: '14px', border: '1px dashed var(--brand-gold)',
                  backgroundColor: 'transparent', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', cursor: 'pointer'
                }}
              >
                + SAVE TO SPECIMEN WISHLIST
              </button>
            </div> */}

            {/* Botanical Tabs Module */}
            <div style={{ marginTop: '3rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {['description', 'care-guide', 'history'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '0.75rem 0',
                      borderBottom: activeTab === tab ? '2px solid var(--bg-deep)' : '2px solid transparent',
                      color: activeTab === tab ? 'var(--bg-deep)' : 'var(--text-secondary)',
                      backgroundColor: 'transparent',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      transition: 'all 0.3s'
                    }}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div style={{ minHeight: '180px' }}>
                {activeTab === 'description' && (
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ maxHeight: showFullDesc ? 'none' : '450px', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                        <div dangerouslySetInnerHTML={{ __html: product.description || "A pristine specimen selected for its exceptional vigor and spectral vibrancy." }} />
                        {!product.description && <p>Each {name} has been meticulously inspected by our studio team, ensuring that leaf health, root distribution, and metabolic activity are at their peak before being cleared for acquisition.</p>}
                      </div>
                      {!showFullDesc && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, white)' }} />
                      )}
                    </div>
                    <button 
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--brand-gold)', fontWeight: 800, padding: 0, marginTop: '1rem', cursor: 'pointer', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em'
                      }}
                    >
                      {showFullDesc ? 'View Less' : 'Full View'}
                    </button>
                  </div>
                )}

                {activeTab === 'care-guide' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {[
                      { label: 'Scientific Category', val: botanicalFacts.scientificName },
                      { label: 'Temperature Range', val: botanicalFacts.temp },
                      { label: 'pH Sensitivity', val: botanicalFacts.ph },
                      { label: 'Photoprobe level', val: botanicalFacts.light },
                      { label: 'CO2 Supplement', val: botanicalFacts.co2 },
                      { label: 'Difficulty Grade', val: product.careLevel || product.care_level || 'Intermediate' }
                    ].map((fact, idx) => (
                      <div key={idx} style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{fact.label}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{fact.val}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                      <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--bg-deep)', fontWeight: 600, fontSize: '1rem' }}>Origins: {botanicalFacts.origin}</p>
                      <p>{botanicalFacts.history}</p>
                    </div>
                    <div style={{ padding: '1rem', borderLeft: '4px solid var(--brand-gold)', backgroundColor: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)' }}>CURATOR'S NOTE:</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Finding large colonies of this variety in the wild is increasingly rare. Our specimens represent sustainable nursery-propagated lines that protect these wild origins.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Branded Meta Information & Botanical Tabs */}
          <div className="col-meta" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {product.seller?.seller_profile?.slug ? (
                  <Link to={`/store/${product.seller.seller_profile.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={14} /> {product.seller?.seller_profile?.store_name || product.seller?.full_name || 'Botanical Studio'}
                  </Link>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={14} /> {product.seller?.seller_profile?.store_name || product.seller?.full_name || 'Botanical Studio'}
                  </span>
                )}
                <span style={{ color: 'var(--border-subtle)' }}>•</span>
                <span style={{ color: 'var(--brand-green)' }}>Verified Seller</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '1rem', flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {name}
                </h1>
                <button
                  onClick={() => toggleWishlist({ id: product.id || product._id, name, price: displayPrice, image: (product?.imageUrl || product?.image_url || product?.image), seller: product?.seller })}
                  style={{
                    background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '50%',
                    width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.3s', color: isInWishlist(product.id || product._id) ? 'var(--brand-gold)' : 'var(--text-secondary)'
                  }}
                >
                  <Heart size={22} fill={isInWishlist(product.id || product._id) ? "var(--brand-gold)" : "none"} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--brand-gold)' }}>
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill={i <= (product.rating || 5) ? "currentColor" : "none"} />)}
                  <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginLeft: '0.5rem' }}>{product.rating || '4.8'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  1,240 Verified Acquisitions
                </div>
              </div>
            </header>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--bg-deep)' }}>₹{displayPrice}</span>
                  {originalPrice > displayPrice && (
                    <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textDecoration: 'line-through', marginLeft: '0.75rem' }}>₹{originalPrice}</span>
                  )}
                </div>
                {discount > 0 && (
                  <div style={{ backgroundColor: 'var(--brand-gold)', color: 'white', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {discount}% SAVING
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-green)', fontWeight: 700, fontSize: '0.8rem' }}>
                {isSoldOut ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                    <Leaf size={16} /> SOLD OUT
                  </span>
                ) : lowStock ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                    <CheckCircle2 size={16} /> only {stockLimit} left
                  </span>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> STUDIO SECURED IN STOCK
                  </>
                )}
              </div>
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--brand-gold)', marginBottom: '1rem' }}>Specimen Variant</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '0.85rem 1.75rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                        border: '2px solid',
                        backgroundColor: selectedVariant?.id === v.id ? 'var(--bg-deep)' : 'transparent',
                        borderColor: selectedVariant?.id === v.id ? 'var(--bg-deep)' : 'var(--border-subtle)',
                        color: selectedVariant?.id === v.id ? 'white' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >{v.name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1rem', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QUANTITY</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ background: 'none', border: 'none', color: 'var(--bg-deep)', cursor: 'pointer', padding: '0.25rem', opacity: quantity <= 1 ? 0.3 : 1 }}
                    disabled={quantity <= 1}
                  >
                    <ChevronLeft size={22} strokeWidth={3} />
                  </button>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--bg-deep)', minWidth: '1.5rem', textAlign: 'center' }}>{quantity}</span>
                  <button
                    onClick={() => {
                      if (hasStockLimit) {
                        setQuantity((q) => Math.min(Math.max(1, stockLimit), q + 1));
                      } else {
                        setQuantity((q) => q + 1);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--bg-deep)', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <ChevronRight size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <button
                  onClick={async () => {
                    const ok = await addItemToCart(id, quantity, selectedVariant?.id, product, selectedVariant);
                    trackAddToCart({ productId: id, name, price: displayPrice });
                    if (ok !== false) showToast('Specimen secured in your box.', 'success');
                  }}
                  disabled={!selectedVariant || selectedVariant.stock <= 0}
                  style={{
                    width: '100%', padding: '1.125rem', borderRadius: '14px', border: '2px solid var(--bg-deep)',
                    backgroundColor: 'transparent', color: 'var(--bg-deep)', fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(10,31,28,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {selectedVariant?.stock > 0 ? 'ADD TO BOX' : 'OUT OF STOCK'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || selectedVariant.stock <= 0}
                  style={{
                    width: '100%', padding: '1.125rem', borderRadius: '14px', border: 'none',
                    backgroundColor: 'var(--bg-deep)', color: 'white', fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(10,31,28,0.2)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  SECURE BUY NOW
                </button>
              </div>

              {/* Free-shipping live nudge */}
              {(() => {
                const sellerId = product?.seller?.id;
                if (!sellerId) return null;
                const isHeavy = selectedVariant?.item_category === 'heavy';
                const threshold = isHeavy ? HEAVY_FREE_THRESHOLD : LIGHT_FREE_THRESHOLD;
                const sellerGroup = cart?.seller_groups?.[sellerId];
                const currentSubtotal = sellerGroup ? sellerGroup.subtotal : 0;
                const remaining = threshold - currentSubtotal;
                if (remaining <= 0) {
                  return (
                    <div style={{ padding: '0.6rem 1rem', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Truck size={14} /> Free shipping from this seller unlocked!
                    </div>
                  );
                }
                if (remaining <= 200) {
                  return (
                    <div style={{ padding: '0.6rem 1rem', borderRadius: '10px', backgroundColor: '#fef9c3', color: '#854d0e', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Truck size={14} /> Add ₹{Math.ceil(remaining)} more from this seller for free shipping
                    </div>
                  );
                }
                return (
                  <div style={{ padding: '0.6rem 1rem', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={14} /> Free shipping above ₹{threshold.toLocaleString('en-IN')} from this seller
                  </div>
                );
              })()}

              {/* Mobile Buy Box (shown below secure buy now) */}
              <div className="mobile-only-block" style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '20px', backgroundColor: '#fff' }}>
                <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--text-secondary)', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ships from</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Junglyst Distribution</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Verified Seller</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-gold)' }}>{product.seller?.username || product.seller?.name || 'Aquatic Exotica'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Guarantee</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-green)' }}>Live Arrival Secured</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleWishlist({ id: product.id || product._id, name, price: displayPrice, image: (product?.imageUrl || product?.image_url || product?.image), seller: product?.seller })}
                  style={{
                    width: '100%', marginTop: '1.5rem', padding: '1rem', borderRadius: '14px', border: '1px dashed var(--brand-gold)',
                    backgroundColor: 'transparent', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', cursor: 'pointer'
                  }}
                >
                  + SAVE TO SPECIMEN WISHLIST
                </button>
              </div>

            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0, marginTop: '2rem' }} />

            {/* Quality Seals Rail */}
            <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <TrustBadges brandColor="var(--brand-gold)" column={false} showTitle={false} />
            </div>



            {/* Seller Story Bridge */}
            <div style={{ display: 'flex', gap: '1.5rem', padding: '1.75rem', borderRadius: '20px', backgroundColor: 'var(--bg-deep)', color: 'white' }}>
              <div style={{ flexShrink: 0, width: '110px', height: '110px', borderRadius: '14px', overflow: 'hidden', border: '2px solid var(--brand-gold)', backgroundColor: 'white' }}>
                <img src={product.seller?.seller_profile?.logo_url || sellerAvatar} alt="Grower" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  {product.seller?.role === 'grower' ? 'Master Grower' : 'Verified Partner'}
                </div>
                <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#fff' }}>
                  {product.seller?.full_name || product.seller?.username} • {product.seller?.seller_profile?.store_name || 'Botanical Studio'}
                </h4>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.6, opacity: 0.85 }}>
                  {product.seller?.seller_profile?.bio || `Dedicated botanical specialist from ${product.seller?.location || 'India'}, committed to the preservation and distribution of premium specimens.`}
                </p>
                {product.seller?.seller_profile?.slug && (
                  <Link to={`/store/${product.seller.seller_profile.slug}`} style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 800, marginTop: '0.5rem', textDecoration: 'none' }}>VIEW CATALOG →</Link>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Branded Bottom Flow */}
        <div style={{ marginTop: '8rem', display: 'flex', flexDirection: 'column', gap: '6rem' }}>
          <MoreFromSeller sellerId={product.seller?.id} sellerName={product.seller?.seller_profile?.store_name || product.seller?.username} currentProductId={product.id} />
          <Recommendations category={product.category?.name || product.category} currentProductId={product.id} />
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />
          <ReviewSection productId={id} />
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .product-layout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 4rem;
          align-items: start;
          max-width: 100%;
        }
        
        .col-media { order: 1; }
        .col-meta { order: 2; }

        @media (max-width: 1024px) {
          .product-layout-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 2rem;
          }
          .col-media { grid-column: 1 / 2; grid-row: 1; }
          .col-meta { grid-column: 2 / 3; grid-row: 1; }
        }

        @media (max-width: 768px) {
          .product-layout-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 2rem;
          }
          .col-media { grid-column: 1 / -1; grid-row: auto; order: 1; }
          .col-buy { grid-column: 1 / -1; grid-row: auto; order: 2; }
          .col-meta { grid-column: 1 / -1; grid-row: auto; order: 3; }
        }
      `}</style>
    </div>
  );
}
