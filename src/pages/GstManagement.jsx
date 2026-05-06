import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ItemizedInvoiceModal from '../components/ItemizedInvoiceModal';
import { FileText, ArrowLeft, Calendar, Store, IndianRupee, FileDown } from 'lucide-react';

export default function GstManagement() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.is_superuser) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/analytics/super-admin/gst-invoices/?month=${month}`);
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-sans)', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => navigate('/super-admin')}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={24} />
            </button>
            <FileText size={24} color="var(--brand-gold)" />
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0 }}>GST Invoices</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
              <Calendar size={18} />
              <input 
                type="month" 
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setData(null); // Reset data when month changes
                }}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem', fontWeight: 600, colorScheme: 'dark' }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              Generate
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Settled Payments GST - {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>1 Seller = 1 GST Invoice for the selected month</p>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Compiling invoices...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '16px' }}>
            <p style={{ fontWeight: 700 }}>Failed to load GST data</p>
            <p>{error}</p>
          </div>
        ) : !data ? (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={48} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Select a month and click Generate to view GST invoices.</p>
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            <FileText size={48} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No settled orders found for the selected month.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {data.map((seller) => (
              <div key={seller.seller_id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      <Store size={16} color="var(--brand-gold)" />
                      {seller.store_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{seller.seller_email}</div>
                  </div>
                  <div style={{ backgroundColor: '#e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    {seller.total_orders} Orders
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '0.25rem' }}>Gross Sales (Inc. GST)</p>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <IndianRupee size={24} /> {seller.gross_sales.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Taxable Value</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{seller.taxable_value.toLocaleString()}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total GST ({seller.gst_percentage}%)</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{seller.total_gst.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>CGST</span>
                      <span>₹{seller.cgst.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span>SGST</span>
                      <span>₹{seller.sgst.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Platform Fee</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>-₹{seller.platform_fee.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>GST on Platform Fee (18%)</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>-₹{seller.platform_fee_gst.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                      <span style={{ fontWeight: 600 }}>TCS (1% under GST)</span>
                      <span style={{ fontWeight: 800 }}>-₹{seller.tcs_deducted.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400e', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                      <span style={{ fontWeight: 600 }}>TDS (1% u/s 194-O)</span>
                      <span style={{ fontWeight: 800 }}>-₹{seller.tds_deducted.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-gold)', paddingTop: '0.25rem' }}>
                      <span style={{ fontWeight: 800 }}>Net Settlement</span>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{seller.net_settlement.toLocaleString()}</span>
                    </div>

                    <button 
                      onClick={() => setSelectedInvoiceData(seller)}
                      style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#334155', transition: 'background-color 0.2s' }}
                    >
                      <FileDown size={16} /> View Itemized Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ItemizedInvoiceModal 
        isOpen={!!selectedInvoiceData} 
        onClose={() => setSelectedInvoiceData(null)} 
        data={selectedInvoiceData} 
        month={month}
      />
    </div>
  );
}
