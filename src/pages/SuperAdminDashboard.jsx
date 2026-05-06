import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, Users, IndianRupee, Truck, CheckCircle, Clock, LayoutDashboard, Store, Mail, Phone, ChevronRight, ChevronDown, ChevronUp, User, Search } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, transit, delivered
  const [expandedSeller, setExpandedSeller] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sellerSearchTerm, setSellerSearchTerm] = useState('');
  const [isSellerTableMinimized, setIsSellerTableMinimized] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    // Check if user is staff or admin
    if (!user || !user.is_superuser) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await api.get('/analytics/super-admin/dashboard/');
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  const authorizeSeller = async (sellerId) => {
    try {
      await api.post(`/analytics/super-admin/authorize-grower/${sellerId}/`);
      // Update local state by removing from pending list
      setData(prev => ({
        ...prev,
        sellers: prev.sellers.filter(s => s.id !== sellerId)
      }));
    } catch (err) {
      console.error("Failed to authorize seller:", err);
      alert("Failed to authorize seller. Please try again.");
    }
  };

  const rejectSeller = async (sellerId) => {
    if (!window.confirm("Are you sure you want to reject this grower application?")) return;
    try {
      await api.post(`/analytics/super-admin/reject-grower/${sellerId}/`);
      // Update local state by removing from pending list
      setData(prev => ({
        ...prev,
        sellers: prev.sellers.filter(s => s.id !== sellerId)
      }));
    } catch (err) {
      console.error("Failed to reject seller:", err);
      alert("Failed to reject seller. Please try again.");
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  const { overall_analytics, sellers, orders } = data;

  const filteredSellers = sellers.filter(s => 
    !s.is_verified &&
    ((s.store_name?.toLowerCase() || '').includes(sellerSearchTerm.toLowerCase()) ||
    (s.name?.toLowerCase() || '').includes(sellerSearchTerm.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(sellerSearchTerm.toLowerCase()) ||
    (s.phone || '').includes(sellerSearchTerm))
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-sans)', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LayoutDashboard size={24} color="var(--brand-gold)" />
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Super Admin Portal</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/super-admin/gst')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
              GST INVOICES
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name || user?.username}</span>
            <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
              EXIT
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Analytics Summary */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Monthly Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Revenue (Month)', value: `₹${overall_analytics.revenue_this_month.toLocaleString()}`, icon: <IndianRupee size={24} />, color: 'var(--brand-gold)' },
              { title: 'Orders (Month)', value: overall_analytics.orders_this_month, icon: <Package size={24} />, color: 'var(--brand-green)' },
              { title: 'Active Sellers', value: overall_analytics.total_sellers, icon: <Store size={24} />, color: '#3b82f6' },
              { title: 'Total Collectors', value: overall_analytics.total_users, icon: <Users size={24} />, color: '#8b5cf6' },
            ].map((stat, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0' }}>{stat.title}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-deep)', margin: 0 }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sellers Overview */}
        <section>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Pending Sellers</h2>
              <button 
                onClick={() => setIsSellerTableMinimized(!isSellerTableMinimized)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem' }}
              >
                {isSellerTableMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>
            {!isSellerTableMinimized && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input 
                  type="text" 
                  placeholder="Search sellers..." 
                  value={sellerSearchTerm}
                  onChange={(e) => setSellerSearchTerm(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: isMobile ? '100%' : '250px', fontSize: '0.9rem' }}
                />
              </div>
            )}
          </div>
          
          {!isSellerTableMinimized && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredSellers.map(seller => (
                  <div key={seller.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div 
                      onClick={() => setExpandedSeller(expandedSeller === seller.id ? null : seller.id)}
                      style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedSeller === seller.id ? '#f8fafc' : 'white' }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{seller.store_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>{seller.total_orders}</span> orders • <span style={{ fontWeight: 700, color: 'var(--brand-green)' }}>₹{seller.total_revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {expandedSeller === seller.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    {expandedSeller === seller.id && (
                      <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                          {seller.is_verified ? (
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Verified</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Pending</span>
                              <button onClick={(e) => { e.stopPropagation(); authorizeSeller(seller.id); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                                Authorize
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); rejectSeller(seller.id); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <User size={14} /> <span style={{ color: 'var(--text-primary)' }}>{seller.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Mail size={14} /> <span style={{ color: 'var(--text-primary)' }}>{seller.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Phone size={14} /> <span style={{ color: 'var(--text-primary)' }}>{seller.phone || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredSellers.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No sellers found matching "{sellerSearchTerm}".</div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller / Store</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Contact</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700, textAlign: 'right' }}>Total Orders</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700, textAlign: 'right' }}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSellers.map(seller => (
                      <tr key={seller.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seller.store_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{seller.name}</div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}><Mail size={12} /> {seller.email}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><Phone size={12} /> {seller.phone || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          {seller.is_verified ? (
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Verified</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Pending</span>
                              <button onClick={(e) => { e.stopPropagation(); authorizeSeller(seller.id); }} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                                Authorize
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); rejectSeller(seller.id); }} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 600 }}>{seller.total_orders}</td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 700, color: 'var(--brand-green)' }}>₹{seller.total_revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredSellers.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No sellers found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </section>

        {/* Orders Management */}
        <section>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Orders Management</h2>
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', overflowX: 'auto', width: isMobile ? '100%' : 'auto' }}>
              {[
                { id: 'pending', label: 'Pending', icon: <Clock size={14} />, count: orders.pending.length },
                { id: 'transit', label: 'In Transit', icon: <Truck size={14} />, count: orders.transit.length },
                { id: 'delivered', label: 'Delivered', icon: <CheckCircle size={14} />, count: orders.delivered.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
                    backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                    color: activeTab === tab.id ? 'var(--bg-deep)' : 'var(--text-secondary)',
                    boxShadow: activeTab === tab.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.icon} {tab.label} <span style={{ backgroundColor: activeTab === tab.id ? 'var(--bg-secondary)' : '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem' }}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {orders[activeTab].map(order => (
                  <div key={order.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div 
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedOrder === order.id ? '#f8fafc' : 'white' }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>#{order.order_number}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{
                            backgroundColor: activeTab === 'pending' ? '#fef3c7' : activeTab === 'transit' ? '#e0f2fe' : '#dcfce7',
                            color: activeTab === 'pending' ? '#92400e' : activeTab === 'transit' ? '#0369a1' : '#166534',
                            padding: '0.2rem 0.5rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase'
                          }}>
                            {order.status}
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{parseFloat(order.total_amount).toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    {expandedOrder === order.id && (
                      <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Clock size={14} /> <span style={{ color: 'var(--text-primary)' }}>{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <User size={14} /> <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{order.user__phone || order.guest_phone || order.user__email || order.guest_email || 'Unknown'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Store size={14} /> <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>Seller: {order.seller_name} ({order.seller_contact})</span>
                        </div>
                        <button 
                          onClick={() => navigate(`/orders/${order.id}`)}
                          style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {orders[activeTab].length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders in this category.</div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Order ID</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Customer</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller Contact</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders[activeTab].map(order => (
                      <tr key={order.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => navigate(`/orders/${order.id}`)}>
                        <td style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>#{order.order_number}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.user__phone || order.guest_phone || order.user__email || order.guest_email || 'Unknown'}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.seller_name}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.seller_contact}</td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{
                            backgroundColor: activeTab === 'pending' ? '#fef3c7' : activeTab === 'transit' ? '#e0f2fe' : '#dcfce7',
                            color: activeTab === 'pending' ? '#92400e' : activeTab === 'transit' ? '#0369a1' : '#166534',
                            padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase'
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(order.total_amount).toLocaleString()}</td>
                      </tr>
                    ))}
                    {orders[activeTab].length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders in this category.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
