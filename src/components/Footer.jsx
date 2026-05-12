import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import NaturalLogo from './NaturalLogo';

export default function Footer() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = {
    payment: [
      {
        id: 'pay-1',
        question: 'What payment methods do you accept?',
        answer: 'We accept UPI payments through Razorpay and Cashfree. Your transactions are fully secured and PCI-DSS compliant.'
      },
      {
        id: 'pay-2',
        question: 'Is my payment information secure?',
        answer: 'Yes, all payments are encrypted and handled by industry-leading payment gateways (Razorpay & Cashfree). We never store your card details.'
      },
      {
        id: 'pay-3',
        question: 'Can I get a refund if my plant arrives damaged?',
        answer: 'Absolutely. We offer a 100% refund or replacement if your specimen arrives damaged or doesn\'t meet our quality standards.  '
      },
      {
        id: 'pay-4',
        question: 'Do you offer installment payment options?',
        answer: 'Currently, we only accept full payment at checkout. Contact us to inquire about future installment options.'
      }
    ],
    orders: [
      {
        id: 'ord-1',
        question: 'How can I track my order?',
        answer: 'You can track your order in real-time from your account dashboard. Logged-in users can access their order tracking page. Guest users can track using their Order ID.'
      },
      {
        id: 'ord-2',
        question: 'How long does delivery take?',
        answer: 'Most orders ship within 48 hours of confirmation. Delivery typically takes 3-7 days depending on your location and current shipping volume.'
      },
      {
        id: 'ord-3',
        question: 'What if I don\'t receive my order?',
        answer: 'If your order doesn\'t arrive within the estimated delivery window, please contact our support team immediately. We\'ll investigate and send a replacement or issue a refund.'
      },
      {
        id: 'ord-4',
        question: 'Can I cancel or modify my order?',
        answer: 'No, order cannot be cancelled or modified once it\'s placed. Please review your order carefully before confirming. If you have any issues, contact our support team for assistance.'
      },
      {
        id: 'ord-5',
        question: 'What is your return policy?',
        answer: 'We accept returns within 7 days of delivery if the specimen is damaged or doesn\'t match the description. The item must be in original packaging and in resellable condition. User should have the uncut unboxing video as proof. Contact our support team within 24 hours of delivery to initiate the process.'
      }
    ]
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const FAQSection = ({ title, items }) => (
    <div style={{ marginBottom: '2.5rem' }}>
      <h4 style={{ 
        fontSize: '0.75rem', 
        fontWeight: 800, 
        textTransform: 'uppercase', 
        letterSpacing: '0.15em', 
        marginBottom: '1.5rem', 
        color: 'var(--brand-gold)' 
      }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((faq) => (
          <div key={faq.id} style={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleFaq(faq.id)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: expandedFaq === faq.id ? 'rgba(163,196,168,0.1)' : 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textAlign: 'left'
              }}
            >
              <span>{faq.question}</span>
              <ChevronDown 
                size={18} 
                style={{ 
                  transition: 'transform 0.3s',
                  transform: expandedFaq === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                  marginLeft: '0.75rem',
                  color: 'var(--brand-gold)'
                }} 
              />
            </button>
            {expandedFaq === faq.id && (
              <div style={{
                padding: '0.75rem 1rem 1rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(163,196,168,0.05)',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)'
              }}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <footer style={{
      backgroundColor: 'var(--bg-secondary)',
      padding: '6rem 0 3rem',
      borderTop: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '5rem'
        }}>
          {/* Brand Identity */}
          <div style={{ maxWidth: '300px', gridColumn: 'span 1' }}>
            <NaturalLogo size={42} />
            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              fontStyle: 'italic'
            }}>
              Junglyst is a curated marketplace connecting discerning collectors with verified growers of rare botanical specimens. Each plant is a piece of living art.
            </p>
          </div>

          {/* The Collection */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>The Collection</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FooterLink to="/shop">All Specimens</FooterLink>
              <FooterLink to="/sellers">Verified Sellers</FooterLink>
              <FooterLink to="/guides">Care Guides</FooterLink>
              <FooterLink to="/about">About Junglyst</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>Marketplace</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FooterLink to="/seller/dashboard">Seller Login</FooterLink>
              <FooterLink to="/seller-policy">Seller Policy</FooterLink>
              <FooterLink to="/shipping-policy">Shipping Info</FooterLink>
              <FooterLink to="/refund-policy">Refunds & Returns</FooterLink>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--brand-gold)' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FooterLink to="/terms">Terms & Conditions</FooterLink>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/shipping-policy">Shipping Policy</FooterLink>
              <FooterLink to="/refund-policy">DOA Policy</FooterLink>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '3rem',
          paddingBottom: '3rem',
          marginBottom: '3rem'
        }}>
          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            fontFamily: 'var(--font-serif)',
            marginBottom: '2.5rem',
            color: 'white'
          }}>
            Frequently Asked Questions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem'
          }}>
            <FAQSection title="💳 Payment" items={faqs.payment} />
            <FAQSection title="📦 Orders & Shipping" items={faqs.orders} />
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          opacity: 0.6,
        }}>
          <p>&copy; 2026 Junglyst Botanical Private Limited. Bengaluru, India.</p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <FooterLink to="/terms">Terms</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/shipping-policy">Shipping</FooterLink>
            <FooterLink to="/refund-policy">Refunds</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {children}
    </Link>
  );
}
