import { useCallback, useEffect, useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { QUOTE_SECTIONS, QUOTE_STATUS } from '../../utils/serviceQuotes';
import Pagination from '../Pagination';
import AdminQuoteModal from './AdminQuoteModal';
import QuoteRequestList from './QuoteRequestList';
import QuoteSectionTabs from './QuoteSectionTabs';
import QuoteRequestForm from './QuoteRequestForm';
import '../../pages/Services.css';
import '../../pages/SuperAdminWorkshops.css';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const ORDERINGS = [
  { id: '-created', label: 'Newest first' }, { id: 'created', label: 'Oldest first' },
  { id: '-budget', label: 'Highest budget' }, { id: 'budget', label: 'Lowest budget' },
];

// Request taken over the phone: the admin fills the same form the customer would.
function PhoneRequestModal({ offerings, onClose, onCreated }) {
  const [slug, setSlug] = useState('');
  const [loaded, setLoaded] = useState({ slug: '', offering: null, failed: false });

  useEffect(() => {
    if (!slug) return;
    ServiceQuoteService.offering(slug)
      .then(offering => setLoaded({ slug, offering, failed: false }))
      .catch(() => setLoaded({ slug, offering: null, failed: true }));
  }, [slug]);
  const current = loaded.slug === slug ? loaded : { offering: null, failed: false };
  const { offering } = current;
  const loadError = current.failed ? 'Could not load this form.' : null;
  const activeOfferings = offerings.filter(o => o.is_active);

  return (
    <div className="sv-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="sv-modal sv-modal--wide sv-modal--tall" role="dialog" aria-modal="true" aria-labelledby="pr-title" aria-describedby="pr-help">
        <div className="sv-modal-head">
          <h2 id="pr-title">Record a phone request</h2>
          <button type="button" className="sv-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <p id="pr-help" className="sv-form-sub" style={{ margin: 0 }}>
          A customer called instead of using the website? Pick what they want and fill in their details as they tell you.
          The request joins the queue like any other, and the customer gets a confirmation email.
        </p>
        <fieldset className="sv-fieldset">
          <legend>1. Which service?</legend>
          {activeOfferings.length === 0 ? (
            <div className="sv-banner sv-banner--error" role="status">No active services yet. Add one under Groups &amp; services first.</div>
          ) : (
            <div className="sv-address-list" role="radiogroup" aria-label="Service">
              {activeOfferings.map(o => (
                <label key={o.id} className="sv-address">
                  <input type="radio" name="pr-offering" value={o.slug} checked={slug === o.slug} onChange={() => setSlug(o.slug)} />
                  <span><strong>{o.name}</strong><span className="sv-address-lines">{o.group_name}</span></span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        {slug && !offering && !loadError && <div className="sv-skeleton" style={{ height: 240 }} aria-busy="true" />}
        {offering && <h3 style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>2. Customer details</h3>}
        {loadError && <div className="sv-banner sv-banner--error" role="alert">{loadError}</div>}
        {offering && (
          <QuoteRequestForm
            key={offering.slug}
            offering={offering}
            submitLabel="Save request"
            staffMode
            onSubmit={(payload) => ServiceQuoteService.admin.createRequest({ ...payload, offering: offering.slug })}
            onSubmitted={onCreated}
          />
        )}
      </div>
    </div>
  );
}

export default function AdminQuoteQueue({ groups, offerings, sellers }) {
  const [filters, setFilters] = useState({ section: 'active', status: '', group: '', q: '', ordering: '-created' });
  const [counts, setCounts] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setFilters(prev => ({ ...prev, q: search.trim() })); setPage(1); }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    const params = { page, page_size: PAGE_SIZE, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) };
    return ServiceQuoteService.admin.requests(params)
      .then(result => { setData(result); setError(null); })
      .catch(() => setError('Could not load requests. Please refresh.'))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const loadCounts = useCallback(() => ServiceQuoteService.admin.summary()
    .then(summary => setCounts(Object.fromEntries(QUOTE_SECTIONS.map(s => [s.id, summary[`section_${s.id}`]]))))
    .catch(() => setCounts(null)), []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  const refresh = () => { load(); loadCounts(); };
  const sectionStatuses = QUOTE_SECTIONS.find(s => s.id === filters.section)?.statuses || [];
  const setSection = (section) => { setFilters(prev => ({ ...prev, section, status: '' })); setPage(1); };

  const setFilter = (key) => (event) => { setFilters(prev => ({ ...prev, [key]: event.target.value })); setPage(1); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button type="button" className="wa-btn wa-btn--ghost" style={{ minHeight: 44 }} onClick={() => setRecording(true)}><PhoneCall size={15} /> Record phone request</button>
      </div>

      <QuoteSectionTabs sections={QUOTE_SECTIONS} value={filters.section} onChange={setSection} counts={counts} />

      <div className="sv-filters">
        <div className="sv-field"><label className="sv-label" htmlFor="qf-search">Search</label>
          <input id="qf-search" className="sv-input" type="search" placeholder="Reference, name or phone" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="sv-field"><label className="sv-label" htmlFor="qf-status">Status</label>
          <select id="qf-status" className="sv-select" value={filters.status} onChange={setFilter('status')}>
            <option value="">All statuses</option>
            {sectionStatuses.map(id => <option key={id} value={id}>{QUOTE_STATUS[id].label}</option>)}
          </select></div>
        <div className="sv-field"><label className="sv-label" htmlFor="qf-group">Group</label>
          <select id="qf-group" className="sv-select" value={filters.group} onChange={setFilter('group')}>
            <option value="">All groups</option>
            {groups.map(group => <option key={group.id} value={group.slug}>{group.name}</option>)}
          </select></div>
        <div className="sv-field"><label className="sv-label" htmlFor="qf-order">Sort</label>
          <select id="qf-order" className="sv-select" value={filters.ordering} onChange={setFilter('ordering')}>
            {ORDERINGS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select></div>
      </div>

      {error && <div className="sv-banner sv-banner--error" role="alert">{error}</div>}

      {loading ? (
        <div style={{ display: 'grid', gap: '0.6rem' }} aria-busy="true">{[0, 1, 2, 3].map(i => <div key={i} className="sv-skeleton" style={{ height: 72 }} />)}</div>
      ) : data.results.length === 0 ? (
        <div className="wa-card wa-empty">
          <h3>{filters.section === 'active' ? 'No open requests' : filters.section === 'delivered' ? 'Nothing delivered yet' : 'No cancelled or declined requests'}</h3>
          <p>{filters.section === 'active' ? 'New quote requests from the site, or ones you record from phone calls, appear here.' : 'Requests move here automatically.'}</p>
        </div>
      ) : (
        <QuoteRequestList items={data.results} onOpen={setOpenId} groupByDate={filters.ordering.includes('created')} />
      )}

      {data.count > PAGE_SIZE && (
        <Pagination page={page} totalPages={Math.ceil(data.count / PAGE_SIZE)} totalItems={data.count} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}

      {openId && <AdminQuoteModal requestId={openId} sellers={sellers} onClose={() => setOpenId(null)} onChanged={refresh} />}
      {recording && <PhoneRequestModal offerings={offerings} onClose={() => setRecording(false)} onCreated={refresh} />}
    </div>
  );
}
