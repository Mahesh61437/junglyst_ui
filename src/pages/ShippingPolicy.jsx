import PolicyLayout, { Section, Notice, Divider } from '../components/PolicyLayout';
import SEO from '../components/SEO';

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
    <>
    <SEO
      title="Shipping Policy | Junglyst"
      description="Junglyst shipping policy — delivery timelines, live plant packaging, AWB tracking, and what to do if your order is delayed or damaged in transit."
      path="/shipping-policy"
    />
    <PolicyLayout
      badge="Shipping"
      title="Shipping Policy"
      updated="May 20, 2026"
      summary="How we pack, dispatch, and deliver your botanical specimens across India. Live plants require special handling — please read this carefully."
      relatedLinks={RELATED}
    >
      <Notice type="info">
        All orders are shipped via <strong>NimbusPost</strong> and their network of courier partners. Tracking information is shared with you via email and SMS after dispatch.
      </Notice>

      <Divider />

      <Section n="1" title="Order Processing Time">
        <p>Orders are processed by the respective Seller after payment confirmation. Sellers are required to dispatch confirmed orders within <strong>48 hours of order confirmation</strong>. Unconfirmed orders may be auto-cancelled by the system after 24 hours.</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Order Type</th>
              <th style={thStyle}>Processing / Dispatch Deadline</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>In-stock specimens</td><td style={tdStyle}>Within 48 hours of order confirmation</td></tr>
            <tr><td style={tdAltStyle}>Pre-order / made-to-order</td><td style={tdAltStyle}>As specified on the product listing</td></tr>
            <tr><td style={tdStyle}>Bulk / wholesale orders</td><td style={tdStyle}>3–5 business days (agreed at time of order)</td></tr>
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
            <tr><td style={tdAltStyle}><strong>Zone D</strong></td><td style={tdAltStyle}>Whitelisted cities across India (see below)</td><td style={tdAltStyle}>4–6 business days</td></tr>
          </tbody>
        </table>
        <Notice type="warning">
          Junglyst currently ships only within India. International shipping is not available. <strong>Zone E (remote / North-East / J&amp;K) and non-whitelisted Zone D pincodes are not serviceable</strong> — checkout will be blocked for these locations.
        </Notice>
        <p style={{ marginTop: '1.25rem', fontWeight: 700, fontSize: '0.875rem' }}>Whitelisted Zone D cities (serviceable):</p>
        <p style={{ marginTop: '0.5rem', color: '#334155', lineHeight: 1.8, fontSize: '0.875rem' }}>
          Jaipur, Ahmedabad, Surat, Chandigarh, Lucknow, Bhubaneswar, Goa, Nagpur, Coimbatore, Kochi
        </p>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
          You can check whether your pincode is serviceable on any product page using the <strong>"Check Delivery"</strong> tool, on the cart page, or at checkout. Orders to blocked pincodes cannot be placed.
        </p>
      </Section>

      <Section n="3" title="Shipping Charges">
        <p>Shipping charges are calculated per seller based on the item category and order subtotal from that seller. The exact amount is shown at checkout before payment. Shipping charges are non-refundable except in cases where Junglyst or the Seller is at fault.</p>

        <p style={{ marginTop: '1.25rem', fontWeight: 700, fontSize: '0.9rem' }}>Light items (aquatic plants, stems, mosses, tissue culture)</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Order Subtotal (per seller)</th>
              <th style={thStyle}>Shipping Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>Below ₹699</td><td style={tdStyle}>₹99</td></tr>
            <tr><td style={tdAltStyle}>₹699 – ₹998</td><td style={tdAltStyle}>₹49</td></tr>
            <tr><td style={tdStyle}>₹999 and above</td><td style={tdStyle}><strong style={{ color: '#10b981' }}>FREE</strong></td></tr>
          </tbody>
        </table>

        <p style={{ marginTop: '1.75rem', fontWeight: 700, fontSize: '0.9rem' }}>Heavy items (rocks, substrate, soil, driftwood, hardscape)</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Order Subtotal (per seller)</th>
              <th style={thStyle}>Shipping Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>Below ₹999</td><td style={tdStyle}>₹99</td></tr>
            <tr><td style={tdAltStyle}>₹999 – ₹2,498</td><td style={tdAltStyle}>₹49</td></tr>
            <tr><td style={tdStyle}>₹2,499 and above</td><td style={tdStyle}><strong style={{ color: '#10b981' }}>FREE</strong></td></tr>
          </tbody>
        </table>

        <Notice type="info">
          Shipping is calculated independently per seller. If your cart from one seller contains both light and heavy items, the <strong>heavy item thresholds apply to the entire seller sub-order</strong>. A free-shipping nudge will appear on the cart page when you are within ₹200 of the free threshold for any seller.
        </Notice>
      </Section>

      <Section n="4" title="Botanical Packaging Standards">
        <p>All live specimens are packed using our proprietary botanical packaging protocol to ensure live arrival:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <li><strong>Moisture retention:</strong> Specimens are wrapped in damp sphagnum moss or moisture-locking material to prevent desiccation during transit.</li>
          <li><strong>Cushioning:</strong> Rigid outer corrugated boxes with internal padding protect against physical damage. Soft mailers or envelopes are not used for live specimens.</li>
          <li><strong>Thermal regulation:</strong> Orders to high-temperature zones are dispatched with insulation material during summer months (April–July).</li>
          <li><strong>Labelling:</strong> All boxes are clearly labelled <em>"LIVE PLANTS — HANDLE WITH CARE — THIS SIDE UP"</em>.</li>
          <li><strong>Packaging photos:</strong> Sellers are required to upload 1–3 photographs of the packaged specimen before dispatch. These photos are stored permanently against your order and are available in your order details. They serve as key evidence in any DOA dispute.</li>
        </ul>
        <Notice type="info">
          Our packaging standards are designed for 24–72 hour transit windows. We do not ship to zones where transit time routinely exceeds this window, in order to protect specimen viability.
        </Notice>
      </Section>

      <Section n="5" title="Live Arrival Guarantee">
        <p>Junglyst offers a Live Arrival Guarantee (LAG) on all specimens shipped with our verified packaging. If your specimen arrives dead or severely damaged due to transit, you are eligible for a replacement or refund subject to the following conditions:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>The claim must be raised within <strong>24 hours of delivery</strong> as recorded by the courier.</li>
          <li>Clear unboxing photographs or a continuous unboxing video showing the condition of the specimen and the intact sealed packaging must be provided.</li>
          <li>The outer packaging must show no signs of tampering by the recipient.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>The LAG does not cover minor transit stress (slight yellowing, minor wilting) that resolves with proper acclimatisation. It covers confirmed DOA (Dead on Arrival) conditions only. See our <a href="/refund-policy" style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>Refund &amp; Returns Policy</a> for the full claims process.</p>
      </Section>

      <Section n="6" title="Tracking Your Order">
        <p>Once your order is dispatched, you will receive an email and SMS containing your AWB (Air Waybill) number and a tracking link. You can track your shipment directly on the NimbusPost tracking portal or through the courier partner's website. Your order status is also updated in real-time on your Junglyst account under <strong>"My Orders"</strong>.</p>
        <p style={{ marginTop: '1rem' }}>Order statuses are: <em>Order Placed → Confirmed → Packing → Shipped → In Transit → Out for Delivery → Delivered</em>. In the event of an issue: <em>Delivery Failed</em>, <em>DOA Complaint Raised</em>, or <em>Cancelled</em>.</p>
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

      <Section n="8" title="Multi-Seller Orders & Cart Rules">
        <p>Junglyst supports ordering from multiple sellers in a single checkout. The following rules apply:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <li><strong>Maximum 3 sellers per cart.</strong> Adding a product from a 4th seller will be blocked. Complete or clear your current cart first.</li>
          <li><strong>Minimum ₹500 per seller subtotal.</strong> If your subtotal from any single seller is below ₹500, you will see a warning and checkout will be unavailable for that seller's items until the minimum is met.</li>
          <li><strong>Independent shipments:</strong> Each seller dispatches their portion separately. You receive separate AWB numbers and shipments may arrive on different dates.</li>
          <li><strong>Sub-order numbering:</strong> A single checkout creates a master order (e.g. <em>JNG-2026-00123</em>) that splits into sub-orders per seller (e.g. <em>JNG-2026-00123-A</em>, <em>JNG-2026-00123-B</em>). Each sub-order is tracked independently.</li>
          <li><strong>Shipping per seller:</strong> Shipping charges are calculated and displayed independently for each seller's shipment at checkout.</li>
        </ul>
      </Section>

      <Section n="9" title="Contact for Shipping Issues">
        <p>For any shipping-related concerns, contact us at <strong>admin@junglyst.com</strong> or raise a query through our <a href="/contact" style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>Contact page</a>. Please have your order number and AWB number ready for faster resolution.</p>
      </Section>
    </PolicyLayout>
    </>
  );
}
