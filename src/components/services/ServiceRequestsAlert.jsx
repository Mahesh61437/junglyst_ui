import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

// Banner at the top of the super admin dashboard. Silent when nothing is waiting.
export default function ServiceRequestsAlert({ summary }) {
  if (!summary || (!summary.new_requests && !summary.in_review)) return null;
  const parts = [
    summary.new_requests > 0 && `${plural(summary.new_requests, 'new quote request')} waiting`,
    summary.in_review > 0 && `${summary.in_review} in review`,
  ].filter(Boolean);

  return (
    <div role="status" style={{ backgroundColor: summary.new_requests > 0 ? '#fef3c7' : '#f1f5f9', borderBottom: `2px solid ${summary.new_requests > 0 ? '#f59e0b' : '#cbd5e1'}` }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <BellRing size={20} color="#b45309" aria-hidden="true" />
        <strong style={{ color: '#78350f', fontSize: '0.9rem' }}>Custom orders: {parts.join(' · ')}</strong>
        <Link to={`/super-admin/services${summary.new_requests > 0 ? '?tab=requests' : ''}`} style={{ marginLeft: 'auto', minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 1rem', borderRadius: 8, backgroundColor: '#b45309', color: 'white', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
          Review requests
        </Link>
      </div>
    </div>
  );
}
