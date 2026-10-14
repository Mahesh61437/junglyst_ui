import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Pencil, Trash2, ExternalLink, CalendarDays, MapPin, Users, Leaf,
  LayoutGrid, Ticket, IndianRupee, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WorkshopService } from '../services/WorkshopService';
import WorkshopEditor from '../components/workshops/WorkshopEditor';
import AdminBookings from '../components/workshops/AdminBookings';
import AdminFinancials from '../components/workshops/AdminFinancials';
import { WORKSHOP_CATEGORIES, formatDate, labelFor } from '../utils/workshops';
import './Workshops.css';
import './SuperAdminWorkshops.css';

const TABS = [
  { id: 'workshops', label: 'Workshops', icon: <LayoutGrid size={15} /> },
  { id: 'bookings', label: 'Bookings', icon: <Ticket size={15} /> },
  { id: 'revenue', label: 'Revenue & settlement', icon: <IndianRupee size={15} /> },
];

const STATUS_STYLE = {
  draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' },
  published: { bg: '#dcfce7', fg: '#166534', label: 'Published' },
  completed: { bg: '#dbeafe', fg: '#1e40af', label: 'Completed' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b', label: 'Cancelled' },
};

function WorkshopTile({ workshop, onEdit, onDelete }) {
  const status = STATUS_STYLE[workshop.status] || STATUS_STYLE.draft;
  const fill = workshop.capacity ? Math.min(100, Math.round((workshop.seats_booked / workshop.capacity) * 100)) : 0;
  return (
    <article className="wa-card wa-ws">
      <div className="wa-ws-cover">
        {workshop.cover_image ? <img src={workshop.cover_image} alt="" /> : <Leaf size={32} />}
      </div>
      <div className="wa-ws-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
          <div className="wa-ws-title">{workshop.title}</div>
          <span style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {workshop.has_overbooked_session && (
              <span className="ws-pill" style={{ background: '#fee2e2', color: '#991b1b' }} title="A session has more paid seats than its capacity">Overbooked</span>
            )}
            <span className="ws-pill" style={{ background: status.bg, color: status.fg }}>{status.label}</span>
          </span>
        </div>
        <div className="wa-ws-meta">
          <span>{labelFor(WORKSHOP_CATEGORIES, workshop.category)}</span>
          <span>· {workshop.organiser_name}</span>
        </div>
        <div className="wa-ws-meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} />
            {workshop.next_session_date ? `Next ${formatDate(workshop.next_session_date, { day: 'numeric', month: 'short' })}` : 'No upcoming session'}
            {workshop.session_count ? ` · ${workshop.session_count} session${workshop.session_count > 1 ? 's' : ''}` : ''}
          </span>
          {workshop.city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{workshop.city}</span>}
        </div>
        <div>
          <div className="wa-ws-meta" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={12} />{workshop.seats_booked} / {workshop.capacity} seats booked</span>
            <span>{fill}%</span>
          </div>
          <div className="wa-progress" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Seats booked"><span style={{ width: `${fill}%` }} /></div>
        </div>
        <div className="wa-ws-actions">
          <button type="button" className="wa-btn wa-btn--primary wa-btn--sm" style={{ flex: 1 }} onClick={() => onEdit(workshop.id)}><Pencil size={13} /> Edit</button>
          {workshop.status !== 'draft' && workshop.status !== 'cancelled' && (
            <a className="wa-icon-btn" href={`/workshops/${workshop.slug}`} target="_blank" rel="noopener noreferrer" aria-label="View public page" title="View public page"><ExternalLink size={15} /></a>
          )}
          <button type="button" className="wa-icon-btn wa-icon-btn--danger" aria-label={`Delete ${workshop.title}`} title="Delete" onClick={() => onDelete(workshop)}><Trash2 size={15} /></button>
        </div>
      </div>
    </article>
  );
}

export default function SuperAdminWorkshops() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'workshops';
  const [workshops, setWorkshops] = useState([]);
  const [organisers, setOrganisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | workshop id

  const isSuperAdmin = Boolean(user?.is_superuser);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) navigate('/', { replace: true });
  }, [authLoading, isSuperAdmin, navigate]);

  // Silent refresh: the first load shows skeletons, later reloads keep the list visible.
  const load = useCallback(() => {
    Promise.all([WorkshopService.admin.list(), WorkshopService.admin.organisers()])
      .then(([list, orgs]) => { setWorkshops(list); setOrganisers(orgs); setError(null); })
      .catch(() => setError('Could not load workshops. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isSuperAdmin) load(); }, [isSuperAdmin, load]);

  const setTab = (id) => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', id); return next; }, { replace: true });

  const handleDelete = async (workshop) => {
    if (!window.confirm(`Delete "${workshop.title}"? It will be hidden from the site.`)) return;
    try {
      await WorkshopService.admin.remove(workshop.id);
      setNotice(`Deleted "${workshop.title}".`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the workshop.');
    }
  };

  const handleSaved = (saved) => {
    setEditing(null);
    const resplit = saved.recalculated_count
      ? ` Re-split ${saved.recalculated_count} unsettled booking${saved.recalculated_count === 1 ? '' : 's'} on the new terms.`
      : '';
    setNotice(`Saved "${saved.title}"${saved.status === 'published' ? ' and published it' : ''}.${resplit}`);
    load();
  };

  if (authLoading || !isSuperAdmin) return null;

  return (
    <div className="wa-page">
      <div className="wa-shell">
        <div className="wa-header">
          <div>
            <button type="button" className="wa-back" onClick={() => navigate('/super-admin')}><ArrowLeft size={14} /> Super admin</button>
            <h1>Workshops</h1>
            <p className="wa-sub">Configure workshops with partner organisers, track every booking and settle payouts.</p>
          </div>
          <button type="button" className="wa-btn wa-btn--primary" onClick={() => setEditing('new')} disabled={!organisers.length && !loading}>
            <Plus size={16} /> New workshop
          </button>
        </div>

        <div className="wa-tabs" role="tablist" aria-label="Workshop console sections">
          {TABS.map(t => (
            <button key={t.id} type="button" role="tab" className="wa-tab" aria-selected={activeTab === t.id} onClick={() => setTab(t.id)}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {notice && (
          <div className="wa-banner wa-banner--ok" role="status">
            <CheckCircle2 size={16} />{notice}
            <button type="button" className="wa-icon-btn" style={{ marginLeft: 'auto', width: 28, height: 28 }} aria-label="Dismiss" onClick={() => setNotice(null)}>×</button>
          </div>
        )}
        {error && <div className="wa-banner wa-banner--error" role="alert"><AlertCircle size={16} />{error}</div>}

        {activeTab === 'workshops' && (
          loading ? (
            <div className="wa-ws-list">{[0, 1, 2].map(i => <div key={i} className="ws-skeleton" style={{ height: 300 }} />)}</div>
          ) : workshops.length === 0 ? (
            <div className="wa-card wa-empty">
              <Leaf size={32} color="#94a3b8" />
              <h3>No workshops yet</h3>
              <p style={{ marginBottom: '1rem' }}>
                {organisers.length ? 'Create your first terrarium or aquarium workshop with a partner seller.' : 'Verify at least one seller first. Workshops are run by a verified organiser.'}
              </p>
              {organisers.length > 0 && <button type="button" className="wa-btn wa-btn--primary" onClick={() => setEditing('new')}><Plus size={16} /> New workshop</button>}
            </div>
          ) : (
            <div className="wa-ws-list">
              {workshops.map(w => <WorkshopTile key={w.id} workshop={w} onEdit={setEditing} onDelete={handleDelete} />)}
            </div>
          )
        )}
        {activeTab === 'bookings' && <AdminBookings workshops={workshops} />}
        {activeTab === 'revenue' && <AdminFinancials />}
      </div>

      {editing && (
        <WorkshopEditor
          workshopId={editing === 'new' ? null : editing}
          organisers={organisers}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
