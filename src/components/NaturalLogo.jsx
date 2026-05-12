import React from 'react';

export default function NaturalLogo({ size = 42, showText = true, textColor = 'var(--bg-deep)', vertical = false }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '0.5rem',
      textAlign: vertical ? 'center' : 'left'
    }}>
      {/* Original Image Logo */}
      <div style={{ 
        width: size * 1.5, 
        height: size * 1.5, 
        flexShrink: 0, 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img 
          src="/Junglyst_icon.png" 
          alt="Junglyst Logo" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain', 
            transform: 'scale(3)' 
          }} 
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontSize: vertical ? '2.25rem' : '1.75rem', 
            fontWeight: 700, 
            fontFamily: 'var(--font-serif)', 
            color: textColor,
            lineHeight: 1
          }}>
            Junglyst
          </span>
          <span style={{ 
            fontSize: vertical ? '0.75rem' : '0.625rem', 
            letterSpacing: '0.25em', 
            color: 'var(--brand-gold)',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginTop: '0.125rem'
          }}>
            Marketplace
          </span>
        </div>
      )}
    </div>
  );
}
