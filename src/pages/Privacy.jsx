import PolicyLayout, { Section, Notice, Divider } from '../components/PolicyLayout';

const RELATED = [
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/seller-policy', label: 'Seller Policy' },
  { to: '/contact', label: 'Contact Us' },
];

export default function Privacy() {
  return (
    <PolicyLayout
      badge="Legal"
      title="Privacy Policy"
      updated="May 7, 2026"
      summary="This policy explains what personal data Junglyst collects, how we use it, and your rights. We are committed to protecting your privacy in accordance with Indian law."
      relatedLinks={RELATED}
    >
      <Notice type="info">
        This Privacy Policy is compliant with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
      </Notice>

      <Divider />

      <Section n="1" title="Who We Are">
        <p>Junglyst Botanical Private Limited ("Junglyst", "we", "us", or "our") operates the Junglyst platform at junglyst.com. We are the data controller responsible for your personal information collected through this Platform. For all privacy-related queries, you may contact our Grievance Officer at <strong>privacy@junglyst.com</strong>.</p>
      </Section>

      <Section n="2" title="Information We Collect">
        <p>We collect the following categories of information:</p>

        <p style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Information you provide directly:</p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Name, email address, phone number, and delivery address when you register or place an order.</li>
          <li>Payment information (processed and stored by Razorpay — Junglyst does not store card details).</li>
          <li>Seller information: GST number, bank account details, business address, and identity documents during onboarding.</li>
          <li>Communications you send us including support queries and feedback.</li>
        </ul>

        <p style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Information collected automatically:</p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Device information: browser type, operating system, device identifiers.</li>
          <li>Usage data: pages visited, time spent, click patterns, search queries on the Platform.</li>
          <li>IP address and approximate geolocation derived from IP.</li>
          <li>Cookies and similar tracking technologies (see Section 7).</li>
        </ul>
      </Section>

      <Section n="3" title="How We Use Your Information">
        <p>We use the information collected for the following purposes:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Order fulfilment:</strong> Processing orders, coordinating dispatch with Sellers, and managing delivery via NimbusPost.</li>
          <li><strong>Account management:</strong> Creating and maintaining your account, authentication, and customer support.</li>
          <li><strong>Payments:</strong> Facilitating payments and issuing refunds through Razorpay.</li>
          <li><strong>Communications:</strong> Sending order confirmations, shipping updates, and important service notifications via email or SMS.</li>
          <li><strong>Marketing:</strong> With your consent, sending promotional offers, new product alerts, and newsletters. You may unsubscribe at any time.</li>
          <li><strong>Platform improvement:</strong> Analysing usage patterns to improve our website, product catalogue, and buyer experience.</li>
          <li><strong>Legal compliance:</strong> Maintaining records for GST, TDS, and other statutory requirements under Indian law.</li>
          <li><strong>Fraud prevention:</strong> Detecting and preventing fraudulent transactions and policy violations.</li>
        </ul>
      </Section>

      <Section n="4" title="Sharing of Information">
        <p>We do not sell your personal data. We share your information only in the following circumstances:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Sellers:</strong> Your name, delivery address, and phone number are shared with the relevant Seller to fulfil your order.</li>
          <li><strong>Logistics:</strong> Your name, address, and phone number are shared with NimbusPost and their partner couriers for shipping and delivery.</li>
          <li><strong>Payment processors:</strong> Transaction data is shared with Razorpay to process payments.</li>
          <li><strong>Analytics and advertising:</strong> Aggregated, anonymised data may be shared with analytics providers. Individual data is not disclosed.</li>
          <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or government authority.</li>
        </ul>
        <Notice type="warning">
          All third-party service providers are bound by confidentiality obligations and may only use your data for the specific purpose for which it was shared.
        </Notice>
      </Section>

      <Section n="5" title="Data Retention">
        <p>We retain your personal data for as long as your account is active or as necessary to fulfil the purposes described in this policy. Order records are retained for a minimum of 7 years to comply with GST and accounting requirements under Indian law. You may request deletion of your account data by contacting us at <strong>privacy@junglyst.com</strong>; however, we may retain certain records as required by law.</p>
      </Section>

      <Section n="6" title="Your Rights">
        <p>As a user, you have the following rights regarding your personal data:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Request correction of any inaccurate or incomplete data.</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal retention obligations.</li>
          <li><strong>Opt-out of marketing:</strong> Unsubscribe from promotional communications at any time via the link in any marketing email or by contacting us.</li>
          <li><strong>Grievance redressal:</strong> Lodge a complaint with our Grievance Officer within 60 days of any concern arising.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>To exercise any of these rights, email us at <strong>privacy@junglyst.com</strong> with your registered email address and the nature of your request. We will respond within 30 days.</p>
      </Section>

      <Section n="7" title="Cookies">
        <p>We use cookies and similar tracking technologies to enhance your experience on the Platform. Cookies are small text files stored on your device. We use:</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Essential cookies:</strong> Required for the Platform to function (authentication, cart, checkout). Cannot be disabled.</li>
          <li><strong>Analytics cookies:</strong> Help us understand how users interact with the Platform (e.g., Google Analytics, Meta Pixel). You may opt out via your browser settings.</li>
          <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements. You may opt out at any time.</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>You can control cookie settings through your browser. Disabling certain cookies may affect Platform functionality.</p>
      </Section>

      <Section n="8" title="Security">
        <p>We implement industry-standard security measures including SSL/TLS encryption, access controls, and regular security audits to protect your personal data. However, no method of transmission over the internet is 100% secure. We encourage you to use strong, unique passwords and to log out of your account when using shared devices.</p>
      </Section>

      <Section n="9" title="Children's Privacy">
        <p>The Junglyst Platform is not directed at children under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us at <strong>privacy@junglyst.com</strong> and we will take steps to delete such information.</p>
      </Section>

      <Section n="10" title="Grievance Officer">
        <p>In accordance with the Information Technology Act, 2000 and applicable rules, the details of the Grievance Officer are as follows:</p>
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem 1.5rem', marginTop: '0.75rem' }}>
          <p><strong>Name:</strong> Junglyst Privacy Team</p>
          <p style={{ marginTop: '0.4rem' }}><strong>Email:</strong> privacy@junglyst.com</p>
          <p style={{ marginTop: '0.4rem' }}><strong>Designation:</strong> Grievance Officer</p>
          <p style={{ marginTop: '0.4rem' }}><strong>Response time:</strong> Within 30 days of receiving the complaint</p>
        </div>
      </Section>

      <Section n="11" title="Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this page periodically. Continued use of the Platform after changes constitutes your acceptance of the revised policy.</p>
      </Section>
    </PolicyLayout>
  );
}
