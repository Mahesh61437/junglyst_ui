import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ClipboardList, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ServiceQuoteService } from '../services/ServiceQuoteService';
import AdminQuoteQueue from '../components/services/AdminQuoteQueue';
import AdminCatalogue from '../components/services/AdminCatalogue';
import './SuperAdminWorkshops.css';
import './Services.css';

const TABS = [
  { id: 'requests', label: 'Quote requests', icon: <ClipboardList size={15} /> },
  { id: 'catalogue', label: 'Groups & services', icon: <Layers size={15} /> },
];

export default function SuperAdminServices() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'requests';
  const [groups, setGroups] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [error, setError] = useState(null);
  const isSuperAdmin = Boolean(user?.is_superuser);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) navigate('/', { replace: true });
  }, [authLoading, isSuperAdmin, navigate]);

  const loadCatalogue = useCallback(() => (
    Promise.all([ServiceQuoteService.admin.groups(), ServiceQuoteService.admin.offerings(), ServiceQuoteService.admin.sellers()])
      .then(([groupList, offeringList, sellerList]) => { setGroups(groupList); setOfferings(offeringList); setSellers(sellerList); setError(null); })
      .catch(() => setError('Could not load the service catalogue. Please refresh.'))
  ), []);

  useEffect(() => { if (isSuperAdmin) loadCatalogue(); }, [isSuperAdmin, loadCatalogue]);

  const setTab = (id) => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', id); return next; }, { replace: true });

  if (authLoading || !isSuperAdmin) return null;

  return (
    <div className="wa-page">
      <div className="wa-shell">
        <div className="wa-header">
          <div>
            <button type="button" className="wa-back" onClick={() => navigate('/super-admin')}><ArrowLeft size={14} /> Super admin</button>
            <h1>Custom orders</h1>
            <p className="wa-sub">Set up service groups, review quote requests, assign sellers and send pay requests.</p>
          </div>
        </div>

        <div className="wa-tabs" role="tablist" aria-label="Custom order sections">
          {TABS.map(t => (
            <button key={t.id} type="button" role="tab" className="wa-tab" aria-selected={activeTab === t.id} onClick={() => setTab(t.id)}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {error && <div className="wa-banner wa-banner--error" role="alert"><AlertCircle size={16} />{error}</div>}

        {activeTab === 'requests' && <AdminQuoteQueue groups={groups} offerings={offerings} sellers={sellers} />}
        {activeTab === 'catalogue' && <AdminCatalogue groups={groups} offerings={offerings} onChanged={loadCatalogue} />}
      </div>
    </div>
  );
}
