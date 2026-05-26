import PolicyLayout, { Section, Notice, Divider } from '../components/PolicyLayout';
import SEO from '../components/SEO';

const RELATED = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/shipping-policy', label: 'Shipping Policy' },
  { to: '/refund-policy', label: 'Refunds & Returns' },
  { to: '/seller-policy', label: 'Seller Policy' },
];

export default function Terms() {
  return (
    <>
    <SEO
      title="Terms & Conditions | Junglyst"
      description="Read Junglyst's terms and conditions governing use of our marketplace platform, buyer protections, and seller obligations."
      path="/terms"
    />
    <PolicyLayout
      badge="Legal"
      title="Terms & Conditions"
      updated="May 20, 2026"
      summary="Please read these terms carefully before using the Junglyst platform. By placing an order or registering as a seller, you agree to be bound by these terms."
      relatedLinks={RELATED}
    >
      <Notice type="info">
        Junglyst is operated by Junglyst Botanical Private Limited, a company incorporated under the laws of India. These terms are governed by the Information Technology Act, 2000 and the Consumer Protection Act, 2019.
      </Notice>

      <Divider />

      <Section n="1" title="Acceptance of Terms">
        <p>By accessing or using Junglyst ("the Platform"), creating an account, placing an order, or registering as a seller, you ("User") agree to be legally bound by these Terms and Conditions. If you do not agree to any part of these terms, you must not use the Platform. These terms apply to all visitors, buyers, sellers, and any other users of the Platform.</p>
      </Section>

      <Section n="2" title="Nature of the Platform">
        <p>Junglyst is an online curated marketplace that connects verified sellers ("Sellers") of live botanical specimens, aquatic plants, rare flora, and related accessories with buyers ("Buyers") across India. Junglyst acts as an intermediary platform and is not the seller of record for any product listed by third-party Sellers. All contracts for sale are formed directly between the Buyer and the respective Seller.</p>
        <p style={{ marginTop: '1rem' }}>Junglyst does not represent, warrant, or guarantee the accuracy, completeness, or quality of any product listing. However, all Sellers undergo a verification and quality audit process before being permitted to list products.</p>
      </Section>

      <Section n="3" title="Eligibility">
        <p>You must be at least 18 years of age and legally capable of entering into a binding contract under Indian law to use the Platform. By registering, you represent and warrant that all information you provide is accurate and complete. Junglyst reserves the right to terminate accounts found to be in violation of eligibility requirements.</p>
      </Section>

      <Section n="4" title="User Accounts">
        <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify Junglyst immediately at <strong>admin@junglyst.com</strong> if you suspect any unauthorised access. Junglyst will not be liable for any loss resulting from unauthorised use of your account. You may not transfer your account to any other person.</p>
      </Section>

      <Section n="5" title="Live Specimen Acknowledgement">
        <p>All botanical specimens sold on Junglyst are living organisms. By purchasing a live specimen, you acknowledge and accept the following:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Natural variation in leaf count, size, colouration, and rhizome dimension is expected and is not a defect.</li>
          <li>The long-term health of the specimen after delivery is dependent on your specific aquatic or environmental conditions.</li>
          <li>Immediate unboxing and acclimatisation upon receipt is strongly recommended.</li>
          <li>Specimens described as "Pest-Free" are certified at the time of dispatch; transit conditions may affect this status.</li>
        </ul>
        <Notice type="warning">
          Live Arrival Guarantee applies only to specimens dispatched with verified botanical packaging. Claims must be raised within 24 hours of delivery with photographic evidence. See our Refund & Returns Policy for full details.
        </Notice>
      </Section>

      <Section n="6" title="Pricing & Payments">
        <p>All prices are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. Prices may change without prior notice. Payment is collected at the time of order placement via Razorpay. Junglyst does not store any payment card details on its servers. Orders are confirmed only upon successful payment authorisation.</p>
        <p style={{ marginTop: '1rem' }}>The following cart rules apply to all orders:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>A maximum of <strong>3 sellers</strong> may be included in a single cart / checkout session.</li>
          <li>A minimum subtotal of <strong>₹500 per seller</strong> is required before checkout. Items below this threshold must be supplemented to meet the minimum.</li>
          <li>A single payment captures the full order value. The order is then split into independent sub-orders per seller for fulfilment.</li>
        </ul>
      </Section>

      <Section n="7" title="Prohibited Conduct">
        <p>Users must not:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>List, sell, or purchase any specimen prohibited under CITES, the Wildlife Protection Act 1972, or any applicable Indian law.</li>
          <li>Engage in fraudulent transactions, unjustified chargebacks, or manipulation of reviews.</li>
          <li>Use automated bots or scrapers to access the Platform without written permission.</li>
          <li>Impersonate Junglyst staff, other sellers, or buyers.</li>
          <li>Post false, misleading, or defamatory content in any listing or review.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>Violation of these terms may result in immediate account suspension, forfeiture of pending payouts, and legal action where applicable.</p>
      </Section>

      <Section n="8" title="Intellectual Property">
        <p>All content on Junglyst including the brand name, logo, website design, photography, copy, and software is the exclusive intellectual property of Junglyst Botanical Private Limited or its licensors. Sellers retain ownership of their original product photography but grant Junglyst a non-exclusive, royalty-free licence to use such images for marketing and promotional purposes.</p>
      </Section>

      <Section n="9" title="Limitation of Liability">
        <p>To the maximum extent permitted by applicable Indian law, Junglyst's total liability to any User for any claim shall be limited to the amount paid for the specific order giving rise to the claim. Junglyst shall not be liable for indirect, incidental, consequential, or punitive damages including loss of profit, data, or goodwill.</p>
        <Notice type="warning">
          Junglyst is not liable for damage, delay, or loss caused by force majeure events including natural disasters, courier failures, government restrictions, or postal disruptions.
        </Notice>
      </Section>

      <Section n="10" title="Governing Law & Dispute Resolution">
        <p>These Terms are governed by the laws of India. Disputes shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka, India. For consumer complaints, users may also approach the appropriate Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.</p>
      </Section>

      <Section n="11" title="Amendments">
        <p>Junglyst reserves the right to modify these Terms at any time. The updated version will be posted on this page with a revised "Last Updated" date. Continued use of the Platform after such changes constitutes your acceptance of the new Terms.</p>
      </Section>

      <Section n="12" title="Contact">
        <p>For questions regarding these Terms, write to us at <strong>legal@junglyst.com</strong> or visit our <a href="/contact" style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>Contact page</a>.</p>
      </Section>
    </PolicyLayout>
    </>
  );
}
