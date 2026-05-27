import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { OrderService } from '../services/OrderService';
import { Package, Truck, CheckCircle, Clock, ArrowLeft, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import SocialLinks from '../components/SocialLinks';

const SUB_STATUS_META = {
  pending:           { label: 'Awaiting Payment',  color: '#6b7280', bg: '#f3f4f6' },
  placed:            { label: 'Order Received',    color: '#1d4ed8', bg: '#dbeafe' },
  confirmed:         { label: 'Confirmed',         color: '#854d0e', bg: '#fef9c3' },
  packing:           { label: 'Being Packed',      color: '#c2410c', bg: '#fff7ed' },
  shipped:           { label: 'Shipped',           color: '#065f46', bg: '#d1fae5' },
  in_transit:        { label: 'In Transit',        color: '#065f46', bg: '#d1fae5' },
  out_for_delivery:  { label: 'Out for Delivery', color: '#14532d', bg: '#dcfce7' },
  delivered:         { label: 'Delivered',         color: '#14532d', bg: '#dcfce7' },
  delivery_failed:   { label: 'Delivery Failed',  color: '#991b1b', bg: '#fee2e2' },
  doa_raised:        { label: 'DOA Raised',        color: '#9d174d', bg: '#fce7f3' },
  cancelled:         { label: 'Cancelled',         color: '#991b1b', bg: '#fee2e2' },
};

// Ordered sub-order stages for the per-seller mini-timeline
const SUB_ORDER_STAGES = ['placed', 'confirmed', 'packing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
const STAGE_LABELS = {
  placed: 'Received', confirmed: 'Confirmed', packing: 'Packing',
  shipped: 'Shipped', in_transit: 'In Transit', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
};
const TERMINAL_NEGATIVE = new Set(['delivery_failed', 'doa_raised', 'cancelled']);

function SubStatusBadge({ status }) {
  const m = SUB_STATUS_META[status] || { label: status, color: '#4b5563', bg: '#f3f4f6' };
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

function SubOrderCard({ so }) {
  const shipment = so.shipment;
  const sellerName = so.seller_name || (so.seller && (so.seller.store_name || so.seller.username));
  const isTerminalNegative = TERMINAL_NEGATIVE.has(so.status);
  const currentStageIdx = SUB_ORDER_STAGES.indexOf(so.status);

  return (
    <div style={{
      backgroundColor: '#f8faf8', borderRadius: '16px',
      padding: 'clamp(1rem,2.5vw,1.5rem)',
      border: `1px solid ${isTerminalNegative ? '#fecaca' : '#edf2ed'}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(0.8rem,2vw,0.9rem)', color: '#1b2d2a', fontFamily: 'monospace' }}>{so.sub_order_number}</p>
          {sellerName && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              from <strong style={{ color: '#1b2d2a' }}>{sellerName}</strong>
            </p>
          )}
        </div>
        <SubStatusBadge status={so.status} />
      </div>

      {/* Mini stage timeline (only for non-negative terminal states) */}
      {!isTerminalNegative && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {SUB_ORDER_STAGES.map((stage, idx) => {
            const isDone = currentStageIdx >= idx;
            const isCurrent = currentStageIdx === idx;
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <div style={{
                    width: isCurrent ? '10px' : '8px', height: isCurrent ? '10px' : '8px',
                    borderRadius: '50%',
                    backgroundColor: isDone ? (isCurrent ? '#0A3029' : '#10b981') : '#e2e8f0',
                    border: isCurrent ? '2px solid #0A3029' : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.55rem', fontWeight: isCurrent ? 800 : 600, color: isDone ? (isCurrent ? '#0A3029' : '#10b981') : '#cbd5e1', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                {idx < SUB_ORDER_STAGES.length - 1 && (
                  <div style={{ width: '24px', height: '2px', backgroundColor: currentStageIdx > idx ? '#10b981' : '#e2e8f0', flexShrink: 0, margin: '0 2px', marginBottom: '14px' }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Items */}
      {so.items && so.items.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem',
          padding: 'clamp(0.5rem,1.5vw,0.75rem)',
          backgroundColor: 'white', borderRadius: '10px', border: '1px solid #edf2ed',
        }}>
          {so.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
              {item.product_image && (
                <img
                  src={getImageUrl(item.product_image)}
                  alt={item.product_name}
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid #edf2ed' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#1b2d2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{item.variant_name}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1b2d2a' }}>×{item.quantity}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AWB / Courier */}
      {so.awb_number && (
        <div style={{
          marginBottom: '0.75rem', padding: '0.65rem 0.85rem',
          backgroundColor: 'white', borderRadius: '8px', border: '1px solid #d1fae5',
        }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>AWB Number</p>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1b2d2a', fontFamily: 'monospace', wordBreak: 'break-all' }}>{so.awb_number}</p>
          {so.courier_name && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>via {so.courier_name}</p>}
        </div>
      )}

      {/* Courier tracking link */}
      {shipment?.tracking_url && (
        <a
          href={shipment.tracking_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem',
            fontSize: '0.75rem', fontWeight: 700, color: '#1b2d2a',
            textDecoration: 'none', padding: '0.4rem 0.9rem',
            border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: 'white',
          }}
        >
          <Truck size={13} /> Track with Courier <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await OrderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '8rem 1rem', textAlign: 'center' }}>
        <div className="fade-in" style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>Establishing Logistics Link...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '10rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Protocol Error</h2>
        <p style={{ color: '#64748b', margin: '2rem 0' }}>We couldn't find that order.</p>
        <Link to="/orders" className="btn btn-primary">Back to My Orders</Link>
      </div>
    );
  }

  const ACTIVE_AFTER_CONFIRM = ['confirmed', 'processing', 'shipped', 'delivered'];
  const ACTIVE_AFTER_PROCESSING = ['processing', 'shipped', 'delivered'];
  const steps = [
    {
      label: 'Payment Confirmed',
      icon: <Package size={20} />,
      active: ACTIVE_AFTER_CONFIRM.includes(order.status),
    },
    {
      label: 'Processing',
      icon: <Clock size={20} />,
      active: ACTIVE_AFTER_PROCESSING.includes(order.status),
    },
    {
      label: 'Shipped',
      icon: <Truck size={20} />,
      active: ['shipped', 'delivered'].includes(order.status),
    },
    {
      label: 'Delivered',
      icon: <CheckCircle size={20} />,
      active: order.status === 'delivered',
    },
  ];

  return (
    <div className="container" style={{ padding: 'clamp(2rem,5vw,4rem) 1rem clamp(5rem,10vw,10rem)' }}>
      <div style={{ marginBottom: 'clamp(1.5rem,4vw,3rem)' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
           <ArrowLeft size={13} /> Go Back
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'clamp(2rem,4vw,4rem)', alignItems: 'start' }}>
        
        {/* Tracking Details (Left) */}
        <div className="slide-up">
          <section style={{ backgroundColor: 'white', padding: 'clamp(1.5rem,4vw,3.5rem)', borderRadius: '32px', border: '1px solid #f1f5f9', marginBottom: '3rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'clamp(2rem,5vw,4rem)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                   <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>Order Tracking</h1>
                   <p style={{ color: '#64748b', fontWeight: 600 }}>Protocol Reference: #{order.order_number}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#f0f4f0', color: 'var(--bg-deep)', padding: '0.4rem 0.8rem', borderRadius: '4px', letterSpacing: '0.05em' }}>
                      {order.status}
                   </span>
                </div>
             </div>

             {/* Visual Progress Bar */}
             <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 'clamp(3rem,7vw,6rem)' }}>
                <div style={{ position: 'absolute', top: 'clamp(18px,3vw,24px)', left: '0', right: '0', height: '2px', backgroundColor: '#f1f5f9', zIndex: 0 }}></div>
                {steps.map((step, idx) => (
                  <div key={idx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: 'clamp(36px,6vw,50px)',
                      height: 'clamp(36px,6vw,50px)',
                      borderRadius: '50%',
                      backgroundColor: step.active ? 'var(--bg-deep)' : 'white',
                      border: step.active ? 'none' : '2px solid #f1f5f9',
                      color: step.active ? 'white' : '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem',
                      transition: 'all 0.3s ease'
                    }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 'clamp(0.58rem,1.5vw,0.7rem)', fontWeight: 800, textTransform: 'uppercase', color: step.active ? 'var(--bg-deep)' : '#94a3b8' }}>{step.label}</span>
                  </div>
                ))}
             </div>

             {/* Delivery address */}
             <div style={{ paddingTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <MapPin size={16} /> Delivery Address
                </h4>
                <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.8 }}>
                   <strong>{order.shipping_address?.firstName} {order.shipping_address?.lastName}</strong><br />
                   {order.shipping_address?.address}<br />
                   {order.shipping_address?.city}, {order.shipping_address?.zip}
                </div>
             </div>
          </section>

          {/* Per-seller shipment cards */}
          {order.sub_orders && order.sub_orders.length > 0 && (
            <section style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: 'clamp(1rem,2.5vw,1.25rem)', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0 }}>
                  Shipments ({order.sub_orders.length})
                </h3>
                {order.sub_orders.length > 1 && (() => {
                  const shippedCount = order.sub_orders.filter(s =>
                    ['shipped','in_transit','out_for_delivery','delivered'].includes(s.status)
                  ).length;
                  if (shippedCount > 0 && shippedCount < order.sub_orders.length) {
                    return (
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.3rem 0.65rem', borderRadius: '20px' }}>
                        {shippedCount}/{order.sub_orders.length} dispatched
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {order.sub_orders.map((so) => (
                  <SubOrderCard key={so.id} so={so} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Financial Anchor (Right) */}
        <aside style={{ position: 'sticky', top: '8rem' }} className="slide-up">
           <div style={{ backgroundColor: 'white', padding: 'clamp(1.5rem,3vw,2.5rem)', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem', fontFamily: 'var(--font-serif)' }}>Financial Transcript</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>Product Subtotal</span>
                    <span style={{ fontWeight: 700 }}>₹{parseFloat(order.subtotal).toLocaleString()}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>Tax (GST)</span>
                    <span style={{ fontWeight: 700 }}>₹{parseFloat(order.gst_total).toLocaleString()}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>Thermal Logistics</span>
                    <span style={{ fontWeight: 700, color: parseFloat(order.shipping_fee) === 0 ? '#10b981' : 'inherit' }}>
                       {parseFloat(order.shipping_fee) === 0 ? 'COMPLIMENTARY' : `₹${parseFloat(order.shipping_fee).toLocaleString()}`}
                    </span>
                 </div>
              </div>
              <div style={{ borderTop: '2px solid #000', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.5rem', color: 'var(--bg-deep)' }}>
                 <span>Total</span>
                 <span>₹{parseFloat(order.total_amount).toLocaleString()}</span>
              </div>
              
              <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#fcfdfc', borderRadius: '16px', display: 'flex', gap: '1rem' }}>
                 <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
                 <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Order Guarantee</h5>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>Your botanical investment is secured under our vitality guarantee. Any issues in transit will be managed by our concierge.</p>
                 </div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                 <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8', marginBottom: '0.85rem' }}>Tag us when it arrives</p>
                 <div style={{ display: 'flex', justifyContent: 'center' }}>
                   <SocialLinks variant="light" size={16} buttonSize={36} gap={0.5} />
                 </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}
