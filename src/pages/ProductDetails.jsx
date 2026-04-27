import { useState, useEffect, useMemo } from 'react';
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
import ReviewSection from '../components/ReviewSection';
import Recommendations from '../components/Recommendations';
import TrustBadges from '../components/TrustBadges';
import { getImageUrl } from '../utils/imageUtils';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('Standard');
  const [isMobile, setIsMobile] = useState(false);
  const { addToCart, addItemToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

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
    await addItemToCart(id, safeQty, selectedVariant?.id);
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

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr 280px',
          gap: isMobile ? '2rem' : '3rem',
          alignItems: 'start',
          maxWidth: '100%'
        }}>
          
          {/* Column 1: Media Gallery */}
          <div style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? undefined : '100px', maxWidth: '100%', overflow: 'hidden' }}>
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
                  <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingTop: '1rem' }}>
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
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '1.5rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: '600px'
                }}>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onMouseEnter={() => setActiveImageIdx(idx)}
                      onFocus={() => setActiveImageIdx(idx)}
                      style={{
                        width: '100%', height: '80px', border: activeImageIdx === idx ? '2.5px solid var(--brand-gold)' : '1px solid var(--border-subtle)',
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
                <div style={{ flexGrow: 1, position: 'relative', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fcfcfc', boxShadow: 'var(--shadow-sm)' }}>
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
              </div>
            )}
          </div>

          {/* Column 2: Branded Meta Information & Botanical Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <Link to={`/store/${encodeURIComponent(product.seller?.username || product.seller?.name || 'Aquatic Exotica')}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={14} /> Certified Botanical Studio
                </Link>
                <span style={{ color: 'var(--border-subtle)' }}>•</span>
                <span style={{ color: 'var(--brand-green)' }}>Verified Seller</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '1rem', flex: 1 }}>
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
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} fill={i <= (product.rating || 5) ? "currentColor" : "none"} />)}
                  <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginLeft: '0.5rem' }}>{product.rating || '4.8'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  1,240 Verified Acquisitions
                </div>
              </div>
            </header>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'baseline', gap: '1.25rem' }}>
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

            {/* Botanical Tabs Module */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
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
                    <div dangerouslySetInnerHTML={{ __html: product.description || "A pristine specimen selected for its exceptional vigor and spectral vibrancy." }} />
                    {!product.description && <p>Each {name} has been meticulously inspected by our studio team, ensuring that leaf health, root distribution, and metabolic activity are at their peak before being cleared for acquisition.</p>}
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

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

            {/* Quality Seals Rail */}
            <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
               <TrustBadges brandColor="var(--brand-gold)" column={false} showTitle={false} />
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
                <Link to={`/store/${product.seller?.seller_profile?.slug || encodeURIComponent(product.seller?.username || 'Aquatic Exotica')}`} style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 800, marginTop: '0.5rem', textDecoration: 'none' }}>VIEW CATALOG →</Link>
              </div>
            </div>
          </div>

          {/* Column 3: Branded Buy Box */}
          <aside style={{ 
            position: window.innerWidth > 1024 ? 'sticky' : 'relative', top: '100px', 
            padding: '2rem', border: '1px solid var(--border-subtle)', borderRadius: '24px', backgroundColor: '#fff',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--bg-deep)', marginBottom: '0.5rem' }}>₹{displayPrice}</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-green)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '2rem' }}>
              {isSoldOut ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                  <Leaf size={16} /> SOLD OUT
                </span>
              ) : lowStock ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                  <CheckCircle2 size={16} /> {stockLimit} ONLY LEFT
                </span>
              ) : (
                <>
                  <CheckCircle2 size={16} /> STUDIO SECURED IN STOCK
                </>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1rem', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QUANTITY</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ background: 'none', border: 'none', color: 'var(--bg-deep)', cursor: 'pointer', padding: '0.25rem' }}
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
                    const safeQty = hasStockLimit ? Math.max(1, Math.min(quantity, Math.max(0, stockLimit))) : quantity;
                    if (hasStockLimit && safeQty < 1) return;
                    await addItemToCart(id, safeQty, selectedVariant?.id);
                    alert("Specimen secured in Box.");
                  }}
                  style={{ 
                    width: '100%', padding: '1.125rem', borderRadius: '14px', border: '2px solid var(--bg-deep)',
                    backgroundColor: 'transparent', color: 'var(--bg-deep)', fontWeight: 800, cursor: isSoldOut ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  disabled={isSoldOut}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(10,31,28,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ADD TO BOX
                </button>
                <button 
                  onClick={handleBuyNow}
                  style={{ 
                    width: '100%', padding: '1.125rem', borderRadius: '14px', border: 'none',
                    backgroundColor: 'var(--bg-deep)', color: 'white', fontWeight: 800, cursor: isSoldOut ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(10,31,28,0.2)'
                  }}
                  disabled={isSoldOut}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  SECURE BUY NOW
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--text-secondary)', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ships from</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Junglyst Distribution</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Certified Seller</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-gold)' }}>{product.seller?.username || product.seller?.name || 'Aquatic Exotica'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Guarantee</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-green)' }}>Live Arrival Secured</span>
              </div>
            </div>

            {/* Botanical Mandate Trust Markers */}
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '14px', border: '1px solid #f0f0f0' }}>
               <h4 style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--brand-green)', marginBottom: '0.5rem' }}>Botanical Mandate</h4>
               {[
                 { title: 'Farm-Direct Dispatch', icon: <ShieldCheck size={14} color="var(--brand-green)" /> },
                 { title: 'Pathogen-Free Certification', icon: <ShieldCheck size={14} color="var(--brand-green)" /> },
                 { title: 'Eco-Friendly Packaging', icon: <ShieldCheck size={14} color="var(--brand-green)" /> },
                 { title: 'Expert Horticultural Support', icon: <ShieldCheck size={14} color="var(--brand-green)" /> }
               ].map((item, i) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {item.icon}
                   </div>
                   <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</span>
                 </div>
               ))}
            </div>

            <button style={{ 
              width: '100%', marginTop: '2.5rem', padding: '1rem', borderRadius: '14px', border: '1px dashed var(--brand-gold)',
              backgroundColor: 'transparent', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', cursor: 'pointer'
            }}>
              + SAVE TO SPECIMEN WISHLIST
            </button>
          </aside>
        </div>

        {/* Branded Bottom Flow */}
        <div style={{ marginTop: '8rem', display: 'flex', flexDirection: 'column', gap: '6rem' }}>
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
      `}</style>
    </div>
  );
}
