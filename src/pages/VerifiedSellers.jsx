import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Star, MapPin, ExternalLink, Leaf, ArrowRight, ChevronLeft, ChevronRight as ChevronRightIcon, Award, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

const PROMOTED_SELLERS = [
  {
    id: 'p1',
    store_name: "The Aquatic Collective",
    tagline: "Masters of Rare Bucephalandra & Microsorum",
    image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?auto=format&fit=crop&q=80&w=2000",
    brand_color: "#10b981",
    slug: "aquatic-collective",
    location: "Bangalore, India"
  },
  {
    id: 'p2',
    store_name: "Emerald Sanctuary",
    tagline: "Ethically Sourced Tropical Ferns & Mosses",
    image: "https://images.unsplash.com/photo-1466781783364-391e954ef2b6?auto=format&fit=crop&q=80&w=2000",
    brand_color: "#E5C48B",
    slug: "emerald-sanctuary",
    location: "Kerala, India"
  },
  {
    id: 'p3',
    store_name: "Hardscape Studio",
    tagline: "Curated Seiryu Stone & Ancient Driftwood",
    image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=2000",
    brand_color: "#64748b",
    slug: "hardscape-studio",
    location: "Pune, India"
  }
];

export default function VerifiedSellers() {
  const [sellers, setSellers] = useState([]);
  const [promotedSellers, setPromotedSellers] = useState(PROMOTED_SELLERS);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sellersRes, promotedRes] = await Promise.all([
          api.get('/sellers/profiles/'),
          api.get('/sellers/profiles/?featured=true')
        ]);
        setSellers(sellersRes.data.results || sellersRes.data || []);
        
        const featuredData = promotedRes.data.results || promotedRes.data || [];
        if (featuredData.length > 0) {
          const mappedPromoted = featuredData.map(p => ({
            id: p.id,
            store_name: p.store_name,
            tagline: p.tagline || 'Excellence in Botanical Curation',
            image: getImageUrl(p.banner_url) || 'https://images.unsplash.com/photo-1466721594955-2d185c3c59bc?auto=format&fit=crop&q=80&w=2000',
            slug: p.slug,
            brand_color: '#10b981'
          }));
          setPromotedSellers(mappedPromoted);
        }
      } catch (error) {
        console.error("Error fetching editorial data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % promotedSellers.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f8f4', fontFamily: 'Inter, sans-serif', color: '#1a1a1a' }}>
      
      {/* 1. Fashion-Style Hero Spotlight */}
      <section style={{ height: '90vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1.2fr' }}
          >
            {/* Left Content: Bold Typography */}
            <div style={{ padding: '0 10%', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
              <motion.span 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#10b981', marginBottom: '2rem' }}
              >
                Featured Sanctuary
              </motion.span>
              <motion.h1 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ fontSize: '6rem', fontFamily: 'serif', lineHeight: 0.9, marginBottom: '2rem', letterSpacing: '-0.03em' }}
              >
                {promotedSellers[activeSlide].store_name.split(' ')[0]} <br/> 
                <span style={{ fontStyle: 'italic', color: '#64748b' }}>&</span> {promotedSellers[activeSlide].store_name.split(' ').slice(1).join(' ')}
              </motion.h1>
              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '3rem', maxWidth: '400px', lineHeight: 1.6 }}
              >
                {promotedSellers[activeSlide].tagline}
              </motion.p>
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <Link 
                  to={`/store/${promotedSellers[activeSlide].slug}`}
                  style={{ 
                    backgroundColor: '#1a1a1a', color: 'white', padding: '1.5rem 4rem', 
                    display: 'inline-block', textDecoration: 'none', fontWeight: 800, 
                    textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem'
                  }}
                >
                  Explore Studio
                </Link>
              </motion.div>
            </div>

            {/* Right Image: Framed Fashion Aesthetic */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5%' }}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ 
                  width: '100%', height: '80%', borderRadius: '40px 40px 400px 40px', 
                  overflow: 'hidden', position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.1)'
                }}
              >
                <img 
                  src={promotedSellers[activeSlide].image} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt="Spotlight"
                />
                <div style={{ position: 'absolute', inset: 0, border: '20px solid rgba(255,255,255,0.1)' }} />
              </motion.div>
              
              {/* Decorative Floating Element */}
              <motion.div 
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                style={{ 
                  position: 'absolute', top: '15%', right: '10%', backgroundColor: 'white', 
                  padding: '1.5rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 20
                }}
              >
                <div style={{ width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#10b981" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Verified Purity</span>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls */}
        <div style={{ position: 'absolute', bottom: '5%', left: '10%', display: 'flex', gap: '1.5rem', alignItems: 'center', zIndex: 30 }}>
          {promotedSellers.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveSlide(idx)}
              style={{ 
                fontSize: '1rem', fontWeight: 700, border: 'none', background: 'none', 
                color: idx === activeSlide ? '#1a1a1a' : '#9ca3af', cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              0{idx + 1}
            </button>
          ))}
          <div style={{ width: '100px', height: '1px', backgroundColor: '#e5e7eb', margin: '0 1rem' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Next Trend</span>
        </div>
      </section>

      {/* 2. Global Stats: Fashion Impact */}
      <section style={{ backgroundColor: 'white', padding: '6rem 0', borderTop: '1px solid #f3f4f6' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
          <div>
            <h3 style={{ fontSize: '3rem', fontFamily: 'serif', marginBottom: '0.5rem' }}>140+</h3>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em' }}>Global Sanctuaries</p>
          </div>
          <div style={{ borderLeft: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '3rem', fontFamily: 'serif', marginBottom: '0.5rem' }}>2.4k</h3>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em' }}>Rare Species</p>
          </div>
          <div>
            <h3 style={{ fontSize: '3rem', fontFamily: 'serif', marginBottom: '0.5rem' }}>98%</h3>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em' }}>Survival Rate</p>
          </div>
        </div>
      </section>

      {/* 3. Editorial Seller Directory */}
      <section style={{ padding: '10rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
            <h2 style={{ fontSize: '4.5rem', fontFamily: 'serif', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>The Master Curators</h2>
            <div style={{ width: '60px', height: '2px', backgroundColor: '#10b981', margin: '0 auto' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8rem' }}>
            {sellers.map((seller, idx) => (
              <motion.div 
                key={seller.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ 
                  display: 'grid', gridTemplateColumns: idx % 2 === 0 ? '1fr 1.2fr' : '1.2fr 1fr', 
                  gap: '6rem', alignItems: 'center' 
                }}
              >
                {/* Visual Section */}
                <div style={{ order: idx % 2 === 0 ? 0 : 1, position: 'relative' }}>
                  <div style={{ 
                    aspectRatio: '4/5', backgroundColor: '#e5e7eb', borderRadius: '40px', 
                    overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.05)' 
                  }}>
                    <img 
                      src={getImageUrl(seller.logo_url) || `https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1000`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt={seller.store_name}
                    />
                  </div>
                  {/* Decorative Number */}
                  <span style={{ 
                    position: 'absolute', top: '-2rem', [idx % 2 === 0 ? 'left' : 'right']: '-2rem', 
                    fontSize: '12rem', fontFamily: 'serif', color: 'rgba(0,0,0,0.03)', zIndex: -1 
                  }}>
                    0{idx + 1}
                  </span>
                </div>

                {/* Text Section */}
                <div style={{ textAlign: idx % 2 === 0 ? 'left' : 'right' }}>
                  <div style={{ display: 'flex', justifyContent: idx % 2 === 0 ? 'flex-start' : 'flex-end', gap: '0.5rem', marginBottom: '2rem' }}>
                    <div style={{ color: '#E5C48B', display: 'flex' }}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    </div>
                  </div>
                  <h3 style={{ fontSize: '3.5rem', fontFamily: 'serif', marginBottom: '2rem', lineHeight: 1.1 }}>{seller.store_name}</h3>
                  <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.8, marginBottom: '3rem', maxWidth: '500px', marginLeft: idx % 2 === 0 ? 0 : 'auto' }}>
                    {seller.bio || 'Curating rare botanical specimens and high-fidelity aquascape essentials with a focus on sustainable growth.'}
                  </p>
                  <Link 
                    to={`/store/${seller.slug}`}
                    style={{ 
                      fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', 
                      letterSpacing: '0.2em', color: '#1a1a1a', textDecoration: 'none',
                      borderBottom: '2px solid #10b981', paddingBottom: '0.5rem'
                    }}
                  >
                    View Boutique <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Editorial Footer Join */}
      <section style={{ backgroundColor: '#1a1a1a', padding: '10rem 0', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <Sparkles size={48} color="#E5C48B" style={{ marginBottom: '3rem' }} />
          <h2 style={{ fontSize: '4rem', fontFamily: 'serif', marginBottom: '2rem' }}>Join the Verified Network</h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto 4rem', lineHeight: 1.6 }}>
            Partner with us to uphold the highest standards of botanical quality and showcase your cultivated collection to a community of serious enthusiasts.
          </p>
          <Link to="/seller/onboarding" style={{ padding: '1.5rem 4rem', backgroundColor: 'white', color: '#1a1a1a', textDecoration: 'none', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Apply for Verification
          </Link>
        </div>
      </section>
    </div>
  );
}
