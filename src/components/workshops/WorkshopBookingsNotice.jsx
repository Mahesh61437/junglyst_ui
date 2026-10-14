import { useEffect, useState } from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { WorkshopService } from '../../services/WorkshopService';

// Shown on the Fulfillment tab: workshop bookings live on their own tab (no
// courier / dispatch), so point sellers there instead of leaving them hunting.
export default function WorkshopBookingsNotice({ onOpen }) {
  const [upcoming, setUpcoming] = useState(0);

  useEffect(() => {
    let active = true;
    WorkshopService.sellerBookings({ when: 'upcoming', page_size: 1 })
      .then(res => { if (active) setUpcoming(res.count || 0); })
      .catch(() => { /* notice is optional; the Workshops tab still works */ });
    return () => { active = false; };
  }, []);

  if (!upcoming) return null;

  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
      padding: '0.85rem 1.1rem', marginBottom: '1.25rem', borderRadius: '14px',
      background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#14532d',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
        <CalendarDays size={18} />
        You have {upcoming} upcoming workshop booking{upcoming === 1 ? '' : 's'}. Workshops don't need shipping, so they're listed separately.
      </span>
      <button type="button" onClick={onOpen} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: 40, padding: '0.5rem 1rem',
        borderRadius: '10px', border: 'none', background: '#14532d', color: '#fff', fontWeight: 700,
        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        View workshop bookings <ArrowRight size={14} />
      </button>
    </div>
  );
}
