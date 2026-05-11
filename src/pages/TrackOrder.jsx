import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Truck, Package, CheckCircle, Clock, Search, ArrowLeft, MapPin, ExternalLink } from 'lucide-react';

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
    <span style={{ padding: window.innerWidth <= 640 ? '0.25rem 0.6rem' : '0.3rem 0.7rem', borderRadius: '20px', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, textTransform: 'uppercase', backgroundColor: m.bg, color: m.color, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

function StatusIcon({ status }) {
  const size = window.innerWidth <= 640 ? 12 : 15;
  if (['delivered'].includes(status)) return <CheckCircle size={size} color="#10b981" />;
  if (['shipped', 'in_transit', 'out_for_delivery'].includes(status)) return <Truck size={size} color="#f59e0b" />;
  if (['confirmed', 'packing'].includes(status)) return <Clock size={size} color="#f59e0b" />;
  return <Package size={size} color="#94a3b8" />;
}

function SubOrderCard({ so }) {
  const shipment = so.shipment;
  return (
    <div style={{ backgroundColor: '#f8faf8', borderRadius: '14px', padding: window.innerWidth <= 640 ? '1rem 1.25rem' : '1.25rem 1.5rem', border: '1px solid #edf2ed' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: window.innerWidth <= 640 ? '0.75rem' : '0.85rem', color: '#1b2d2a' }}>{so.sub_order_number}</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: window.innerWidth <= 640 ? '0.65rem' : '0.7rem', color: '#64748b' }}>
            {so.seller_name}
          </p>
        </div>
        <StatusBadge status={so.status} />
      </div>

      {/* Items list */}
      {so.items && so.items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', padding: window.innerWidth <= 640 ? '0.5rem' : '0.75rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #edf2ed' }}>
          {so.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', fontSize: window.innerWidth <= 640 ? '0.7rem' : '0.75rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#1b2d2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.variant_name}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1b2d2a' }}>×{item.quantity}</p>
                <p style={{ margin: '0.1rem 0 0', color: '#64748b', fontSize: window.innerWidth <= 640 ? '0.65rem' : '0.7rem' }}>₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AWB & Courier info */}
      {so.awb_number && (
        <div style={{ marginBottom: '0.75rem', padding: window.innerWidth <= 640 ? '0.5rem' : '0.75rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #d1fae5' }}>
          <p style={{ margin: '0 0 0.3rem', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            AWB Number
          </p>
          <p style={{ margin: 0, fontSize: window.innerWidth <= 640 ? '0.75rem' : '0.85rem', fontWeight: 700, color: '#1b2d2a', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {so.awb_number}
          </p>
          {so.courier_name && (
            <p style={{ margin: '0.25rem 0 0', fontSize: window.innerWidth <= 640 ? '0.65rem' : '0.7rem', color: '#64748b' }}>
              via {so.courier_name}
            </p>
          )}
        </div>
      )}

      {/* Shipment tracking link */}
      {shipment?.tracking_url && (
        <a
          href={shipment.tracking_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.75rem',
            fontSize: window.innerWidth <= 640 ? '0.7rem' : '0.75rem',
            fontWeight: 700,
            color: '#1b2d2a',
            textDecoration: 'none',
            padding: window.innerWidth <= 640 ? '0.35rem 0.75rem' : '0.4rem 0.9rem',
            border: '1px solid #d1fae5',
            borderRadius: '8px',
            backgroundColor: 'white',
          }}
        >
          <Truck size={window.innerWidth <= 640 ? 12 : 13} /> Track with Courier
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
        { label: 'Order Placed', status: 'placed', icon: <Package size={20} />, active: true },
        { label: 'Processing', status: 'processing', icon: <Clock size={20} />, active: ['processing', 'shipped', 'delivered', 'in_transit', 'out_for_delivery'].includes(orderData.status) },
        { label: 'In Transit', status: 'shipped', icon: <Truck size={20} />, active: ['shipped', 'delivered', 'in_transit', 'out_for_delivery'].includes(orderData.status) },
        { label: 'Delivered', status: 'delivered', icon: <CheckCircle size={20} />, active: orderData.status === 'delivered' },
      ]
    : [];

  return (
    <div className="container" style={{ padding: window.innerWidth <= 640 ? '2rem 1rem 6rem' : '4rem 1rem 10rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: window.innerWidth <= 640 ? '1.5rem' : '3rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: window.innerWidth <= 640 ? '0.65rem' : '0.7rem',
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={window.innerWidth <= 640 ? 12 : 14} /> Go Back
        </button>
      </div>

      {/* Search Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', marginBottom: '4rem' }}>
        <section style={{ backgroundColor: 'white', padding: window.innerWidth <= 640 ? '1.5rem' : '3rem', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
          <h1 style={{ fontSize: window.innerWidth <= 640 ? '1.5rem' : '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
            Track Your Order
          </h1>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: window.innerWidth <= 640 ? '0.85rem' : '0.95rem' }}>
            Enter your order number to view real-time tracking information and shipment details.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexDirection: window.innerWidth <= 640 ? 'column' : 'row' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter order number (e.g., JNG-2026-ABCDE)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 640 ? '0.75rem 1rem' : '1rem 1.5rem',
                  fontSize: window.innerWidth <= 640 ? '0.85rem' : '0.95rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  outline: 'none',
                  fontFamily: 'monospace',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand-gold)')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: window.innerWidth <= 640 ? '0.75rem 1.5rem' : '1rem 2.5rem',
                backgroundColor: 'var(--bg-deep)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: window.innerWidth <= 640 ? '0.8rem' : '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1,
                width: window.innerWidth <= 640 ? '100%' : 'auto',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Search size={16} /> Track
            </button>
          </form>

          {error && searched && (
            <div style={{ marginTop: '1.5rem', padding: window.innerWidth <= 640 ? '0.75rem' : '1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', color: '#991b1b', fontSize: window.innerWidth <= 640 ? '0.8rem' : '0.9rem' }}>
              {error}
            </div>
          )}
        </section>
      </div>

      {/* Results Section */}
      {searched && orderData && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1.5fr 1fr', gap: window.innerWidth <= 768 ? '2rem' : '4rem', alignItems: 'start' }}>
          {/* Tracking Details (Left) */}
          <div className="slide-up">
            <section style={{ backgroundColor: 'white', padding: window.innerWidth <= 640 ? '1.5rem' : '3.5rem', borderRadius: '32px', border: '1px solid #f1f5f9', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: window.innerWidth <= 640 ? '2rem' : '4rem', flexDirection: window.innerWidth <= 640 ? 'column' : 'row', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: window.innerWidth <= 640 ? '1.3rem' : '2rem', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
                    Tracking Details
                  </h2>
                  <p style={{ color: '#64748b', fontWeight: 600, fontSize: window.innerWidth <= 640 ? '0.8rem' : '1rem' }}>Reference: #{orderData.order_number}</p>
                </div>
                <div style={{ textAlign: window.innerWidth <= 640 ? 'left' : 'right' }}>
                  <StatusBadge status={orderData.status} />
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: window.innerWidth <= 640 ? '4rem' : '6rem', flexWrap: window.innerWidth <= 640 ? 'wrap' : 'nowrap' }}>
                <div style={{ position: 'absolute', top: window.innerWidth <= 640 ? '18px' : '24px', left: '0', right: '0', height: '2px', backgroundColor: '#f1f5f9', zIndex: 0 }} />
                {steps.map((step, idx) => (
                  <div key={idx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, marginBottom: window.innerWidth <= 640 ? '0.5rem' : 0 }}>
                    <div
                      style={{
                        width: window.innerWidth <= 640 ? '36px' : '50px',
                        height: window.innerWidth <= 640 ? '36px' : '50px',
                        borderRadius: '50%',
                        backgroundColor: step.active ? 'var(--bg-deep)' : 'white',
                        border: step.active ? 'none' : '2px solid #f1f5f9',
                        color: step.active ? 'white' : '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.75rem',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {step.icon}
                    </div>
                    <span style={{ fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: step.active ? 'var(--bg-deep)' : '#94a3b8' }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 640 ? '1fr' : '1fr 1fr', gap: '2rem', padding: '2rem 0', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Total Items
                  </p>
                  <p style={{ margin: 0, fontSize: window.innerWidth <= 640 ? '1.2rem' : '1.5rem', fontWeight: 800, color: '#1b2d2a' }}>
                    {orderData.total_quantity}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Payment Status
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: orderData.payment_status.is_paid ? '#10b981' : '#f59e0b',
                      }}
                    />
                    <span style={{ fontSize: window.innerWidth <= 640 ? '0.8rem' : '0.9rem', fontWeight: 700, color: '#1b2d2a' }}>
                      {orderData.payment_status.is_paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Order Items */}
            {orderData.items && orderData.items.length > 0 && (
              <section style={{ backgroundColor: 'white', padding: window.innerWidth <= 640 ? '1.25rem' : '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', marginBottom: '3rem' }}>
                <h3 style={{ fontSize: window.innerWidth <= 640 ? '1rem' : '1.2rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>
                  Order Items ({orderData.items.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orderData.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth <= 640 ? '0.75rem' : '1rem', padding: window.innerWidth <= 640 ? '0.75rem' : '1rem', backgroundColor: '#f8faf8', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          style={{
                            width: window.innerWidth <= 640 ? '45px' : '60px',
                            height: window.innerWidth <= 640 ? '45px' : '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #edf2ed',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: window.innerWidth <= 640 ? '0.8rem' : '0.9rem', color: '#1b2d2a' }}>
                          {item.product_name}
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: window.innerWidth <= 640 ? '0.7rem' : '0.8rem', color: '#94a3b8' }}>
                          {item.variant_name}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: window.innerWidth <= 640 ? '0.75rem' : '0.85rem', color: '#1b2d2a' }}>
                          Qty: {item.quantity}
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: window.innerWidth <= 640 ? '0.7rem' : '0.8rem', color: '#64748b' }}>
                          ₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sub-orders */}
            {orderData.sub_orders && orderData.sub_orders.length > 0 && (
              <section>
                <h3 style={{ fontSize: window.innerWidth <= 640 ? '1rem' : '1.2rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>
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

          {/* Info Panel (Right) */}
          <div className="slide-up" style={{ animationDelay: '0.1s' }}>
            <section style={{ backgroundColor: '#f8faf8', padding: window.innerWidth <= 640 ? '1.5rem' : '2.5rem', borderRadius: '24px', border: '1px solid #edf2ed', position: window.innerWidth <= 768 ? 'relative' : 'sticky', top: window.innerWidth <= 768 ? 'auto' : '100px' }}>
              <h4 style={{ fontSize: window.innerWidth <= 640 ? '0.9rem' : '1rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', color: '#1b2d2a' }}>
                Tracking Information
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: window.innerWidth <= 640 ? '0.75rem' : '1rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Order Number
                  </p>
                  <p style={{ margin: 0, fontSize: window.innerWidth <= 640 ? '0.85rem' : '1rem', fontWeight: 700, color: '#1b2d2a', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {orderData.order_number}
                  </p>
                </div>

                <div style={{ padding: window.innerWidth <= 640 ? '0.75rem' : '1rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Order Date
                  </p>
                  <p style={{ margin: 0, fontSize: window.innerWidth <= 640 ? '0.85rem' : '0.95rem', fontWeight: 600, color: '#1b2d2a' }}>
                    {new Date(orderData.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div style={{ padding: window.innerWidth <= 640 ? '0.75rem' : '1rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Current Status
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <StatusIcon status={orderData.status} />
                    <span style={{ fontSize: window.innerWidth <= 640 ? '0.8rem' : '0.9rem', fontWeight: 700, textTransform: 'capitalize', color: '#1b2d2a' }}>
                      {orderData.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div style={{ padding: window.innerWidth <= 640 ? '0.75rem' : '1rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: window.innerWidth <= 640 ? '0.6rem' : '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Shipments
                  </p>
                  <p style={{ margin: 0, fontSize: window.innerWidth <= 640 ? '1rem' : '1.2rem', fontWeight: 800, color: '#1b2d2a' }}>
                    {orderData.sub_orders?.length || 0}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: window.innerWidth <= 640 ? '0.65rem' : '0.7rem', color: '#64748b' }}>
                    {orderData.sub_orders?.length === 1 ? 'from seller' : 'from different sellers'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {searched && !orderData && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
          <Package size={48} style={{ color: '#e2e8f0', margin: '0 auto 2rem', display: 'block' }} />
          <h3 style={{ fontSize: window.innerWidth <= 640 ? '1.1rem' : '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#1b2d2a' }}>
            No Results Found
          </h3>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: window.innerWidth <= 640 ? '0.85rem' : '0.95rem' }}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
