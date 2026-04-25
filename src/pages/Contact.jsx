import { Mail, Phone, MapPin, Camera, Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* Hero */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '8rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Concierge Services</span>
          <h1 style={{ fontSize: '4rem', marginTop: '1.5rem' }}>Bespoke Inquiry</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '1.5rem auto 0', fontSize: '1.125rem' }}>
            Whether you are a master collector or a new enthusiast, our concierge is here to assist with your botanical journey.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '8rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8rem' }}>
          {/* Contact Details */}
          <div className="slide-up">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Get in Touch</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                 <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                   <Mail size={24} />
                 </div>
                 <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>General Inquiry</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>concierge@junglyst.com</p>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                 <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                   <Phone size={24} />
                 </div>
                 <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Studio Line</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>+91 (0) 484 290 4000</p>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                 <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                   <MapPin size={24} />
                 </div>
                 <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Headquarters</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>12/4 Botanical Arcade,<br />Western Ghats, India</p>
                 </div>
              </div>
            </div>

            <div style={{ marginTop: '5rem', display: 'flex', gap: '1.5rem' }}>
              <a href="#" style={{ color: 'var(--bg-deep)' }}><Camera size={24} /></a>
              <a href="#" style={{ color: 'var(--bg-deep)' }}><Send size={24} /></a>
              <a href="#" style={{ color: 'var(--bg-deep)' }}><MessageSquare size={24} /></a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="slide-up" style={{ animationDelay: '0.2s', backgroundColor: 'white', padding: '4rem', borderRadius: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)' }}>
             <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Full Name</label>
                    <input type="text" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none' }} placeholder="John Doe" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input type="email" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none' }} placeholder="collector@example.com" />
                  </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Inquiry Subject</label>
                    <select style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', backgroundColor: 'white' }}>
                      <option>Product Inquiry</option>
                      <option>Become a Verified Grower</option>
                      <option>Shipping & Logistics</option>
                      <option>Bespoke Sourcing</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Your Message</label>
                    <textarea rows="6" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', resize: 'none' }} placeholder="How can we assist you today?"></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '1.25rem', width: '100%' }}>Send Message</button>
             </form>
          </div>
        </div>
      </section>

      {/* FAQ / Quick Links */}
      <section style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '8rem 0' }}>
        <div className="container">
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem' }}>
              <div>
                 <h4 style={{ color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Order Status</h4>
                 <p style={{ opacity: 0.8, lineHeight: 1.6 }}>Track your recent specimen delivery directly from your profile dashboard.</p>
              </div>
              <div>
                 <h4 style={{ color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Shipping Times</h4>
                 <p style={{ opacity: 0.8, lineHeight: 1.6 }}>Domestic express shipping typically takes 2-4 business days with live arrival guarantee.</p>
              </div>
              <div>
                 <h4 style={{ color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Grower Portal</h4>
                 <p style={{ opacity: 0.8, lineHeight: 1.6 }}>Interested in selling? Visit our onboarding sanctuary to start your application.</p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
