import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Leaf, Droplets, Sun, Wind, ChevronRight, Search, Microscope } from 'lucide-react';

const guides = [
  {
    id: 1,
    title: "The Bucephalandra Compendium",
    description: "An exhaustive guide to identifying and cultivating rare Bucephalandra variants in high-tech aquariums.",
    category: "Aquatic Plants",
    difficulty: "Medium",
    time: "15 min read",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    title: "Mastering Fern Propagation",
    description: "Techniques for successful splitting and mounting of epiphytic ferns in terrariums and paludariums.",
    category: "Terrarium",
    difficulty: "Advanced",
    time: "12 min read",
    image: "https://images.unsplash.com/photo-1463123081488-789f998ac9c4?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    title: "Substrate Layering 101",
    description: "Creating the perfect foundation for root health and long-term ecosystem stability.",
    category: "Hardscape",
    difficulty: "Easy",
    time: "8 min read",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800"
  }
];

export default function CareGuides() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="container" style={{ padding: '6rem 1rem', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '3rem' }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>
              <Microscope size={16} /> Botanical Intelligence
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: 300, fontFamily: 'serif', color: '#0A3029', marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Care & Cultivation
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6 }}>
              Expert knowledge distilled for the modern collector. From water chemistry to light spectrum optimization.
            </p>
          </div>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <input 
              type="text" 
              placeholder="Search guides..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '1.25rem 1.5rem 1.25rem 3.5rem', borderRadius: '100px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#f8fafc' }}
            />
            <Search size={20} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '3rem' }}>
        {guides.map(guide => (
          <div key={guide.id} style={{ cursor: 'pointer', group: 'true' }}>
            <div style={{ 
              position: 'relative', height: '300px', borderRadius: '32px', overflow: 'hidden', marginBottom: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={guide.image} 
                alt={guide.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {guide.category}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              <span>{guide.difficulty} Level</span>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
              <span>{guide.time}</span>
            </div>
            
            <h3 style={{ fontSize: '1.75rem', fontWeight: 600, fontFamily: 'serif', color: '#0A3029', marginBottom: '1rem', lineHeight: 1.2 }}>
              {guide.title}
            </h3>
            
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
              {guide.description}
            </p>
            
            <button style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              Read Full Study <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Featured Newsletter CTA */}
      <div style={{ marginTop: '10rem', backgroundColor: '#0A3029', borderRadius: '48px', padding: '5rem', color: 'white', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Leaf size={48} color="#E5C48B" style={{ marginBottom: '2rem' }} />
          <h2 style={{ fontSize: '3rem', fontFamily: 'serif', marginBottom: '1.5rem' }}>Deeper Botanical Insights</h2>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Join 12,000+ collectors receiving our bi-weekly deep dives into rare species and high-end cultivation techniques.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="email" 
              placeholder="Your botanical correspondence..." 
              style={{ padding: '1.25rem 2rem', borderRadius: '100px', border: 'none', width: '100%', maxWidth: '350px', outline: 'none' }}
            />
            <button style={{ backgroundColor: '#E5C48B', color: '#0A3029', padding: '1.25rem 3rem', borderRadius: '100px', border: 'none', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
              Subscribe
            </button>
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
      </div>
    </div>
  );
}
