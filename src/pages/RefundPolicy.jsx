import PolicyLayout, { Section, Notice, Divider } from '../components/PolicyLayout';
import SEO from '../components/SEO';

const RELATED = [
  { to: '/shipping-policy', label: 'Shipping Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/contact', label: 'Contact Us' },
];

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
  marginTop: '1rem',
};
const thStyle = {
  background: 'var(--bg-deep)',
  color: 'white',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const tdStyle = {
  padding: '0.75rem 1rem',
  borderBottom: '1px solid #f1f5f9',
  color: '#334155',
  verticalAlign: 'top',
};
const tdAltStyle = { ...tdStyle, background: '#f8fafc' };

export default function RefundPolicy() {
  return (
    <>
    <SEO
      title="Refund, Returns & DOA Policy | Junglyst"
      description="Junglyst's refund and return policy for live plants — DOA claims, photo evidence requirements, timelines, and how to raise a return request."
      path="/refund-policy"
    />
    <PolicyLayout
      badge="Returns & Refunds"
      title="Refund, Returns & DOA Policy"
      updated="May 20, 2026"
      summary="Our complete policy covering refunds, returns, Dead on Arrival (DOA) claims, and how to raise a dispute. We want every order to be perfect."
      relatedLinks={RELATED}
    >
      <Notice type="info">
        Because Junglyst sells live biological specimens, our returns policy is necessarily different from standard e-commerce. Please read this policy carefully before purchasing.
      </Notice>

      <Divider />

      <Section n="1" title="Our Commitment">
        <p>Junglyst and our verified Sellers are committed to ensuring that every specimen reaches you in the best possible condition. We take responsibility for quality at dispatch. Where an issue arises due to our packaging, logistics, or Seller error, we will make it right with a replacement or refund.</p>
        <p style={{ marginTop: '1rem' }}>To support fair dispute resolution, all Sellers are required to upload packaging photographs (1–3 images) before every dispatch. These photos are stored permanently against your order and are used to verify the condition of the specimen at the point of handover to the courier.</p>
      </Section>

      <Section n="2" title="What Can Be Returned">
        <p>Due to the perishable and living nature of botanical specimens, returns are accepted only in the following cases:</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Eligible?</th>
              <th style={thStyle}>Claim Window</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>Dead on Arrival (DOA)</td><td style={tdStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdStyle}>Within 24 hours of delivery</td></tr>
            <tr><td style={tdAltStyle}>Wrong item sent</td><td style={tdAltStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdAltStyle}>Within 48 hours of delivery</td></tr>
            <tr><td style={tdStyle}>Severely damaged packaging (unusable plant)</td><td style={tdStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdStyle}>Within 24 hours of delivery</td></tr>
            <tr><td style={tdAltStyle}>Significant mismatch from listing (size, species)</td><td style={tdAltStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdAltStyle}>Within 48 hours of delivery</td></tr>
            <tr><td style={tdStyle}>Change of mind</td><td style={tdStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdStyle}>—</td></tr>
            <tr><td style={tdAltStyle}>Minor transit stress (slight wilt, yellowing)</td><td style={tdAltStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdAltStyle}>—</td></tr>
            <tr><td style={tdStyle}>Natural variation (leaf count, colouration, size)</td><td style={tdStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdStyle}>—</td></tr>
            <tr><td style={tdAltStyle}>Decline due to buyer's environment / care</td><td style={tdAltStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdAltStyle}>—</td></tr>
          </tbody>
        </table>
        <Notice type="warning">
          All claims must be raised within the specified window from the delivery timestamp recorded by the courier. Claims raised after the window has passed will not be accepted under any circumstances.
        </Notice>
      </Section>

      <Section n="3" title="Dead on Arrival (DOA) Policy">
        <p>A "Dead on Arrival" (DOA) condition means the specimen is clearly deceased or beyond recovery at the time of delivery — not merely stressed from transit. When a DOA complaint is raised and accepted by our team, the order status in your account will update to <strong>"DOA Complaint Raised"</strong> while the assessment is in progress.</p>

        <p style={{ fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>What qualifies as DOA:</p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Complete decomposition of all plant tissue (melting / black rot across the entire specimen).</li>
          <li>Fully desiccated specimen with no viable tissue remaining.</li>
          <li>Confirmed active pest infestation on the specimen at time of delivery.</li>
          <li>Crushed or completely destroyed specimen due to packaging failure or courier mishandling during transit.</li>
        </ul>

        <p style={{ fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>What does NOT qualify as DOA:</p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Minor yellowing, slight wilting, or leaf tip browning — common transit stress that resolves within a few days of acclimatisation.</li>
          <li>Partial melt of non-critical outer leaves while the crown / growing tip is intact.</li>
          <li>Loss of emersed leaves, which is normal and expected when aquatic plants transition to submerged growth.</li>
          <li>Specimens that decline after delivery due to unsuitable water parameters, lighting, or buyer care.</li>
        </ul>

        <Notice type="info">
          When in doubt, submit your photos and our team will assess. We cross-reference buyer-provided evidence with the Seller's pre-dispatch packaging photographs. We err on the side of the buyer in genuine ambiguous cases.
        </Notice>
      </Section>

      <Section n="4" title="How to Raise a Claim">
        <p>To raise a refund or return claim, follow these steps:</p>
        <ol style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li>
            <strong>Document immediately upon delivery:</strong> Film a continuous, uncut unboxing video or take clear photographs showing the sealed outer packaging, the specimen's condition inside, and any visible damage. This evidence is mandatory — claims without documentation will not be processed.
          </li>
          <li>
            <strong>Submit your claim within the window:</strong> Use the <strong>"Raise a Dispute"</strong> button in My Orders on your Junglyst account, or email <strong>admin@junglyst.com</strong> with subject <em>"Claim – [Your Order Number]"</em>. Attach all photos or video.
          </li>
          <li>
            <strong>Assessment (within 48 business hours):</strong> Our team will review your evidence alongside the Seller's pre-dispatch packaging photographs. We may contact the Seller for additional information. The order status will update to <em>"DOA Complaint Raised"</em> during this period.
          </li>
          <li>
            <strong>Resolution:</strong> You will receive the decision — replacement, refund, or rejection with reason — by email. Approved replacements will be coordinated with the Seller. Approved refunds are processed within 5–7 business days to your original payment method.
          </li>
        </ol>
        <Notice type="danger">
          Do not return or discard the specimen without prior written approval from our team. Unapproved returns will not be accepted and no refund will be issued.
        </Notice>
      </Section>

      <Section n="5" title="Refund Process">
        <p>Approved refunds are credited back to the original payment method. Processing timelines are:</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Payment Method</th>
              <th style={thStyle}>Refund Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>UPI (BHIM, GPay, PhonePe, etc.)</td><td style={tdStyle}>1–3 business days</td></tr>
            <tr><td style={tdAltStyle}>Debit card / Net banking</td><td style={tdAltStyle}>3–5 business days</td></tr>
            <tr><td style={tdStyle}>Credit card</td><td style={tdStyle}>5–7 business days (subject to bank cycle)</td></tr>
            <tr><td style={tdAltStyle}>Wallet / BNPL</td><td style={tdAltStyle}>3–5 business days</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '1rem' }}>Shipping charges are refunded only if the issue was caused by Junglyst or the Seller. Shipping charges are not refunded for buyer-at-fault situations (e.g., incorrect address) or on partial order refunds unless all items are returned.</p>
      </Section>

      <Section n="6" title="Order Cancellations">
        <p>Orders may be cancelled by the buyer before the Seller confirms and begins packing. Once the order status moves to <strong>"Packing"</strong> or <strong>"Shipped"</strong>, cancellation is not possible as the specimen may already be in transit.</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Log in to your account, go to <strong>"My Orders"</strong>, and select <strong>"Request Cancellation"</strong> if the option is still available for your order.</li>
          <li>Or email <strong>admin@junglyst.com</strong> immediately with your order number and sub-order ID.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>If the Seller has already prepared or confirmed the specimen for dispatch, cancellation may be declined at the Seller's discretion. Approved cancellation refunds are processed within 5–7 business days to the original payment method.</p>
      </Section>

      <Section n="7" title="Seller-Cancelled Orders">
        <p>If a Seller is unable to fulfil your order (out of stock, quality failure), the order will be cancelled and a full refund including shipping will be issued automatically within 3–5 business days. You will be notified by email.</p>
      </Section>

      <Section n="8" title="Disputes">
        <p>If you are unsatisfied with the resolution provided by our team, you may escalate your complaint to our Grievance Officer at <strong>legal@junglyst.com</strong>. We aim to resolve all escalated disputes within 15 business days. You also retain the right to approach the Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.</p>
      </Section>
    </PolicyLayout>
    </>
  );
}
