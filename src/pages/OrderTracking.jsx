import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrderService } from '../services/OrderService';
import { Package, Truck, CheckCircle, Clock, ArrowLeft, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

export default function OrderTracking() {
  const { id } = useParams();
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
        <p style={{ color: '#64748b', margin: '2rem 0' }}>The requested acquisition could not be located in our archives.</p>
        <Link to="/orders" className="btn btn-primary">Back to My Orders</Link>
      </div>
    );
  }

  const steps = [
    { label: 'Order Placed', status: 'placed', icon: <Package size={20} />, active: true },
    { label: 'Processing', status: 'processing', icon: <Clock size={20} />, active: ['processing', 'shipped', 'delivered'].includes(order.status) },
    { label: 'In Transit', status: 'shipped', icon: <Truck size={20} />, active: ['shipped', 'delivered'].includes(order.status) },
    { label: 'Delivered', status: 'delivered', icon: <CheckCircle size={20} />, active: order.status === 'delivered' }
  ];

  return (
    <div className="container" style={{ padding: '4rem 1rem 10rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
           <ArrowLeft size={14} /> Back to History
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem', alignItems: 'start' }}>
        
        {/* Tracking Details (Left) */}
        <div className="slide-up">
          <section style={{ backgroundColor: 'white', padding: '3.5rem', borderRadius: '32px', border: '1px solid #f1f5f9', marginBottom: '3rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
                <div>
                   <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>Acquisition Tracking</h1>
                   <p style={{ color: '#64748b', fontWeight: 600 }}>Protocol Reference: #{order.order_number}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#f0f4f0', color: 'var(--bg-deep)', padding: '0.4rem 0.8rem', borderRadius: '4px', letterSpacing: '0.05em' }}>
                      {order.status}
                   </span>
                </div>
             </div>

             {/* Visual Progress Bar */}
             <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '6rem' }}>
                <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '2px', backgroundColor: '#f1f5f9', zIndex: 0 }}></div>
                {steps.map((step, idx) => (
                  <div key={idx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '50%', 
                      backgroundColor: step.active ? 'var(--bg-deep)' : 'white', 
                      border: step.active ? 'none' : '2px solid #f1f5f9',
                      color: step.active ? 'white' : '#cbd5e1',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      transition: 'all 0.3s ease'
                    }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: step.active ? 'var(--bg-deep)' : '#94a3b8' }}>{step.label}</span>
                  </div>
                ))}
             </div>

             {/* Logistic Context */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                <div>
                   <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} /> Delivery Sanctuary
                   </h4>
                   <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.8 }}>
                      <strong>{order.shipping_address.firstName} {order.shipping_address.lastName}</strong><br />
                      {order.shipping_address.address}<br />
                      {order.shipping_address.city}, {order.shipping_address.zip}
                   </div>
                </div>
                <div>
                   <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Truck size={16} /> Transit Hub
                   </h4>
                   <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.8 }}>
                      {order.courier_name ? (
                        <>
                          Carrier: <strong>{order.courier_name}</strong><br />
                          AWB: <span style={{ fontFamily: 'monospace' }}>{order.awb_number}</span><br />
                          <a href="#" style={{ color: 'var(--bg-deep)', textDecoration: 'underline', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                            External Tracking <ExternalLink size={12} />
                          </a>
                        </>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Awaiting courier assignment after quarantine...</span>
                      )}
                   </div>
                </div>
             </div>
          </section>

          {/* Specimen Manifest */}
          <section style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2.5rem', fontFamily: 'var(--font-serif)' }}>Acquisition Manifest</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               {order.items.map(item => (
                 <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                       <img src={getImageUrl(item.product?.image_url || item.product?.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div>
                       <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{item.product_name}</h4>
                       <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.variant_name} • Quantity: {item.quantity}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--bg-deep)' }}>
                       ₹{parseFloat(item.unit_price * item.quantity).toLocaleString()}
                    </div>
                 </div>
               ))}
            </div>
          </section>
        </div>

        {/* Financial Anchor (Right) */}
        <aside style={{ position: 'sticky', top: '8rem' }} className="slide-up">
           <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem', fontFamily: 'var(--font-serif)' }}>Financial Transcript</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>Subtotal <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>(GST Incl.)</span></span>
                    <span style={{ fontWeight: 700 }}>₹{parseFloat(order.subtotal).toLocaleString()}</span>
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
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Acquisition Guarantee</h5>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>Your botanical investment is secured under our vitality guarantee. Any issues in transit will be managed by our concierge.</p>
                 </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}
