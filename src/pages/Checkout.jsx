import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OrderService } from '../services/OrderService';
import api from '../services/api';
import { ShieldCheck, Truck, ArrowLeft, MapPin, CreditCard, ShoppingBag, Info, Plus, Trash2 } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

export default function Checkout() {
  const { cart, clearCart, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const [shipping, setShipping] = useState({
    full_name: '', email: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: ''
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [fallbackLoading, setFallbackLoading] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/shipping/addresses/').then(res => {
        const addressList = res.data.results ? res.data.results : (Array.isArray(res.data) ? res.data : []);
        if (addressList.length > 0) {
          setAddresses(addressList);
          setIsAddingNew(false);
          const def = addressList.find(a => a.is_default);
          setSelectedAddressId(def ? def.id : addressList[0].id);
        } else {
          setIsAddingNew(true);
        }
      }).catch(err => console.error(err));
    } else {
      setIsAddingNew(true);
    }
  }, [user]);

  // Fallback to fetch cart if missing
  useEffect(() => {
    if (!cart.id && !fallbackLoading) {
      setFallbackLoading(true);
      api.get('/cart/').then(res => {
        if (res.data && res.data.id) {
          console.log("Fallback cart fetch successful:", res.data.id);
          // The CartContext should ideally be updated, but we can at least allow submission
        }
      }).finally(() => setFallbackLoading(false));
    }
  }, [cart.id]);

  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let checkoutAddressId = selectedAddressId;

      if (user && editingAddressId) {
        await api.put(`/shipping/addresses/${editingAddressId}/`, {
          ...shipping,
          is_default: isDefault
        });
        checkoutAddressId = editingAddressId;
      } else if (user && isAddingNew && saveAddress) {
        if (addresses.length >= 5) {
          alert('You can only save up to 5 addresses. Please use it as a one-time address or delete an old one.');
          setLoading(false);
          return;
        }
        const newAddrRes = await api.post('/shipping/addresses/', {
          ...shipping,
          is_default: isDefault
        });
        checkoutAddressId = newAddrRes.data.id;
      }

      let currentCartId = cart.id;
      if (!currentCartId) {
        // Fallback fetch if context is still missing it
        try {
          const cartRes = await api.get('/cart/');
          currentCartId = cartRes.data.id;
        } catch (e) {
          console.error("Fallback fetch failed", e);
        }
      }

      if (!currentCartId) {
        alert("Cart registration failed to sync with the server. Please check your connection or log in again.");
        setLoading(false);
        return;
      }

      const checkoutData = {
        cart_id: currentCartId,
      };

      if (user && checkoutAddressId && (!isAddingNew || saveAddress)) {
        checkoutData.address_id = checkoutAddressId;
      } else {
        checkoutData.guest_info = {
          email: shipping.email || (user ? user.email : ''),
          phone: shipping.phone || (user ? user.phone : ''),
          address: shipping
        };
      }

      const response = await OrderService.checkout(checkoutData);
      await clearCart();
      // Redirect to orders page to display the list of orders for the user
      navigate('/orders');
    } catch (err) {
      console.error("Checkout failed:", err);
      const errorDetail = err.response?.data?.error || 
                          err.response?.data?.message || 
                          (err.response?.data ? JSON.stringify(err.response.data) : null) ||
                          err.message;
      navigate('/checkout/failure', { state: { error: errorDetail } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem 10rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Collection
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '4rem', alignItems: 'start' }}>
        {/* Acquisition Flow (Left) */}
        <div className="slide-up">
          <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Identity & Delivery */}
            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-deep)', fontSize: '0.8rem', fontWeight: 900 }}>1</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Logistics & Identity</h3>
              </div>

              {user && addresses.length > 0 && !isAddingNew && !editingAddressId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      style={{
                        padding: '1.25rem', border: selectedAddressId === addr.id ? '2px solid var(--brand-green)' : '1px solid #e2e8f0',
                        borderRadius: '12px', cursor: 'pointer', backgroundColor: selectedAddressId === addr.id ? '#f0fdf4' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 700 }}>{addr.full_name}</span>
                          {addr.is_default && <span style={{ fontSize: '0.7rem', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, marginLeft: '0.5rem' }}>DEFAULT</span>}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddressId(addr.id);
                            setShipping({ ...addr });
                            setIsDefault(addr.is_default);
                          }}
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-green)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Edit
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                        {addr.address_line1}, {addr.address_line2 ? addr.address_line2 + ', ' : ''}{addr.city}, {addr.state} {addr.pincode}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{addr.phone} | {addr.email}</div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setShipping({
                        full_name: '', email: user?.email || '', phone: user?.phone || '', address_line1: '', address_line2: '', city: '', state: '', pincode: ''
                      });
                      setIsAddingNew(true);
                      if (addresses.length >= 5) setSaveAddress(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: '12px', background: 'transparent', cursor: 'pointer', fontWeight: 700, color: 'var(--brand-green)', justifyContent: 'center' }}
                  >
                    <Plus size={18} /> {addresses.length >= 5 ? "Use One-Time Address" : "Add New Address"}
                  </button>
                </div>
              )}

              {(!user || isAddingNew || editingAddressId || addresses.length === 0) && (
                <>
                  {user && addresses.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{editingAddressId ? 'Edit Address' : 'New Address Intake'}</h4>
                      <button 
                        type="button" 
                        onClick={() => { setIsAddingNew(false); setEditingAddressId(null); }} 
                        style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Email Contact</label>
                      <input required type="email" placeholder="collector@email.com" value={shipping.email} onChange={e => setShipping({ ...shipping, email: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Mobile Secure</label>
                      <input required type="tel" placeholder="+91 XXXXX XXXXX" value={shipping.phone} onChange={e => setShipping({ ...shipping, phone: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Full Name</label>
                    <input required value={shipping.full_name} onChange={e => setShipping({ ...shipping, full_name: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Address Line 1</label>
                    <input required placeholder="Street address, landmark, suite" value={shipping.address_line1} onChange={e => setShipping({ ...shipping, address_line1: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Address Line 2 (Optional)</label>
                    <input placeholder="Apartment, suite, etc." value={shipping.address_line2} onChange={e => setShipping({ ...shipping, address_line2: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>City</label>
                      <input required value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>State</label>
                      <input required value={shipping.state} onChange={e => setShipping({ ...shipping, state: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>PIN Code</label>
                      <input required placeholder="6XXXXX" value={shipping.pincode} onChange={e => setShipping({ ...shipping, pincode: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                    </div>
                  </div>

                  {user && !editingAddressId && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {addresses.length >= 5 ? (
                        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          You have reached the maximum limit of 5 saved addresses. This will be used as a one-time delivery address for this acquisition.
                        </div>
                      ) : (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                            <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                            Save this address to my address book
                          </label>
                          {saveAddress && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, marginLeft: '1.5rem', color: '#64748b' }}>
                              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                              Make this my default address
                            </label>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {user && editingAddressId && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                        Make this my default address
                      </label>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Payment Method */}
            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-deep)', fontSize: '0.8rem', fontWeight: 900 }}>2</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Payment Vault</h3>
              </div>

              <div style={{ border: '2px solid var(--brand-gold)', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fffdf9' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '5px solid var(--brand-gold)', backgroundColor: 'white' }}></div>
                <div style={{ flexGrow: 1 }}>
                  <span style={{ fontWeight: 800, color: 'var(--bg-deep)', display: 'block', fontSize: '0.95rem' }}>Secure Botanical Checkout</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Cards, UPI, NetBanking • PayU Secured</span>
                </div>
                <ShieldCheck size={20} color="var(--brand-gold)" />
              </div>
            </section>
          </form>
        </div>

        {/* Tactical Summary (Right) */}
        <aside style={{ position: 'sticky', top: '8rem' }} className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Order Summary</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', backgroundColor: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Secure</span>
            </div>

            {/* Compact Item List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '2rem', paddingRight: '0.5rem' }}>
              {cart.items.map(item => {
                const product = item.product_details || (typeof item.product === 'object' ? item.product : {});
                const variant = item.variant_details || (typeof item.variant === 'object' ? item.variant : {});
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f8fafc' }}>
                      <img src={getImageUrl(variant.image_url || product.image_url || product.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--bg-deep)', maxWidth: '150px' }}>{product.name || 'Botanical Specimen'}</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(cart.items.indexOf(item));
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                          title="Remove from cart"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Qty: {item.quantity} • {variant.name || 'Standard'}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>₹{((parseFloat(variant.price || product.price) || 0) * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.5rem 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Subtotal <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>(GST Incl.)</span></span>
                  <span style={{ fontWeight: 700, color: 'var(--bg-deep)' }}>₹{cart.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Priority Packaging</span>
                  <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? '#10b981' : 'var(--bg-deep)' }}>
                    {cart.shipping_total === 0 ? 'COMPLIMENTARY' : `₹${cart.shipping_total}`}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Acquisition</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--bg-deep)' }}>₹{cart.grand_total.toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" form="checkout-form" disabled={loading} style={{
              width: '100%',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-deep)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'opacity 0.2s ease'
            }}>
              {loading ? 'Validating Specimens...' : `COMPLETE ACQUISITION`}
            </button>

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.7rem' }}>
              <Info size={14} />
              <span>By clicking, you agree to our Botanical Care and Shipping protocols.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
