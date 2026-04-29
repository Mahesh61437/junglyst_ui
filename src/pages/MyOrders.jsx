import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OrderService } from '../services/OrderService';
import { Package, ChevronRight, Truck, CheckCircle, Clock, Search, ShoppingBag } from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await OrderService.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle size={16} color="#10b981" />;
      case 'shipped': return <Truck size={16} color="var(--brand-gold)" />;
      case 'processing': return <Clock size={16} color="#64748b" />;
      default: return <Package size={16} color="#94a3b8" />;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '8rem 1rem', textAlign: 'center' }}>
        <div className="fade-in" style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>Retrieving Acquisition History...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <div className="slide-up" style={{ marginBottom: '5rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Order History</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Tracking your botanical journey and rare acquisitions.</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
           <div style={{ color: '#e2e8f0', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
             <ShoppingBag size={64} strokeWidth={1} />
           </div>
           <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>No Acquisitions Yet</h3>
           <p style={{ color: '#64748b', marginBottom: '3rem' }}>Your collection is waiting for its first rare specimen.</p>
           <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>Explore Gallery</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '2rem 3rem', 
                borderRadius: '24px', 
                border: '1px solid #f1f5f9', 
                display: 'grid', 
                gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 40px',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
              }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-gold)'} 
                 onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}>
                
                {/* Identification */}
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Acquisition ID</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--bg-deep)' }}>#{order.order_number}</span>
                </div>

                {/* Status */}
                <div>
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Protocol Status</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(order.status)}
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'capitalize' }}>{order.status}</span>
                   </div>
                </div>

                {/* Date */}
                <div>
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Initiated On</span>
                   <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>

                {/* Total */}
                <div style={{ textAlign: 'right', paddingRight: '2rem' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Investment</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>₹{parseFloat(order.total_amount).toLocaleString()}</span>
                </div>

                <div style={{ color: '#cbd5e1' }}>
                   <ChevronRight size={24} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
