import React from 'react';

export default function NaturalLogo({ size = 40, showText = true, textColor = 'var(--bg-deep)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Monstera Leaf Organic Shape */}
        <path 
          d="M50 95C50 95 85 85 92 50C95 30 85 10 50 5C15 10 5 30 8 50C15 85 50 95 50 95Z" 
          fill="var(--bg-deep)" 
        />
        
        {/* Negative Space J Cutout */}
        <path 
          d="M55 25V60C55 70 50 75 42 75C34 75 30 70 30 65V60" 
          stroke="white" 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        
        {/* Abstract Leaf Veins / Decorative Cuts */}
        <path d="M72 40L85 30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M78 55L90 55" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M68 70L80 75" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        
        <path d="M28 40L15 30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M22 55L10 55" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M32 70L20 75" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

        {/* Brand Accent (Gold Stem) */}
        <circle cx="50" cy="92" r="3" fill="var(--brand-gold)" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ 
            fontSize: '1.75rem', 
            fontWeight: 700, 
            fontFamily: 'var(--font-serif)', 
            color: textColor,
            lineHeight: 1
          }}>
            Junglyst
          </span>
          <span style={{ 
            fontSize: '0.625rem', 
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
