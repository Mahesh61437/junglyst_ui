import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Truck, Package, CheckCircle, Clock, Search, ArrowLeft } from 'lucide-react';

const STATUS_META = {
  pending: { label: 'Pending Payment', color: '#6b7280', bg: '#f3f4f6' },
  placed: { label: 'Order Placed', color: '#1d4ed8', bg: '#dbeafe' },
  confirmed: { label: 'Confirmed', color: '#854d0e', bg: '#fef9c3' },
  packing: { label: 'Being Packed', color: '#c2410c', bg: '#fff7ed' },
  shipped: { label: 'Shipped', color: '#065f46', bg: '#d1fae5' },
  in_transit: { label: 'In Transit', color: '#065f46', bg: '#d1fae5' },
  out_for_delivery: { label: 'Out for Delivery', color: '#14532d', bg: '#dcfce7' },
  delivered: { label: 'Delivered', color: '#14532d', bg: '#dcfce7' },
  delivery_failed: { label: 'Delivery Failed', color: '#991b1b', bg: '#fee2e2' },
  doa_raised: { label: 'DOA Raised', color: '#9d174d', bg: '#fce7f3' },
  cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fee2e2' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: '#4b5563', bg: '#f3f4f6' };
  return (
    <span style={{
      padding: '0.28rem 0.65rem', borderRadius: '20px',
      fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
      backgroundColor: m.bg, color: m.color, whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
}

function StatusIcon({ status }) {
  if (['delivered'].includes(status)) return <CheckCircle size={14} color="#10b981" />;
  if (['shipped', 'in_transit', 'out_for_delivery'].includes(status)) return <Truck size={14} color="#f59e0b" />;
  if (['confirmed', 'packing'].includes(status)) return <Clock size={14} color="#f59e0b" />;
  return <Package size={14} color="#94a3b8" />;
}

function SubOrderCard({ so }) {
  const shipment = so.shipment;
  return (
    <div style={{
      backgroundColor: '#f8faf8', borderRadius: '14px',
      padding: 'clamp(1rem,2.5vw,1.25rem) clamp(1.25rem,3vw,1.5rem)',
      border: '1px solid #edf2ed',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(0.75rem,2vw,0.85rem)', color: '#1b2d2a' }}>{so.sub_order_number}</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: 'clamp(0.65rem,1.8vw,0.7rem)', color: '#64748b' }}>{so.seller_name}</p>
        </div>
        <StatusBadge status={so.status} />
      </div>

      {so.items && so.items.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem',
          padding: 'clamp(0.5rem,1.5vw,0.75rem)',
          backgroundColor: 'white', borderRadius: '8px', border: '1px solid #edf2ed',
        }}>
          {so.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'clamp(0.7rem,1.8vw,0.75rem)' }}>
              {item.product_image && (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, border: '1px solid #edf2ed' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#1b2d2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: 'clamp(0.6rem,1.5vw,0.65rem)', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.variant_name}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1b2d2a' }}>×{item.quantity}</p>
                <p style={{ margin: '0.1rem 0 0', color: '#64748b', fontSize: 'clamp(0.65rem,1.8vw,0.7rem)' }}>₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {so.awb_number && (
        <div style={{
          marginBottom: '0.75rem',
          padding: 'clamp(0.5rem,1.5vw,0.75rem)',
          backgroundColor: 'white', borderRadius: '8px', border: '1px solid #d1fae5',
        }}>
          <p style={{ margin: '0 0 0.3rem', fontSize: 'clamp(0.6rem,1.5vw,0.65rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            AWB Number
          </p>
          <p style={{ margin: 0, fontSize: 'clamp(0.75rem,2vw,0.85rem)', fontWeight: 700, color: '#1b2d2a', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {so.awb_number}
          </p>
          {so.courier_name && (
            <p style={{ margin: '0.25rem 0 0', fontSize: 'clamp(0.65rem,1.8vw,0.7rem)', color: '#64748b' }}>
              via {so.courier_name}
            </p>
          )}
        </div>
      )}

      {shipment?.tracking_url && (
        <a
          href={shipment.tracking_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem',
            fontSize: 'clamp(0.7rem,1.8vw,0.75rem)', fontWeight: 700, color: '#1b2d2a',
            textDecoration: 'none', padding: 'clamp(0.35rem,1vw,0.4rem) clamp(0.75rem,2vw,0.9rem)',
            border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: 'white',
          }}
        >
          <Truck size={13} /> Track with Courier
        </a>
      )}
    </div>
  );
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter an order number');
      return;
    }
    setLoading(true);
    setError(null);
    setOrderData(null);
    try {
      const response = await api.get(`/orders/track/?order_number=${encodeURIComponent(orderNumber.trim())}`);
      setOrderData(response.data);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found. Please check the order number and try again.');
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const steps = orderData
    ? [
        { label: 'Order Placed', status: 'placed', icon: <Package size={18} />, active: true },
        { label: 'Processing', status: 'processing', icon: <Clock size={18} />, active: ['processing', 'shipped', 'delivered', 'in_transit', 'out_for_delivery'].includes(orderData.status) },
        { label: 'In Transit', status: 'shipped', icon: <Truck size={18} />, active: ['shipped', 'delivered', 'in_transit', 'out_for_delivery'].includes(orderData.status) },
        { label: 'Delivered', status: 'delivered', icon: <CheckCircle size={18} />, active: orderData.status === 'delivered' },
      ]
    : [];

  return (
    <div className="container" style={{ padding: 'clamp(2rem,5vw,4rem) 1rem clamp(5rem,10vw,10rem)' }}>
      {/* Back button */}
      <div style={{ marginBottom: 'clamp(1.5rem,4vw,3rem)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.68rem', fontWeight: 800, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <ArrowLeft size={13} /> Go Back
        </button>
      </div>

      {/* Search Section */}
      <div style={{ marginBottom: '4rem' }}>
        <section style={{
          backgroundColor: 'white',
          padding: 'clamp(1.5rem,4vw,3rem)',
          borderRadius: '32px', border: '1px solid #f1f5f9',
        }}>
          <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
            Track Your Order
          </h1>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: 'clamp(0.85rem,2vw,0.95rem)' }}>
            Enter your order number to view real-time tracking information and shipment details.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter order number (e.g., JNG-2026-ABCDE)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                style={{
                  width: '100%', padding: 'clamp(0.75rem,2vw,1rem) clamp(1rem,2.5vw,1.5rem)',
                  fontSize: 'clamp(0.85rem,2vw,0.95rem)',
                  border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none',
                  fontFamily: 'monospace', transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand-gold)')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: '1 1 120px',
                padding: 'clamp(0.75rem,2vw,1rem) clamp(1.5rem,3vw,2.5rem)',
                backgroundColor: 'var(--bg-deep)', color: 'white',
                border: 'none', borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 'clamp(0.8rem,2vw,0.9rem)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.2s', opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Search size={16} /> Track
            </button>
          </form>

          {error && searched && (
            <div style={{
              marginTop: '1.5rem', padding: 'clamp(0.75rem,2vw,1rem)',
              backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: '12px', color: '#991b1b', fontSize: 'clamp(0.8rem,2vw,0.9rem)',
            }}>
              {error}
            </div>
          )}
        </section>
      </div>

      {/* Results Section */}
      {searched && orderData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 'clamp(2rem,4vw,4rem)',
          alignItems: 'start',
        }}>
          {/* Tracking Details */}
          <div className="slide-up">
            <section style={{
              backgroundColor: 'white',
              padding: 'clamp(1.5rem,4vw,3.5rem)',
              borderRadius: '32px', border: '1px solid #f1f5f9', marginBottom: '3rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'clamp(2rem,5vw,4rem)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.3rem,3.5vw,2rem)', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
                    Tracking Details
                  </h2>
                  <p style={{ color: '#64748b', fontWeight: 600, fontSize: 'clamp(0.8rem,2vw,1rem)' }}>Reference: #{orderData.order_number}</p>
                </div>
                <StatusBadge status={orderData.status} />
              </div>

              {/* Progress Steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 'clamp(4rem,8vw,6rem)' }}>
                <div style={{ position: 'absolute', top: 'clamp(18px,3vw,24px)', left: 0, right: 0, height: '2px', backgroundColor: '#f1f5f9', zIndex: 0 }} />
                {steps.map((step, idx) => (
                  <div key={idx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: 'clamp(36px,6vw,50px)', height: 'clamp(36px,6vw,50px)',
                      borderRadius: '50%',
                      backgroundColor: step.active ? 'var(--bg-deep)' : 'white',
                      border: step.active ? 'none' : '2px solid #f1f5f9',
                      color: step.active ? 'white' : '#cbd5e1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '0.75rem', transition: 'all 0.3s ease',
                    }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 'clamp(0.58rem,1.5vw,0.7rem)', fontWeight: 800, textTransform: 'uppercase', color: step.active ? 'var(--bg-deep)' : '#94a3b8' }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,140px),1fr))', gap: '2rem', padding: '2rem 0', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: 'clamp(0.6rem,1.5vw,0.65rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Total Items
                  </p>
                  <p style={{ margin: 0, fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: 800, color: '#1b2d2a' }}>
                    {orderData.total_quantity}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: 'clamp(0.6rem,1.5vw,0.65rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Payment Status
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: orderData.payment_status.is_paid ? '#10b981' : '#f59e0b' }} />
                    <span style={{ fontSize: 'clamp(0.8rem,2vw,0.9rem)', fontWeight: 700, color: '#1b2d2a' }}>
                      {orderData.payment_status.is_paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Sub-orders */}
            {orderData.sub_orders && orderData.sub_orders.length > 0 && (
              <section>
                <h3 style={{ fontSize: 'clamp(1rem,2.5vw,1.2rem)', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>
                  Shipments ({orderData.sub_orders.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orderData.sub_orders.map((so) => (
                    <SubOrderCard key={so.id} so={so} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Info Panel */}
          <div className="slide-up" style={{ animationDelay: '0.1s' }}>
            <section style={{
              backgroundColor: '#f8faf8',
              padding: 'clamp(1.5rem,3vw,2.5rem)',
              borderRadius: '24px', border: '1px solid #edf2ed',
              position: 'sticky', top: '100px',
            }}>
              <h4 style={{ fontSize: 'clamp(0.9rem,2vw,1rem)', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', color: '#1b2d2a' }}>
                Tracking Information
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  { label: 'Order Number', content: <p style={{ margin: 0, fontSize: 'clamp(0.85rem,2vw,1rem)', fontWeight: 700, color: '#1b2d2a', fontFamily: 'monospace', wordBreak: 'break-all' }}>{orderData.order_number}</p> },
                  { label: 'Order Date', content: <p style={{ margin: 0, fontSize: 'clamp(0.85rem,2vw,0.95rem)', fontWeight: 600, color: '#1b2d2a' }}>{new Date(orderData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p> },
                  { label: 'Current Status', content: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <StatusIcon status={orderData.status} />
                      <span style={{ fontSize: 'clamp(0.8rem,2vw,0.9rem)', fontWeight: 700, textTransform: 'capitalize', color: '#1b2d2a' }}>
                        {orderData.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ) },
                  { label: 'Shipments', content: (
                    <>
                      <p style={{ margin: 0, fontSize: 'clamp(1rem,2.5vw,1.2rem)', fontWeight: 800, color: '#1b2d2a' }}>{orderData.sub_orders?.length || 0}</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: 'clamp(0.65rem,1.8vw,0.7rem)', color: '#64748b' }}>
                        {orderData.sub_orders?.length === 1 ? 'from seller' : 'from different sellers'}
                      </p>
                    </>
                  ) },
                ].map(({ label, content }) => (
                  <div key={label} style={{ padding: 'clamp(0.75rem,2vw,1rem)', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: 'clamp(0.6rem,1.5vw,0.65rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                      {label}
                    </p>
                    {content}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {searched && !orderData && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
          <Package size={48} style={{ color: '#e2e8f0', margin: '0 auto 2rem', display: 'block' }} />
          <h3 style={{ fontSize: 'clamp(1.1rem,2.5vw,1.3rem)', fontWeight: 700, marginBottom: '1rem', color: '#1b2d2a' }}>
            No Results Found
          </h3>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: 'clamp(0.85rem,2vw,0.95rem)' }}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
