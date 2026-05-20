import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';
import SEO from '../components/SEO';

const RELATED = [
  { to: '/contact', label: 'Contact Support' },
  { to: '/shipping-policy', label: 'Shipping Policy' },
  { to: '/refund-policy', label: 'Refunds & Returns' },
  { to: '/terms', label: 'Terms & Conditions' },
];

export default function FAQ() {
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(null);

  const faqs = {
    payment: [
      {
        id: 'pay-1',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major payment methods through Razorpay — UPI (GPay, PhonePe, BHIM), debit cards, credit cards, and net banking. All transactions are fully secured and PCI-DSS compliant.'
      },
      {
        id: 'pay-2',
        question: 'Is my payment information secure?',
        answer: 'Yes. All payments are processed by Razorpay using industry-standard encryption. Junglyst never stores your card or UPI details on its servers.'
      },
      {
        id: 'pay-3',
        question: 'Can I get a refund if my plant arrives damaged or dead?',
        answer: 'Yes. If your specimen arrives Dead on Arrival (DOA) — meaning it is completely deceased or destroyed, not just stressed from transit — raise a claim within 24 hours of delivery with an unboxing video or clear photographs as evidence. We will issue a replacement or full refund after assessment. Minor transit stress like slight wilting or yellowing does not qualify as DOA. See our Refund & Returns Policy for the complete details.'
      },
      {
        id: 'pay-4',
        question: 'Do you offer installment payment options?',
        answer: 'Currently, we only accept full payment at checkout via Razorpay. Installment or BNPL options are not available at this time.'
      }
    ],
    orders: [
      {
        id: 'ord-1',
        question: 'How can I track my order?',
        answer: 'Once your order is dispatched, you will receive an email and SMS with your AWB tracking number and a direct NimbusPost tracking link. You can also track your order in real-time from "My Orders" in your Junglyst account. If you ordered from multiple sellers, each seller\'s shipment will have its own AWB and tracking link.'
      },
      {
        id: 'ord-2',
        question: 'How long does delivery take?',
        answer: 'Sellers are required to dispatch confirmed orders within 48 hours. Estimated delivery after dispatch is 1–2 days for same-city orders, 2–4 days for most metros and adjacent states, and 4–6 days for whitelisted Zone D cities. Note: Junglyst does not ship to Zone E (remote / North-East / J&K) or non-whitelisted pincodes — you can check serviceability on any product page.'
      },
      {
        id: 'ord-3',
        question: 'What if I don\'t receive my order?',
        answer: 'If your order hasn\'t arrived within the estimated delivery window and tracking hasn\'t updated, contact us at admin@junglyst.com with your order number and AWB. We will investigate with NimbusPost and arrange a replacement or refund as appropriate.'
      },
      {
        id: 'ord-4',
        question: 'Can I cancel my order?',
        answer: 'Cancellations are possible before the Seller begins packing (i.e., while the order is in "Order Placed" or "Confirmed" status). Once the status moves to "Packing" or "Shipped", cancellation is no longer available. To cancel, go to "My Orders" in your account and use "Request Cancellation" if the option appears, or email admin@junglyst.com immediately with your order number.'
      },
      {
        id: 'ord-5',
        question: 'What is your return and DOA policy?',
        answer: 'Returns are accepted for Dead on Arrival (DOA) specimens, wrong items sent, severely damaged packaging, or significant species/size mismatch — provided you raise the claim within 24 hours (DOA/damage) or 48 hours (wrong item/mismatch) of delivery. You must submit a continuous unboxing video or clear photographs as proof. Change of mind, minor transit stress, and natural variation are not valid return reasons. See our full Refund, Returns & DOA Policy for all details.'
      }
    ]
  };

  const FAQSection = ({ title, items, expanded, setExpanded }) => (
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
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                backgroundColor: expanded === faq.id ? 'var(--bg-secondary)' : 'transparent',
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
                  transform: expanded === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                  marginLeft: '1rem',
                  color: 'var(--brand-gold)'
                }}
              />
            </button>
            {expanded === faq.id && (
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
    <>
    <SEO
      title="FAQ — Frequently Asked Questions | Junglyst"
      description="Answers to common questions about ordering, payments, shipping, and returns on Junglyst — India's rare aquatic plant marketplace."
      path="/faq"
    />
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
          <FAQSection title="💳 Payment & Refunds" items={faqs.payment} expanded={expandedPayment} setExpanded={setExpandedPayment} />
          <FAQSection title="📦 Orders & Shipping" items={faqs.orders} expanded={expandedOrders} setExpanded={setExpandedOrders} />
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
    </>
  );
}