import PolicyLayout, { Section, Notice, Divider } from '../components/PolicyLayout';

const RELATED = [
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/shipping-policy', label: 'Shipping Policy' },
  { to: '/privacy', label: 'Privacy Policy' },
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

export default function SellerPolicy() {
  return (
    <PolicyLayout
      badge="Sellers"
      title="Seller Policy"
      updated="May 7, 2026"
      summary="Everything you need to know about selling on Junglyst — verification requirements, commissions, payouts, conduct standards, and prohibited items."
      relatedLinks={RELATED}
    >
      <Notice type="info">
        By completing the Junglyst seller onboarding process and activating your store, you agree to be bound by this Seller Policy in addition to our general Terms & Conditions.
      </Notice>

      <Divider />

      <Section n="1" title="Seller Eligibility & Verification">
        <p>Junglyst is a curated marketplace. Not all applications are accepted. To sell on Junglyst, you must:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Be an individual, partnership, LLP, or registered company legally operating in India.</li>
          <li>Possess a valid PAN (Permanent Account Number).</li>
          <li>If your annual turnover exceeds the GST threshold, a valid GSTIN is required. If below the threshold, a self-declaration is sufficient.</li>
          <li>Provide a valid bank account in your name or business name for payouts.</li>
          <li>Successfully pass Junglyst's quality audit, which may include submitting specimen photographs and, in some cases, a video walkthrough of your nursery or growing facility.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>Junglyst reserves the absolute right to accept, reject, or suspend any seller application or account without providing reasons.</p>
      </Section>

      <Section n="2" title="Listing Standards">
        <p>All product listings must comply with the following standards:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Accuracy:</strong> Listings must accurately describe the species, variant, size, and condition of the specimen. Scientific and common names must be correct.</li>
          <li><strong>Photography:</strong> At least one photograph of the actual specimen (not a stock photo) must be provided. Photos must be clear, well-lit, and representative of the item being sold.</li>
          <li><strong>Pricing:</strong> Listed prices must be inclusive of GST. Sellers are responsible for compliance with applicable tax obligations.</li>
          <li><strong>Stock:</strong> Sellers must not list specimens that are not available. Out-of-stock listings must be unpublished promptly.</li>
          <li><strong>Condition:</strong> Only healthy, pest-free specimens may be listed. Any known defects must be disclosed in the listing description.</li>
        </ul>
        <Notice type="danger">
          Listing prohibited species (see Section 6) will result in immediate account suspension and potential legal action.
        </Notice>
      </Section>

      <Section n="3" title="Order Fulfilment Obligations">
        <p>Upon receiving an order, Sellers are required to:</p>
        <ol style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li><strong>Confirm the order</strong> within 24 hours of placement. Unconfirmed orders may be auto-cancelled by the system.</li>
          <li><strong>Upload a packaging photograph</strong> before handing over to courier. This is mandatory and protects both the Seller and buyer in case of disputes.</li>
          <li><strong>Dispatch the order</strong> within the processing window stated on your listing (maximum 2 business days for in-stock items unless stated otherwise).</li>
          <li><strong>Enter shipment details</strong> (AWB number, courier partner) in the Seller Dashboard after dispatch so the buyer can track the order.</li>
        </ol>
        <p style={{ marginTop: '1rem' }}>Repeated failure to fulfil orders on time will result in a seller rating penalty and may lead to account suspension.</p>
      </Section>

      <Section n="4" title="Packaging Requirements">
        <p>All live specimens must be packed in accordance with Junglyst's Botanical Packaging Standards (detailed in the Shipping Policy). Key requirements:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Use moisture-retention material (sphagnum moss, wet newspaper, or equivalent) appropriate for the specimen.</li>
          <li>Use sturdy outer corrugated boxes. No soft mailers or envelopes for live specimens.</li>
          <li>Label the package clearly: "LIVE PLANTS — HANDLE WITH CARE — THIS SIDE UP".</li>
          <li>During summer months (April–July), use insulation material for all specimens sensitive to heat.</li>
        </ul>
        <Notice type="warning">
          Sellers who do not adhere to packaging standards and whose specimens arrive DOA due to inadequate packaging will bear the cost of the replacement or refund. Junglyst will deduct the refunded amount from the Seller's next payout.
        </Notice>
      </Section>

      <Section n="5" title="Commission & Fees">
        <p>Junglyst charges a platform commission on each completed order. The commission structure is as follows:</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Commission Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>Live aquatic plants & specimens</td><td style={tdStyle}>As agreed during onboarding</td></tr>
            <tr><td style={tdAltStyle}>Accessories & hardscape</td><td style={tdAltStyle}>As agreed during onboarding</td></tr>
            <tr><td style={tdStyle}>Featured / promoted listings</td><td style={tdStyle}>Additional fee applies</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '1rem' }}>The exact commission rate applicable to your store is communicated during the onboarding process and confirmed in your Seller Agreement. Commission is deducted from the order value before payout. Junglyst reserves the right to revise commission rates with 30 days' prior written notice.</p>
        <p style={{ marginTop: '1rem' }}>Payment gateway charges (Razorpay processing fees) are borne by Junglyst and are not deducted from Seller payouts.</p>
      </Section>

      <Section n="6" title="Payout Schedule">
        <p>Seller payouts are processed after the buyer's return window has closed and no active dispute exists on the order. The standard payout cycle is:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Orders are settled <strong>7 days after delivery confirmation</strong> (or 48 hours after the return window closes, whichever is later).</li>
          <li>Payouts are batched and transferred to the Seller's registered bank account every <strong>Monday and Thursday</strong>.</li>
          <li>A payout statement is emailed to the Seller's registered email with a breakdown of orders, commissions deducted, and TDS (if applicable).</li>
        </ul>
        <Notice type="info">
          TDS (Tax Deducted at Source) at the applicable rate under Section 194-O of the Income Tax Act will be deducted from payouts where applicable. Sellers must ensure their PAN is correctly registered on the platform.
        </Notice>
      </Section>

      <Section n="7" title="Prohibited Items">
        <p>The following items are strictly prohibited on Junglyst:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Any specimen listed under CITES Appendix I (prohibiting commercial trade).</li>
          <li>Any wildlife specimen or part thereof prohibited under the Wildlife Protection Act, 1972.</li>
          <li>Invasive species that are restricted or regulated under Indian environmental law.</li>
          <li>Specimens collected from the wild (wild-collected specimens) without appropriate government permits.</li>
          <li>Any item that is illegal to sell, purchase, or transport in India or the buyer's state.</li>
          <li>Non-botanical products not relevant to the Junglyst marketplace focus.</li>
        </ul>
      </Section>

      <Section n="8" title="Conduct & Quality Standards">
        <p>Sellers are expected to maintain the highest standards of conduct. The following are grounds for immediate account suspension or termination:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Sending specimens that do not match the listing in species, size, or condition.</li>
          <li>Sending infected or pest-ridden specimens.</li>
          <li>Misrepresenting species names (e.g., labelling common species as rare variants for higher pricing).</li>
          <li>Attempting to conduct transactions outside the Junglyst platform to avoid commission.</li>
          <li>Receiving 3 or more substantiated DOA/quality complaints within a 90-day period.</li>
          <li>Abusive, threatening, or unprofessional communication with buyers or Junglyst staff.</li>
          <li>Providing false information during onboarding or at any time thereafter.</li>
        </ul>
      </Section>

      <Section n="9" title="Account Suspension & Termination">
        <p>Junglyst may suspend or terminate a Seller account for policy violations, sustained poor performance, or at our absolute discretion. Upon termination:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>All pending orders must be fulfilled. New orders will not be accepted.</li>
          <li>Any pending payouts will be held for 30 days to cover potential buyer claims before release.</li>
          <li>Active listings will be removed from the Platform immediately.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>Sellers may appeal a suspension by writing to <strong>sellers@junglyst.com</strong> within 7 days of notification. Junglyst's decision on appeals is final.</p>
      </Section>

      <Section n="10" title="Seller Support">
        <p>Our dedicated seller support team is available to help with listing optimisation, shipping queries, and payout issues. Contact us at <strong>sellers@junglyst.com</strong> or through your Seller Dashboard. We aim to respond to all seller queries within 1 business day.</p>
      </Section>
    </PolicyLayout>
  );
}
