import { useState, useEffect } from 'react';
import { Link, useNavigate, useNavigationType } from 'react-router-dom';
import api from '../services/api';
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, ShoppingBag, MapPin, Eye } from 'lucide-react';
import { useScrollRestoration } from '../utils/useScrollRestoration';
import Pagination from '../components/Pagination';

// Covers both master Order statuses and sub-order SubOrderStatuses
const STATUS_META = {
  // Master order statuses
  pending:           { label: 'Pending Payment',    color: '#6b7280', bg: '#f3f4f6' },
  confirmed:         { label: 'Payment Confirmed',  color: '#1d4ed8', bg: '#dbeafe' },
  failed:            { label: 'Payment Failed',     color: '#991b1b', bg: '#fee2e2' },
  processing:        { label: 'Processing',         color: '#854d0e', bg: '#fef9c3' },
  // Sub-order statuses (overlap with master where applicable)
  placed:            { label: 'Order Received',     color: '#1d4ed8', bg: '#dbeafe' },
  packing:           { label: 'Being Packed',       color: '#c2410c', bg: '#fff7ed' },
  shipped:           { label: 'Shipped',            color: '#065f46', bg: '#d1fae5' },
  in_transit:        { label: 'In Transit',         color: '#065f46', bg: '#d1fae5' },
  out_for_delivery:  { label: 'Out for Delivery',  color: '#14532d', bg: '#dcfce7' },
  delivered:         { label: 'Delivered',          color: '#14532d', bg: '#dcfce7' },
  delivery_failed:   { label: 'Delivery Failed',   color: '#991b1b', bg: '#fee2e2' },
  doa_raised:        { label: 'DOA Raised',         color: '#9d174d', bg: '#fce7f3' },
  cancelled:         { label: 'Cancelled',          color: '#991b1b', bg: '#fee2e2' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: '#4b5563', bg: '#f3f4f6' };
  return (
    <span style={{ padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', backgroundColor: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function StatusIcon({ status }) {
  if (status === 'delivered') return <CheckCircle size={15} color="#10b981" />;
  if (['failed', 'cancelled', 'delivery_failed'].includes(status)) return <XCircle size={15} color="#ef4444" />;
  if (['shipped', 'in_transit', 'out_for_delivery'].includes(status)) return <Truck size={15} color="#f59e0b" />;
  if (['confirmed', 'processing', 'packing'].includes(status)) return <Clock size={15} color="#f59e0b" />;
  return <Package size={15} color="#94a3b8" />;
}

function SubOrderCard({ so }) {
  const shipment = so.shipment;
  const sellerName = so.seller_name || so.seller?.store_name || so.seller?.username || null;
  return (
    <div style={{ backgroundColor: '#f8faf8', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #edf2ed' }}>
      {/* Header: sub-order number + seller + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#1b2d2a', fontFamily: 'monospace' }}>{so.sub_order_number}</p>
          {sellerName && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
              from <strong style={{ color: '#1b2d2a' }}>{sellerName}</strong>
            </p>
          )}
          {so.awb_number && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>
              AWB: <strong>{so.awb_number}</strong>{so.courier_name ? ` · ${so.courier_name}` : ''}
            </p>
          )}
        </div>
        <StatusBadge status={so.status} />
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: (shipment || so.awb_number) ? '1rem' : 0 }}>
        {(so.items || []).map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {item.product_image && (
              <img src={item.product_image} alt={item.product_name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #edf2ed', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{item.variant_name} × {item.quantity}</p>
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Shipment tracking link */}
      {shipment?.tracking_url && (
        <a href={shipment.tracking_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#1b2d2a', textDecoration: 'none', padding: '0.4rem 0.9rem', border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: 'white' }}>
          <Truck size={13} /> Track Shipment
        </a>
      )}
    </div>
  );
}

export default function MyOrders() {
  const navType = useNavigationType();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();

  // Restore page number when coming back via browser back button
  const savedPage = navType === 'POP'
    ? parseInt(sessionStorage.getItem('ordersPage') || '1', 10)
    : 1;
  const [page, setPage] = useState(Number.isFinite(savedPage) ? savedPage : 1);

  useScrollRestoration(!loading);

  useEffect(() => {
    sessionStorage.setItem('ordersPage', String(page));
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api.get(`/orders/?page=${page}`, { signal: controller.signal })
      .then(res => {
        const data = res.data;
        if (data && typeof data === 'object' && 'results' in data) {
          setOrders(data.results);
          setTotalItems(data.count || 0);
        } else {
          const arr = Array.isArray(data) ? data : [];
          setOrders(arr);
          setTotalItems(arr.length);
        }
      })
      .catch(err => { if (err.name !== 'CanceledError') console.error('Failed to load orders:', err); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '8rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Order History</h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Tracking your orders.</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
          <div style={{ color: '#e2e8f0', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <ShoppingBag size={64} strokeWidth={1} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>No Orders Yet</h3>
          <p style={{ color: '#64748b', marginBottom: '3rem' }}>Your collection is waiting for its first rare specimen.</p>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>Explore Gallery</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map(order => {
            const isExpanded = expandedId === order.id;
            const subOrders = order.sub_orders || [];
            const addr = order.shipping_address || {};
            const city = addr.city || addr.state || '';
            const totalItems = (order.items || []).length;

            return (
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.75rem 2rem', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Left side - expandable content */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', alignItems: 'start', gap: '0.75rem 1rem' }}
                  >
                    {/* Order number + date */}
                    <div>
                      <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Order ID</p>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#1b2d2a' }}>{order.order_number}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>

                    {/* Overall status */}
                    <div>
                      <p style={{ margin: '0 0 0.4rem', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Status</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <StatusIcon status={order.status} />
                        <StatusBadge status={order.status} />
                      </div>
                    </div>

                    {/* Items + destination */}
                    <div>
                      <p style={{ margin: '0 0 0.4rem', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Items</p>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem' }}>{totalItems} Specimen{totalItems !== 1 ? 's' : ''}</p>
                      {city && <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={10} />{city}</p>}
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 0.4rem', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Total</p>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#1b2d2a' }}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
                    </div>
                  </button>

                  {/* Right side - Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#f0f4f0', color: '#1b2d2a', border: '1px solid #d1fae5', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e1fde0'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0f4f0'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Eye size={14} /> Track
                    </button>
                    <div style={{ color: '#cbd5e1', flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Sub-orders expanded */}
                {isExpanded && (
                  <div style={{ padding: '0 2rem 2rem', borderTop: '1px solid #f1f5f9' }}>
                    {subOrders.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.5rem' }}>
                        {subOrders.length > 1 && (() => {
                          const shippedCount = subOrders.filter(s => ['shipped','in_transit','out_for_delivery','delivered'].includes(s.status)).length;
                          const hasPartial = shippedCount > 0 && shippedCount < subOrders.length;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: hasPartial ? '#fffbeb' : '#f8faf8', border: `1px solid ${hasPartial ? '#fde68a' : '#edf2ed'}` }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: hasPartial ? '#92400e' : '#94a3b8', textTransform: 'uppercase' }}>
                                {hasPartial
                                  ? `${shippedCount} of ${subOrders.length} shipments dispatched`
                                  : `${subOrders.length} shipments from different sellers`}
                              </span>
                            </div>
                          );
                        })()}
                        {subOrders.map(so => <SubOrderCard key={so.id} so={so} />)}
                      </div>
                    ) : (
                      /* Fallback: show flat items if no sub_orders */
                      <div style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(order.items || []).map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8faf8', borderRadius: '10px' }}>
                            {item.product_image && <img src={item.product_image} alt={item.product_name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />}
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem' }}>{item.product_name}</p>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{item.variant_name} × {item.quantity}</p>
                            </div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(totalItems / 10))}
            totalItems={totalItems}
            pageSize={10}
            onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      )}
    </div>
  );
}
