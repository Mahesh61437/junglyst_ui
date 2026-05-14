import PolicyLayout, { Section, Notice, Divider } from '../components/PolicyLayout';

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
    <PolicyLayout
      badge="Returns & Refunds"
      title="Refund, Returns & DOA Policy"
      updated="May 7, 2026"
      summary="Our complete policy covering refunds, returns, Dead on Arrival (DOA) claims, and how to raise a dispute. We want every order to be perfect."
      relatedLinks={RELATED}
    >
      <Notice type="info">
        Because Junglyst sells live biological specimens, our returns policy is necessarily different from standard e-commerce. Please read this policy carefully before purchasing.
      </Notice>

      <Divider />

      <Section n="1" title="Our Commitment">
        <p>Junglyst and our verified Sellers are committed to ensuring that every specimen reaches you in the best possible condition. We take responsibility for quality at dispatch. Where an issue arises due to our packaging, logistics, or Seller error, we will make it right with a replacement or refund.</p>
      </Section>

      <Section n="2" title="What Can Be Returned">
        <p>Due to the perishable and living nature of botanical specimens, returns are accepted only in the following cases:</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Eligible?</th>
              <th style={thStyle}>Window</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>Dead on Arrival (DOA)</td><td style={tdStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdStyle}>24 hours from delivery</td></tr>
            <tr><td style={tdAltStyle}>Wrong item sent</td><td style={tdAltStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdAltStyle}>48 hours from delivery</td></tr>
            <tr><td style={tdStyle}>Severely damaged packaging (unusable plant)</td><td style={tdStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdStyle}>24 hours from delivery</td></tr>
            <tr><td style={tdAltStyle}>Significant mismatch from listing (size, species)</td><td style={tdAltStyle}><strong style={{ color: '#16a34a' }}>Yes</strong></td><td style={tdAltStyle}>48 hours from delivery</td></tr>
            <tr><td style={tdStyle}>Change of mind</td><td style={tdStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdStyle}>—</td></tr>
            <tr><td style={tdAltStyle}>Minor transit stress (slight wilt, yellowing)</td><td style={tdAltStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdAltStyle}>—</td></tr>
            <tr><td style={tdStyle}>Natural variation (leaf count, colouration)</td><td style={tdStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdStyle}>—</td></tr>
            <tr><td style={tdAltStyle}>Decline due to buyer's environment</td><td style={tdAltStyle}><strong style={{ color: '#dc2626' }}>No</strong></td><td style={tdAltStyle}>—</td></tr>
          </tbody>
        </table>
        <Notice type="warning">
          All claims must be raised within the specified window. Claims raised after the window has passed will not be accepted under any circumstances.
        </Notice>
      </Section>

      <Section n="3" title="Dead on Arrival (DOA) Policy">
        <p>A "Dead on Arrival" (DOA) condition means the specimen is clearly deceased or beyond recovery at the time of delivery, not merely stressed from transit.</p>

        <p style={{ fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>What qualifies as DOA:</p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Complete decomposition of all plant tissue (melting / black rot of entire specimen).</li>
          <li>Fully desiccated specimen with no viable tissue remaining.</li>
          <li>Confirmed pest infestation on the specimen at time of delivery.</li>
          <li>Crushed or completely destroyed specimen due to packaging failure during transit.</li>
        </ul>

        <p style={{ fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>What does NOT qualify as DOA:</p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Minor yellowing, slight wilting, or leaf tip browning (common transit stress that resolves within days).</li>
          <li>Partial melt of non-critical outer leaves.</li>
          <li>Loss of emersed leaves (normal when transitioning to submerged growth).</li>
        </ul>

        <Notice type="info">
          When in doubt, provide photos and our team will assess. We err on the side of the buyer in genuine ambiguous cases.
        </Notice>
      </Section>

      <Section n="4" title="How to Raise a Claim">
        <p>To raise a refund or return claim, follow these steps:</p>
        <ol style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li>
            <strong>Document immediately:</strong> Take clear photographs or an unboxing video showing the specimen, its condition, and the packaging (including sealing tape intact or damaged). This evidence is mandatory.
          </li>
          <li>
            <strong>Submit your claim:</strong> Email us at <strong>admin@junglyst.com</strong> with Subject: <em>"Claim – [Your Order Number]"</em>. Include your order number, reason for claim, and attach all photos/video. Alternatively, use the "Raise a Dispute" option in My Orders on your account.
          </li>
          <li>
            <strong>Assessment:</strong> Our team will review your claim within 48 business hours. We may contact the Seller for their assessment and the packaging photograph taken at dispatch.
          </li>
          <li>
            <strong>Resolution:</strong> You will be informed of the decision — replacement, refund, or rejection — via email. Approved refunds are processed within 5–7 business days.
          </li>
        </ol>
        <Notice type="danger">
          Do not return the specimen without prior approval from our team. Unapproved returns will not be accepted and no refund will be issued.
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
        <p>Orders may be cancelled by the buyer before the Seller confirms dispatch. Once the order status moves to "Dispatched", cancellation is not possible. To cancel an order:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Log in to your account, go to "My Orders", and select "Request Cancellation" if the option is available.</li>
          <li>Or email <strong>admin@junglyst.com</strong> immediately with your order number.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>If the Seller has already prepared the specimen for dispatch, a cancellation may be declined. Approved cancellation refunds are processed within 5–7 business days to the original payment method.</p>
      </Section>

      <Section n="7" title="Seller-Cancelled Orders">
        <p>If a Seller is unable to fulfil your order (out of stock, quality failure), the order will be cancelled and a full refund including shipping will be issued automatically within 3–5 business days. You will be notified by email.</p>
      </Section>

      <Section n="8" title="Disputes">
        <p>If you are unsatisfied with the resolution provided by our team, you may escalate your complaint to our Grievance Officer at <strong>legal@junglyst.com</strong>. We aim to resolve all escalated disputes within 15 business days. You also retain the right to approach the Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.</p>
      </Section>
    </PolicyLayout>
  );
}
