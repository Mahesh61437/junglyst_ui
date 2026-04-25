import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

const slides = [
  {
    type: 'spotlight',
    title: 'Aquatic Exotica',
    subtitle: 'Verified Sanctuary',
    highlight: 'KERALA, INDIA',
    description: 'Mastering the art of rare Bucephalandra and moss cultivation for over two decades. Discover farm-direct specimens of unparalleled vitality.',
    cta: 'Visit Sanctuary',
    link: '/shop',
    image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1600&q=80',
    color: 'var(--brand-gold)'
  },
  {
    type: 'specimen',
    title: 'Bucephalandra Ghost',
    subtitle: 'Masterpiece Specimen',
    highlight: 'RARE ARRIVAL',
    description: 'The elusive Ghost variant, known for its iridescent purple and deep blue hues. A crowning jewel for any high-end aquascape.',
    cta: 'View Specimen',
    link: '/shop',
    image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=1600&q=80',
    color: '#e9d5ff'
  },
  {
    type: 'specimen',
    title: 'Bucephalandra Godzilla',
    subtitle: 'Rare Masterpiece',
    highlight: 'LIMITED ARRIVAL',
    description: 'A prehistoric-looking beauty with extremely ruffled edges and a deep bluish iridescence. The ultimate focal point for professional aquascapes.',
    cta: 'View Specimen',
    link: '/shop',
    image: 'https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Ghodzilla%2Fgodzilla001.jpg?alt=media&token=a1a518a9-0bd4-4fe9-b895-844584a5efef',
    color: '#86efac'
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [current]);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
      setIsTransitioning(false);
    }, 600);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      setIsTransitioning(false);
    }, 600);
  };

  const currentSlide = slides[current];

  return (
    <section style={{ 
      height: window.innerWidth > 768 ? '85vh' : '70vh', 
      position: 'relative', 
      backgroundColor: 'var(--bg-deep)', 
      overflow: 'hidden',
    }}>
      {/* Background Image Layer */}
      {slides.map((slide, idx) => (
        <div 
          key={idx}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: current === idx ? 0.6 : 0,
            transition: 'opacity 1.2s ease-in-out, transform 10s linear',
            transform: current === idx ? 'scale(1.1)' : 'scale(1)',
            zIndex: 1
          }}
        />
      ))}

      {/* Glassmorphic Overlay Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: window.innerWidth > 768 
          ? 'linear-gradient(to right, rgba(10,31,28,0.9) 0%, rgba(10,31,28,0.4) 50%, transparent 100%)'
          : 'linear-gradient(to top, rgba(10,31,28,0.9) 0%, rgba(10,31,28,0.5) 60%, transparent 100%)',
        zIndex: 2
      }} />

      {/* Content Layer */}
      <div className="container" style={{ 
        position: 'relative', 
        zIndex: 10, 
        height: '100%', 
        display: 'flex', 
        alignItems: window.innerWidth > 768 ? 'center' : 'flex-end',
        paddingBottom: window.innerWidth > 768 ? '0' : '6rem'
      }}>
        <div style={{ 
          maxWidth: '700px',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
          transition: 'all 0.6s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ 
              color: currentSlide.color, 
              fontWeight: 800, 
              fontSize: '0.75rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.25em',
            }}>
              {currentSlide.highlight}
            </span>
            <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {currentSlide.type === 'spotlight' && <ShieldCheck size={14} color="var(--brand-gold)" />}
              {currentSlide.subtitle}
            </span>
          </div>

          <h1 style={{ 
            fontSize: window.innerWidth > 768 ? '5rem' : '3rem', 
            fontFamily: 'var(--font-serif)', 
            lineHeight: 1.1, 
            color: 'white',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            {currentSlide.title}
          </h1>

          <p style={{ 
            fontSize: window.innerWidth > 768 ? '1.25rem' : '1rem', 
            color: 'rgba(255,255,255,0.8)', 
            lineHeight: 1.6, 
            marginBottom: '3rem',
            maxWidth: '550px'
          }}>
            {currentSlide.description}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to={currentSlide.link} className="btn btn-primary" style={{ padding: '1.125rem 3rem', backgroundColor: 'white', color: 'var(--bg-deep)' }}>
              {currentSlide.cta}
            </Link>
            <Link to="/shop" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              color: 'white', 
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Explore Collection <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{ 
        position: 'absolute', 
        bottom: '3rem', 
        right: '5%', 
        zIndex: 20,
        display: window.innerWidth > 768 ? 'flex' : 'none',
        alignItems: 'center',
        gap: '2.5rem'
      }}>
        <div style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>0{current + 1}</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ opacity: 0.5 }}>0{slides.length}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handlePrev}
            style={{ 
              width: '56px', height: '56px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={handleNext}
            style={{ 
              width: '56px', height: '56px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '4px',
        backgroundColor: 'var(--brand-gold)',
        width: `${((current + 1) / slides.length) * 100}%`,
        transition: 'width 0.8s ease-out',
        zIndex: 30
      }} />
    </section>
  );
}

