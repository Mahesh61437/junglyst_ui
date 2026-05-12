import PolicyLayout, { Section, Notice, Divider } from '../components/PolicyLayout';

const RELATED = [
  { to: '/refund-policy', label: 'Refunds & Returns' },
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

export default function ShippingPolicy() {
  return (
    <PolicyLayout
      badge="Shipping"
      title="Shipping Policy"
      updated="May 7, 2026"
      summary="How we pack, dispatch, and deliver your botanical specimens across India. Live plants require special handling — please read this carefully."
      relatedLinks={RELATED}
    >
      <Notice type="info">
        All orders are shipped via <strong>NimbusPost</strong> and their network of courier partners. Tracking information is shared with you via email and SMS after dispatch.
      </Notice>

      <Divider />

      <Section n="1" title="Order Processing Time">
        <p>Orders are processed by the respective Seller after payment confirmation. Processing timelines are as follows:</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Order Type</th>
              <th style={thStyle}>Processing Time</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>In-stock specimens</td><td style={tdStyle}>1–2 business days</td></tr>
            <tr><td style={tdAltStyle}>Pre-order / made-to-order</td><td style={tdAltStyle}>As specified on the product listing</td></tr>
            <tr><td style={tdStyle}>Bulk / wholesale orders</td><td style={tdStyle}>3–5 business days</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '1rem' }}>Orders placed after 2:00 PM IST or on public holidays will be processed the next business day. Business days are Monday to Saturday, excluding national and bank holidays.</p>
      </Section>

      <Section n="2" title="Delivery Timelines">
        <p>Estimated delivery times vary by destination zone after dispatch. These are estimates, not guarantees, and may be affected by courier network conditions.</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Zone</th>
              <th style={thStyle}>Region</th>
              <th style={thStyle}>Estimated Delivery</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}><strong>Zone A</strong></td><td style={tdStyle}>Same city / metro</td><td style={tdStyle}>1–2 business days</td></tr>
            <tr><td style={tdAltStyle}><strong>Zone B</strong></td><td style={tdAltStyle}>Same state</td><td style={tdAltStyle}>2–3 business days</td></tr>
            <tr><td style={tdStyle}><strong>Zone C</strong></td><td style={tdStyle}>Adjacent states</td><td style={tdStyle}>3–4 business days</td></tr>
            <tr><td style={tdAltStyle}><strong>Zone D</strong></td><td style={tdAltStyle}>Rest of India</td><td style={tdAltStyle}>4–6 business days</td></tr>
            <tr><td style={tdStyle}><strong>Zone E</strong></td><td style={tdStyle}>Remote / NE / J&K</td><td style={tdStyle}>6–10 business days</td></tr>
          </tbody>
        </table>
        <Notice type="warning">
          Junglyst currently ships only within India. International shipping is not available at this time.
        </Notice>
      </Section>

      <Section n="3" title="Shipping Charges">
        <p>Shipping charges are calculated at checkout based on the weight, dimensions, and delivery zone of your order. The exact amount is shown before payment. Orders above a threshold amount (as displayed on the Platform) may qualify for free shipping. Shipping charges are non-refundable except in cases where Junglyst or the Seller is at fault.</p>
      </Section>

      <Section n="4" title="Botanical Packaging Standards">
        <p>All live specimens are packed using our proprietary botanical packaging protocol to ensure live arrival:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <li><strong>Moisture retention:</strong> Specimens are wrapped in damp sphagnum moss or moisture-locking material to prevent desiccation during transit.</li>
          <li><strong>Cushioning:</strong> Rigid outer boxes with internal padding protect against physical damage.</li>
          <li><strong>Thermal regulation:</strong> Orders to high-temperature zones are dispatched with insulation material during summer months (April–July).</li>
          <li><strong>Labelling:</strong> All boxes are clearly labelled "LIVE PLANTS — HANDLE WITH CARE — THIS SIDE UP".</li>
          <li><strong>Packaging photo:</strong> Sellers are required to photograph the packaged specimen before dispatch. This image is available in your order details.</li>
        </ul>
        <Notice type="info">
          Our packaging standards are designed for 24–72 hour transit windows. For Zone E deliveries, please contact us before ordering to confirm availability of special packaging.
        </Notice>
      </Section>

      <Section n="5" title="Live Arrival Guarantee">
        <p>Junglyst offers a Live Arrival Guarantee (LAG) on all specimens shipped with our verified packaging. If your specimen arrives dead or severely damaged due to transit, you are eligible for a replacement or refund subject to the following conditions:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>The claim must be raised within <strong>24 hours of delivery</strong> as recorded by the courier.</li>
          <li>Clear unboxing photographs or video showing the condition of the specimen and the sealed packaging must be provided.</li>
          <li>The outer packaging must show no signs of tampering by the recipient.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>The LAG does not cover minor transit stress (slight yellowing, minor wilting) that resolves with proper acclimatisation. It covers confirmed DOA (Dead on Arrival) conditions. See our <a href="/refund-policy" style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>Refund & Returns Policy</a> for the full claims process.</p>
      </Section>

      <Section n="6" title="Tracking Your Order">
        <p>Once your order is dispatched, you will receive an email and SMS containing your AWB (Air Waybill) number and a tracking link. You can track your shipment directly on the NimbusPost tracking portal or through the courier partner's website. Your order status is also updated in real-time on your Junglyst account under "My Orders".</p>
      </Section>

      <Section n="7" title="Delivery Attempts & Failed Deliveries">
        <p>Our courier partners will make up to 3 delivery attempts. If delivery is unsuccessful after 3 attempts (due to unavailability, incorrect address, or refusal), the package will be returned to the Seller. For returned shipments:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Re-delivery can be arranged at an additional shipping charge.</li>
          <li>If you do not wish to redeliver, only the product value (excluding original shipping charges) may be refunded at the Seller's discretion.</li>
          <li>For live specimens, viability after a failed delivery and return journey cannot be guaranteed.</li>
        </ul>
        <Notice type="danger">
          Please ensure your delivery address and phone number are accurate at checkout. Junglyst is not responsible for non-delivery due to incorrect address information provided by the buyer.
        </Notice>
      </Section>

      <Section n="8" title="Multiple Sellers & Split Shipments">
        <p>If your order contains products from multiple Sellers, each Seller will dispatch their portion independently. You will receive separate AWB numbers for each shipment. Shipping charges for multi-seller orders are calculated per shipment. Each shipment will have its own tracking and may arrive on different dates.</p>
      </Section>

      <Section n="9" title="Contact for Shipping Issues">
        <p>For any shipping-related concerns, contact us at <strong>support@junglyst.com</strong> or raise a query through our <a href="/contact" style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>Contact page</a>. Please have your order number and AWB number ready for faster resolution.</p>
      </Section>
    </PolicyLayout>
  );
}
