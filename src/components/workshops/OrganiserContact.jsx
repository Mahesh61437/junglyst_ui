import { Phone, MessageCircle, UserRound } from 'lucide-react';
import { phoneLinks } from '../../utils/workshops';

const linkStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.35rem', minHeight: 40, padding: '0.4rem 0.85rem',
  borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', border: '1px solid',
};

// Organiser contact shown to the attendee after booking (ticket, My Orders).
export default function OrganiserContact({ contact }) {
  if (!contact?.name && !contact?.phone) return null;
  const links = phoneLinks(contact.phone);
  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
      <UserRound size={18} color="var(--brand-green)" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        <div className="ws-fact-label">Organiser contact</div>
        <div style={{ fontWeight: 600 }}>{contact.name}</div>
        {contact.phone && <div style={{ fontSize: '0.85rem', color: '#475569' }}>{contact.phone}</div>}
        {links && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            <a href={links.tel} style={{ ...linkStyle, color: '#105c44', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
              <Phone size={14} /> Call
            </a>
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: '#166534', borderColor: '#d1fae5', background: '#fff' }}>
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
