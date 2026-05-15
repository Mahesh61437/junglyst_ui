import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';

const RELATED = [
  { to: '/contact', label: 'Contact Support' },
  { to: '/shipping-policy', label: 'Shipping Policy' },
  { to: '/refund-policy', label: 'Refunds & Returns' },
  { to: '/terms', label: 'Terms & Conditions' },
];

export default function FAQ() {
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
    <div style={{ marginBottom: '3rem' }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        fontFamily: 'var(--font-serif)',
        marginBottom: '1.5rem',
        color: 'var(--text-primary)'
      }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((faq) => (
          <div key={faq.id} style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'white'
          }}>
            <button
              onClick={() => toggleFaq(faq.id)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                backgroundColor: expandedFaq === faq.id ? 'var(--bg-secondary)' : 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                fontWeight: 600,
                textAlign: 'left'
              }}
            >
              <span>{faq.question}</span>
              <ChevronDown
                size={20}
                style={{
                  transition: 'transform var(--transition-fast)',
                  transform: expandedFaq === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                  marginLeft: '1rem',
                  color: 'var(--brand-gold)'
                }}
              />
            </button>
            {expandedFaq === faq.id && (
              <div style={{
                padding: '0 1.5rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.9rem',
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
    <PolicyLayout
      badge="Support"
      title="Frequently Asked Questions"
      updated="May 13, 2026"
      summary="Find answers to common questions about payments, orders, and shipping on Junglyst."
      relatedLinks={RELATED}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '4rem'
        }}>
          <FAQSection title="💳 Payment & Refunds" items={faqs.payment} />
          <FAQSection title="📦 Orders & Shipping" items={faqs.orders} />
        </div>

        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            Still have questions?
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
            fontSize: '0.95rem'
          }}>
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="/contact"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--brand-gold)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'var(--brand-gold-hover)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--brand-gold)'}
          >
            Contact Support
          </a>
        </div>
      </div>
    </PolicyLayout>
  );
}