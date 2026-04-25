import React from 'react';
import { ShieldCheck, Leaf, Heart, Recycle, Award, Sparkles } from 'lucide-react';

export default function TrustBadges({ brandColor = '#0A3029', column = true, showTitle = true }) {
  const items = [
    { title: 'Farm-Direct Dispatch', icon: <ShieldCheck size={16} /> },
    { title: 'Pathogen-Free Certification', icon: <Leaf size={16} /> },
    { title: 'Eco-Friendly Packaging', icon: <Recycle size={16} /> },
    { title: 'Species-Specific Guarantee', icon: <Award size={16} /> },
    { title: 'Sustainably Cultivated', icon: <Heart size={16} /> },
    { title: 'Expert Horticultural Support', icon: <Sparkles size={16} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: column ? 'column' : 'row', flexWrap: 'wrap', gap: '1.25rem' }}>
      {showTitle && <h3 style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: brandColor, marginBottom: '0.5rem', width: '100%' }}>Botanical Trust Standards</h3>}
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: column ? 'none' : '1 1 200px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '12px', 
            backgroundColor: '#f0f4f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: brandColor,
            flexShrink: 0
          }}>
            {item.icon}
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a2f1a', lineHeight: 1.2 }}>{item.title}</span>
        </div>
      ))}
    </div>
  );
}
