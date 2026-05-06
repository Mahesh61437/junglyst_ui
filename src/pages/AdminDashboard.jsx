import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LayoutDashboard, Users, Package, ShoppingBag, Settings, 
  TrendingUp, ShieldCheck, UserCheck, Plus, X, Loader2,
  BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
  ArrowLeft, ExternalLink, Trash2, Mail, Phone, Search
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [allowedSellers, setAllowedSellers] = useState([]);
  const [newAllowed, setNewAllowed] = useState({ email: '', phone: '' });
  const [addingAllowed, setAddingAllowed] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.is_superuser) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, allowedRes] = await Promise.all([
        api.get('/analytics/dashboard/'),
        api.get('/sellers/profiles/admin/allowed/').catch(() => ({ data: [] }))
      ]);
      setData(statsRes.data);
      setAllowedSellers(allowedRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
      setError("Failed to load platform analytics.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllowed = async (e) => {
    e.preventDefault();
    setAddingAllowed(true);
    try {
      await api.post('/sellers/profiles/admin/allowed/', newAllowed);
      setSuccess("Curator added to registry successfully");
      setNewAllowed({ email: '', phone: '' });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add curator");
    } finally {
      setAddingAllowed(false);
    }
  };

  const handleRemoveAllowed = async (id) => {
    if (!window.confirm("Remove this curator from the registry?")) return;
    try {
      await api.delete(`/sellers/profiles/admin/allowed/${id}/`);
      setSuccess("Curator removed from registry");
      fetchDashboardData();
    } catch (err) {
      setError("Failed to remove curator");
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={40} color="#0A3029" />
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8faf9' }}>
      {/* Admin Sidebar */}
      <aside style={{ width: '280px', backgroundColor: '#0A3029', color: 'white', padding: '3rem 2rem', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
          <ShieldCheck size={24} color="#E5C48B" />
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif' }}>Superadmin</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { id: 'overview', label: 'Platform Overview', icon: <LayoutDashboard size={20} /> },
            { id: 'sellers', label: 'Curator Registry', icon: <UserCheck size={20} /> },
            { id: 'orders', label: 'Global Orders', icon: <ShoppingBag size={20} /> },
            { id: 'settings', label: 'System Settings', icon: <Settings size={20} /> }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.5rem', 
                borderRadius: '12px', border: 'none', 
                backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', textAlign: 'left', fontWeight: 600, transition: 'all 0.2s'
              }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <a href="/admin/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem' }}>
            <ExternalLink size={18} /> Advanced Django Admin
          </a>
        </div>
      </aside>

      <main style={{ flexGrow: 1, padding: '4rem 5rem' }}>
        <header style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', fontFamily: 'serif' }}>{activeTab === 'overview' ? 'Platform Analytics' : 'Curator Registry'}</h1>
          <p style={{ color: '#64748b' }}>Master control for Junglyst Botanical Marketplace</p>
        </header>

        {activeTab === 'overview' && data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
              {[
                { label: 'Total Revenue', value: `₹${data.platform_stats.total_revenue.toLocaleString()}`, icon: <TrendingUp size={20} />, color: '#10b981' },
                { label: 'Verified Sellers', value: data.platform_stats.total_sellers, icon: <UserCheck size={20} />, color: '#6366f1' },
                { label: 'Global Orders', value: data.platform_stats.total_orders, icon: <ShoppingBag size={20} />, color: '#f59e0b' },
                { label: 'Botanical Listings', value: data.platform_stats.total_products, icon: <Package size={20} />, color: '#065f46' }
              ].map((stat, idx) => (
                <div key={idx} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #edf2ed' }}>
                  <div style={{ color: stat.color, marginBottom: '1rem' }}>{stat.icon}</div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'serif', marginTop: '0.5rem' }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
               <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '2rem' }}>Recent Platform Orders</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {data.recent_orders.map((order, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '16px', backgroundColor: '#fcfdfc' }}>
                        <div>
                          <p style={{ fontWeight: 700 }}>Order {order.order_number}</p>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 700 }}>₹{order.total_amount}</p>
                          <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', borderRadius: '20px', backgroundColor: '#e2e8f0', color: '#475569', textTransform: 'uppercase', fontWeight: 800 }}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '2rem' }}>Order Distribution</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pending', value: data.order_distribution.pending },
                            { name: 'Processing', value: data.order_distribution.processing },
                            { name: 'Shipped', value: data.order_distribution.shipped },
                            { name: 'Delivered', value: data.order_distribution.delivered }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#f59e0b" />
                          <Cell fill="#6366f1" />
                          <Cell fill="#10b981" />
                          <Cell fill="#065f46" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sellers' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {/* Add Allowed Seller Form */}
            <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'serif', marginBottom: '2rem' }}>Authorize New Curator</h3>
              <form onSubmit={handleAddAllowed} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Curator Email</label>
                  <input 
                    type="email" 
                    value={newAllowed.email}
                    onChange={(e) => setNewAllowed({...newAllowed, email: e.target.value})}
                    placeholder="curator@sanctuary.com"
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Mobile Number</label>
                  <input 
                    type="text" 
                    value={newAllowed.phone}
                    onChange={(e) => setNewAllowed({...newAllowed, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <button 
                  disabled={addingAllowed}
                  style={{ backgroundColor: '#0A3029', color: 'white', border: 'none', borderRadius: '12px', padding: '1rem 2rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {addingAllowed ? 'Authorizing...' : 'Add to Registry'}
                </button>
              </form>
            </div>

            {/* Allowed Sellers List */}
            <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#fcfdfc', borderBottom: '1px solid #edf2ed' }}>
                  <tr>
                    <th style={{ padding: '1.5rem 2rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Identity</th>
                    <th style={{ padding: '1.5rem 2rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '1.5rem 2rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Authorized Date</th>
                    <th style={{ padding: '1.5rem 2rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allowedSellers.map(curator => (
                    <tr key={curator.id} style={{ borderBottom: '1px solid #f8faf9' }}>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={18} color="#0A3029" />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700 }}>{curator.email || 'No Email'}</p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{curator.phone || 'No Phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', borderRadius: '20px', backgroundColor: curator.is_active ? '#ecfdf5' : '#fef2f2', color: curator.is_active ? '#059669' : '#dc2626', fontWeight: 800 }}>
                          {curator.is_active ? 'ACTIVE REGISTRY' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '1.5rem 2rem', fontSize: '0.9rem', color: '#64748b' }}>
                        {new Date(curator.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleRemoveAllowed(curator.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {(success || error) && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ 
              position: 'fixed', bottom: '2rem', right: '2rem', 
              backgroundColor: error ? '#ef4444' : '#0A3029', color: 'white', 
              padding: '1rem 2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 1000,
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}
          >
            {error ? <X size={18} /> : <ShieldCheck size={18} />}
            {success || error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
