import React from 'react';
import { Leaf, Star, MapPin } from 'lucide-react';
import TrustBadges from './TrustBadges';

export default function SellerOnboardingPreview({ formData }) {
  const brandColor = formData.brandColor || '#0A3029';
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'white', 
      borderRadius: '24px', 
      overflow: 'hidden',
      boxShadow: '0 40px 80px -20px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Immersive Hero Preview */}
      <section style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
        {formData.bannerUrl ? (
          <img 
            src={formData.bannerUrl} 
            alt="Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: brandColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Leaf size={80} color="rgba(255,255,255,0.1)" />
          </div>
        )}
        
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.5rem', color: 'white'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '50px', fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Rare Species Expert
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontFamily: 'serif', lineHeight: 1.1, marginBottom: '0.5rem' }}>
             {formData.storeName || 'Your Studio Name'}
          </h1>

          <p style={{ fontSize: '0.75rem', color: '#E5C48B', fontWeight: 500, marginBottom: '1.5rem' }}>
            {formData.tagline || 'Your botanical signature...'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '1.5rem', width: 'fit-content' }}>
            <div>
              <p style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase', color: '#E5C48B', marginBottom: '0.2rem' }}>Rating</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Star fill="white" color="white" size={10} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>5.0</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase', color: '#E5C48B', marginBottom: '0.2rem' }}>Orders</p>
              <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>0</span>
            </div>
            <div>
              <p style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase', color: '#E5C48B', marginBottom: '0.2rem' }}>Location</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <MapPin color="white" size={10} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{formData.location?.split(',')[0] || 'India'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Overlay */}
        <div style={{ 
          position: 'absolute', 
          top: '1.5rem', 
          right: '1.5rem', 
          width: '60px', 
          height: '60px', 
          backgroundColor: 'white', 
          borderRadius: '16px',
          padding: '4px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {formData.logoUrl ? (
            <img src={formData.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Leaf size={32} color={brandColor} />
          )}
        </div>
      </section>

      {/* Content Preview */}
      <div style={{ padding: '2rem', flexGrow: 1 }}>
        <h2 style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: brandColor, marginBottom: '0.75rem' }}>Our Botanical Mandate</h2>
        <p style={{ fontSize: '1rem', fontFamily: 'serif', color: '#1a2f1a', lineHeight: 1.4, marginBottom: '2rem' }}>
           "{formData.description || 'Specializing in the rarest specimens with meticulous care...'}"
        </p>

        <TrustBadges brandColor={brandColor} />
      </div>
      
      {/* Visual Indicator of Customization */}
      <div style={{ 
        height: '6px', 
        width: '100%', 
        backgroundColor: brandColor,
        opacity: 0.8
      }} />
    </div>
  );
}
