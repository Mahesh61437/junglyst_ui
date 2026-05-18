import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import SEO from '../components/SEO';

const TOPICS = [
  'Order Issue',
  'Refund / Return',
  'Shipping Query',
  'Product Question',
  'Seller Inquiry',
  'Partnership',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // Replace with actual API endpoint if backend contact endpoint exists
      await new Promise(res => setTimeout(res, 1200));
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', topic: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      <SEO
        title="Contact Us | Junglyst"
        description="Get in touch with the Junglyst team for order support, shipping queries, seller inquiries, or partnership opportunities."
        path="/contact"
      />

      {/* Hero */}
      <section style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '7rem 0 5rem' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <span style={{ color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Get In Touch</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontFamily: 'var(--font-serif)', marginTop: '1rem', marginBottom: '1.5rem', lineHeight: 1.15 }}>Contact Us</h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.75, lineHeight: 1.7, maxWidth: '580px' }}>
            Questions about an order, a specimen, or selling on Junglyst? Our team is here to help. Reach out through any channel below or fill in the form.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: '1100px', padding: '5rem 1.5rem 8rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '5rem', alignItems: 'start' }}>

          {/* Contact Details */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--bg-deep)', marginBottom: '2rem' }}>Contact Details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <ContactItem icon={<Mail size={20} />} label="General & Orders" value="admin@junglyst.com" href="mailto:admin@junglyst.com" />
              <ContactItem icon={<Mail size={20} />} label="Seller Inquiries" value="sellers@junglyst.com" href="mailto:sellers@junglyst.com" />
              <ContactItem icon={<Mail size={20} />} label="Legal & Privacy" value="legal@junglyst.com" href="mailto:legal@junglyst.com" />
              <ContactItem icon={<Phone size={20} />} label="WhatsApp Support" value="+91 80747 51370" href="https://wa.me/918074751370" />
              <ContactItem icon={<MapPin size={20} />} label="Registered Office" value="Bengaluru, Karnataka, India" />
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Clock size={18} style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.5rem' }}>Support Hours</p>
                  <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>We respond to emails within 1 business day.</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', background: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <MessageSquare size={18} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#14532d' }}>Order-Related Queries</p>
                  <p style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.3rem', lineHeight: 1.6 }}>For faster resolution, please have your order number ready when contacting us.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--bg-deep)', marginBottom: '2rem' }}>Send a Message</h2>

            {status === 'sent' ? (
              <div style={{ padding: '2.5rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Send size={22} style={{ color: '#16a34a' }} />
                </div>
                <h3 style={{ color: '#14532d', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>Message Sent!</h3>
                <p style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.6 }}>Thank you for reaching out. Our team will get back to you within 1 business day.</p>
                <button onClick={() => setStatus('idle')} style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #16a34a', background: 'transparent', color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: '0.825rem' }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                  <Field label="Your Name *" name="name" type="text" value={form.name} onChange={handleChange} required placeholder="Ravi Kumar" />
                  <Field label="Email Address *" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="ravi@example.com" />
                </div>
                <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98000 00000" />
                <div>
                  <label style={labelStyle}>Topic</label>
                  <select name="topic" value={form.topic} onChange={handleChange} style={inputStyle}>
                    <option value="">Select a topic…</option>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    placeholder="Please describe your query in detail. Include your order number if applicable."
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                  />
                </div>

                {status === 'error' && (
                  <p style={{ fontSize: '0.8rem', color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    Something went wrong. Please try again or email us directly at admin@junglyst.com.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    padding: '0.875rem 2rem',
                    background: status === 'sending' ? '#94a3b8' : 'var(--bg-deep)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                    letterSpacing: '0.02em',
                  }}
                >
                  <Send size={16} />
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#64748b',
  marginBottom: '0.5rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.9rem',
  color: 'var(--text-primary)',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
  transition: 'border-color 0.15s',
};

function Field({ label, name, type, value, onChange, required, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = 'var(--brand-gold)')}
        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
      />
    </div>
  );
}

function ContactItem({ icon, label, value, href }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.3rem' }}>{label}</p>
        {href ? (
          <a href={href} style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--bg-deep)', textDecoration: 'none' }}>{value}</a>
        ) : (
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--bg-deep)' }}>{value}</p>
        )}
      </div>
    </div>
  );
}
