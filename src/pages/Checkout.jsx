import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OrderService } from '../services/OrderService';
import api from '../services/api';
import { useAddresses } from '../utils/addressCache';
import { ShieldCheck, ArrowLeft, Leaf, ChevronRight, Info, Trash2, Package, Truck, Calendar, Store } from 'lucide-react';
import CheckoutRecommendationPopup from '../components/CheckoutRecommendationPopup';
import { getImageUrl } from '../utils/imageUtils';
import { load } from '@cashfreepayments/cashfree-js';
import { trackEvent, trackCheckoutInitiated } from '../utils/analytics';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, cartId, clearCart, removeItem, comboLines } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { addresses, invalidate: invalidateAddresses } = useAddresses(user);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [shipping, setShipping] = useState({
    full_name: '', email: '', phone: '',
    address_line1: '', address_line2: '',
    city: '', state: '', pincode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const pendingCheckout = useRef(null);
  const [verifying, setVerifying] = useState(false); // polling overlay state
  // Ref to prevent empty-cart guard from redirecting to /cart after order is placed
  const orderPlaced = useRef(false);
  // Gateway order IDs stored so polling can query status after modal closes
  const pendingGatewayId = useRef({ cashfree: null, razorpay: null });

  const sellerGroups = cart?.seller_groups || {};
  const deliveryBlocked = cart?.delivery_blocked;
  const outOfStockItems = (cart?.items || []).filter(item => item.quantity > (item.variant?.stock ?? Infinity));

  // Fire checkout_initiated once when user lands on checkout with a valid cart
  useEffect(() => {
    if (cart?.items?.length) {
      trackCheckoutInitiated({ value: cart.grand_total, numItems: cart.items.length });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill shipping form from cached addresses or profile
  useEffect(() => {
    if (!user) return;
    if (addresses.length > 0) {
      const def = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
      setShipping({ ...def });
    } else {
      setShipping(prev => ({
        ...prev,
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user, addresses]);

  // ── Payment status polling (handles UPI in-processing / modal-close edge case) ──
  const startPolling = async (gatewayType, gatewayId) => {
    setVerifying(true);
    orderPlaced.current = true;
    const param = gatewayType === 'cashfree' ? 'cashfree_order_id' : 'razorpay_order_id';

    // Immediate first check — handles the common "user cancelled the modal"
    // case in one round-trip instead of waiting for the 3s interval to tick.
    try {
      const res = await api.get(`/orders/payment-status/?${param}=${gatewayId}`);
      const { status: pStatus, order } = res.data;
      if (pStatus === 'success') {
        clearCart();
        try { sessionStorage.setItem('junglyst_last_order', JSON.stringify(order)); } catch { }
        navigate('/checkout/success', { state: { order } });
        return;
      }
      if (pStatus === 'cancelled') {
        orderPlaced.current = false;
        setVerifying(false);
        trackEvent('payment_failed', { reason: 'user_cancelled', gateway: gatewayType });
        navigate('/checkout/failure', { state: { error: 'Payment was cancelled. You can retry from your cart.' } });
        return;
      }
      if (pStatus === 'failed') {
        orderPlaced.current = false;
        setVerifying(false);
        trackEvent('payment_failed', { reason: 'declined', gateway: gatewayType });
        navigate('/checkout/failure', { state: { error: 'Payment was declined. Please try a different payment method.' } });
        return;
      }
      // 'processing' — payment is in flight (UPI collect/QR completed out-of-band).
      // Fall through to the long poll below.
    } catch {
      // Network error on first check — fall through to the long poll, which
      // will retry and eventually time out with a clear message.
    }

    const MAX_ATTEMPTS = 30; // 30 × 3s = 90 seconds
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/orders/payment-status/?${param}=${gatewayId}`);
        const { status: pStatus, order } = res.data;
        if (pStatus === 'success') {
          clearInterval(interval);
          clearCart();
          try { sessionStorage.setItem('junglyst_last_order', JSON.stringify(order)); } catch { }
          navigate('/checkout/success', { state: { order } });
        } else if (pStatus === 'failed' || pStatus === 'cancelled') {
          clearInterval(interval);
          orderPlaced.current = false;
          setVerifying(false);
          trackEvent('payment_failed', { reason: pStatus === 'cancelled' ? 'user_cancelled' : 'declined', gateway: gatewayType });
          const msg = pStatus === 'cancelled'
            ? 'Payment was cancelled. You can retry from your cart.'
            : 'Payment was declined. Please try a different payment method.';
          navigate('/checkout/failure', { state: { error: msg } });
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          orderPlaced.current = false;
          setVerifying(false);
          navigate('/checkout/failure', { state: { error: 'Payment status is taking longer than expected. Please check My Orders or contact support.' } });
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          orderPlaced.current = false;
          setVerifying(false);
          navigate('/checkout/failure', { state: { error: 'Could not verify payment status. Please check My Orders or contact support.' } });
        }
      }
    }, 3000);
  };

  if (!orderPlaced.current && (!cart || !cart.items || cart.items.length === 0) && (comboLines || []).length === 0) {
    navigate('/cart');
    return null;
  }

  const handleAddressSelect = (addr) => {
    setSelectedAddressId(addr.id);
    setShipping({ ...addr });
  };

  const handleNewAddress = () => {
    setSelectedAddressId(null);
    setShipping({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address_line1: '', address_line2: '', city: '', state: '', pincode: ''
    });
    setSaveAddress(false);
    setIsDefault(false);
  };

  const f = (field) => e => setShipping(prev => ({ ...prev, [field]: e.target.value }));

  function handleNudgeProceed() {
    setShowNudge(false);
    // Re-submit the form — pendingCheckout.current is already truthy so it skips the nudge
    document.getElementById('checkout-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user && !showGuestConfirm) {
      setShowGuestConfirm(true);
      return;
    }
    setShowGuestConfirm(false);

    if (deliveryBlocked) {
      setError("Delivery is not available for your selected address. Please update the address or contact support.");
      return;
    }

    // Show complementary product nudge once before proceeding to payment
    if (!pendingCheckout.current) {
      pendingCheckout.current = true;
      setShowNudge(true);
      return;
    }
    pendingCheckout.current = null;

    setLoading(true);
    trackEvent('payment_initiated', { value: cart?.grand_total, num_items: cart?.items?.length, gateway: 'pending' });
    try {
      let checkoutAddressId = selectedAddressId;

      // Save new address if checkbox is ticked
      if (user && !selectedAddressId && saveAddress) {
        if (addresses.length >= 5) {
          setError('You have 5 saved addresses (the maximum). Uncheck "Save address" to use a one-time address.');
          setLoading(false);
          return;
        }
        const res = await api.post('/shipping/addresses/', { ...shipping, is_default: isDefault });
        checkoutAddressId = res.data.id;
        invalidateAddresses();
      }

      // Try to resolve backend cart ID for logged-in users
      let currentCartId = cartId || cart.id;
      if (!currentCartId && user) {
        try {
          const cartRes = await api.get('/cart/');
          currentCartId = cartRes.data.id;
        } catch { }
      }

      // Build item list (used when no backend cart is available).
      // Exclude phantom rows: items with no variant id, and items clamped to
      // quantity 0 (e.g. flagged out of stock) which must never be ordered.
      const itemList = cart.items
        .filter(item => item.variant?.id && item.quantity >= 1)
        .map(item => ({ variant_id: item.variant.id, quantity: item.quantity }));

      const comboPayload = (comboLines || []).map(l => ({ combo_id: l.comboId, quantity: l.qty }));

      if (itemList.length === 0 && comboPayload.length === 0) {
        setError('Your cart items are missing product details. Please re-add items from the shop and try again.');
        setLoading(false);
        return;
      }

      const checkoutData = {};

      // Cart: prefer backend cart_id, fall back to inline items.
      // Only send cart/items when there are standalone (non-combo) items.
      if (itemList.length > 0) {
        if (currentCartId) {
          checkoutData.cart_id = currentCartId;
        } else {
          checkoutData.items = itemList;
        }
      }

      // Combos: one entry per combo line (backend expands into components).
      if (comboPayload.length > 0) {
        checkoutData.combos = comboPayload;
      }

      // Address
      if (user && checkoutAddressId) {
        checkoutData.address_id = checkoutAddressId;
      } else {
        // Guest OR logged-in user using a one-time address
        checkoutData.guest_info = {
          email: shipping.email,
          phone: shipping.phone,
          address: shipping,
        };
      }

      if (shipping.pincode) {
        checkoutData.pincode = shipping.pincode;
      }

      const response = await OrderService.checkout(checkoutData);
      const { order, razorpay_order_id, amount, mock_payment, gateway } = response;

      if (mock_payment) {
        await clearCart();
        try { sessionStorage.setItem('junglyst_last_order', JSON.stringify(order)); } catch { }
        navigate('/checkout/success', { state: { order } });
        return;
      }

      if (gateway === 'razorpay') {
        const ok = await loadRazorpayScript();
        if (!ok) throw new Error('Failed to load Razorpay. Please refresh and try again.');

        const { razorpay_order_id, razorpay_key_id, amount, currency } = response;
        const rzpAmount = Math.round(parseFloat(amount) * 100);
        // Store gateway ID for polling if modal closes during processing
        pendingGatewayId.current.razorpay = razorpay_order_id;

        const options = {
          key: razorpay_key_id,
          amount: rzpAmount,
          currency: currency || 'INR',
          order_id: razorpay_order_id,
          name: 'JungLyst',
          description: 'Order payment',
          // Use Razorpay's default checkout — natively renders UPI (VPA input,
          // QR, intent apps), Cards, Net Banking, and Wallets. Custom
          // config.display.blocks was collapsing UPI to QR-only on desktop.
          handler: async function (rzpRes) {
            // Mark order placed immediately so the empty-cart guard
            // doesn't redirect to /cart while verifyPayment runs
            orderPlaced.current = true;
            setLoading(true);
            try {
              const response = await OrderService.verifyPayment({
                gateway: 'razorpay',
                razorpay_order_id: rzpRes.razorpay_order_id,
                razorpay_payment_id: rzpRes.razorpay_payment_id,
                razorpay_signature: rzpRes.razorpay_signature,
              });
              clearCart();
              try { sessionStorage.setItem('junglyst_last_order', JSON.stringify(response.order)); } catch { }
              navigate('/checkout/success', { state: { order: response.order } });
            } catch (e) {
              console.error('Razorpay verify failed:', e);
              orderPlaced.current = false;
              setVerifying(false);
              navigate('/checkout/failure', { state: { error: 'Payment verified but order confirmation failed. Please contact support.' } });
            }
          },
          modal: {
            ondismiss: function () {
              // Handler (success) or payment.failed already navigated — bail.
              if (orderPlaced.current) return;
              orderPlaced.current = true; // prevent double-nav from late callbacks
              setLoading(false);
              trackEvent('payment_failed', { reason: 'user_cancelled', gateway: 'razorpay' });
              navigate('/checkout/failure', { state: { error: 'Payment was cancelled. You can retry from your cart.' } });
            }
          },
          prefill: {
            name: shipping.full_name,
            email: shipping.email,
            contact: shipping.phone,
          },
          theme: { color: '#1b2d2a' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
          orderPlaced.current = true; // prevent ondismiss from double-navigating
          setLoading(false);
          trackEvent('payment_failed', { reason: 'gateway_failed', gateway: 'razorpay' });
          navigate('/checkout/failure', { state: { error: 'Payment failed. Please try a different payment method or retry.' } });
        });
        rzp.open();
        return;
      }

      const { payment_session_id, cashfree_order_id } = response;
      if (!payment_session_id) throw new Error('Payment session could not be created. Please try again.');
      // Store gateway ID for polling if modal closes during processing
      pendingGatewayId.current.cashfree = cashfree_order_id;

      // Initialize Cashfree
      const mode = (import.meta.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase();
      const appId = import.meta.env.VITE_CASHFREE_APP_ID;
      console.log('[CHECKOUT] Loading Cashfree SDK with mode:', mode, 'appId:', appId);
      const cashfree = await load({
        mode: mode,
        appId: appId
      });

      if (!cashfree) throw new Error('Payment SDK could not be initialized. Please refresh and try again.');

      // Hosted checkout with multiple payment methods
      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        redirectTarget: "_modal",
        components: ["order-details", "card", "netbanking", "upi", "wallet"],
      };

      cashfree.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          console.error('[CHECKOUT] Cashfree error:', result.error);
          setLoading(false);
          trackEvent('payment_failed', { reason: result.error?.message || 'not_completed', gateway: 'cashfree' });
          navigate('/checkout/failure', { state: { error: result.error?.message || 'Payment was not completed. Please try again.' } });
        } else if (result.paymentDetails) {
          orderPlaced.current = true;
          setVerifying(true); // show blocking overlay while we confirm with backend
          OrderService.verifyPayment({
            cashfree_order_id: cashfree_order_id,
          }).then((response) => {
            clearCart();
            try { sessionStorage.setItem('junglyst_last_order', JSON.stringify(response.order)); } catch { }
            navigate('/checkout/success', { state: { order: response.order } });
          }).catch(() => {
            orderPlaced.current = false;
            setVerifying(false);
            navigate('/checkout/failure', { state: { error: 'Payment was received but order confirmation failed. Please contact support.' } });
          });
        } else {
          // Modal closed without success or error — payment may still be processing
          const cfId = pendingGatewayId.current.cashfree;
          if (cfId) {
            startPolling('cashfree', cfId);
          } else {
            setLoading(false);
          }
        }
      }).catch((error) => {
        console.error('[CHECKOUT] Cashfree checkout error:', error);
        setLoading(false);
        navigate('/checkout/failure', { state: { error: error?.message || 'Payment could not be initialized. Please try again.' } });
      });
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(err.response?.data?.error || err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.85rem', borderRadius: '10px',
    border: '1px solid #e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = {
    display: 'block', fontSize: '0.65rem', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#64748b', marginBottom: '0.5rem'
  };

  return (
    <>
    <div className="container" style={{ padding: '4rem 1rem 10rem' }}>

      {/* ── Payment Verifying Overlay ── */}
      {verifying && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(27, 45, 42, 0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
          backdropFilter: 'blur(8px)',
        }}>
          {/* Spinner */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.15)',
            borderTopColor: '#a3c4a8',
            animation: 'spin 0.9s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>
              Verifying your payment…
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              Please don't close this page. This may take up to 90 seconds.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
            <ShieldCheck size={14} color="#a3c4a8" />
            <span style={{ color: '#a3c4a8', fontSize: '0.72rem' }}>
              {pendingGatewayId.current.razorpay ? 'Secured by Razorpay' : 'Secured by Cashfree Payments'}
            </span>
          </div>
        </div>
      )}
      <div style={{ marginBottom: '3rem' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Collection
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'clamp(1.5rem, 4vw, 4rem)', alignItems: 'start' }}>

        {/* ── Left: Form ── */}
        <div className="slide-up">
          <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Section 1: Delivery */}
            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: '#1b2d2a' }}>1</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0 }}>Delivery Details</h3>
              </div>

              {/* Saved address quick-fill chips */}
              {user && addresses.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <p style={labelStyle}>Quick-fill from saved address</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {addresses.map(addr => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleAddressSelect(addr)}
                        style={{
                          padding: '0.45rem 1rem', borderRadius: '20px', cursor: 'pointer',
                          border: selectedAddressId === addr.id ? '2px solid #1b2d2a' : '1px solid #e2e8f0',
                          backgroundColor: selectedAddressId === addr.id ? '#f0fdf4' : 'white',
                          fontSize: '0.78rem', fontWeight: selectedAddressId === addr.id ? 800 : 600,
                          color: selectedAddressId === addr.id ? '#1b2d2a' : '#64748b',
                          transition: 'all 0.15s'
                        }}
                      >
                        {addr.full_name}{addr.is_default ? ' · Default' : ''}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleNewAddress}
                      style={{
                        padding: '0.45rem 1rem', borderRadius: '20px', cursor: 'pointer',
                        border: !selectedAddressId ? '2px solid #1b2d2a' : '1px dashed #cbd5e1',
                        backgroundColor: !selectedAddressId ? '#f8fafc' : 'white',
                        fontSize: '0.78rem', fontWeight: !selectedAddressId ? 800 : 600,
                        color: !selectedAddressId ? '#1b2d2a' : '#94a3b8',
                        transition: 'all 0.15s'
                      }}
                    >
                      + New Address
                    </button>
                  </div>
                </div>
              )}

              {/* Always-visible form */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required type="text" placeholder="Pavan Kumar" value={shipping.full_name} onChange={f('full_name')} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Mobile <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required type="tel" placeholder="+91 12345 67890" value={shipping.phone} onChange={f('phone')} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="email" placeholder="collector@email.com" value={shipping.email} onChange={f('email')} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
                <input required placeholder="House / flat no., street, landmark" value={shipping.address_line1} onChange={f('address_line1')} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Address Line 2 <span style={{ color: '#64748b', fontWeight: 600, textTransform: 'none', letterSpacing: 0, fontSize: '0.65rem' }}>(Optional)</span></label>
                <input placeholder="Apartment, suite, area, etc." value={shipping.address_line2} onChange={f('address_line2')} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>City <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required value={shipping.city} onChange={f('city')} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>State <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required value={shipping.state} onChange={f('state')} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>PIN Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required placeholder="6-digit" maxLength={6} value={shipping.pincode} onChange={f('pincode')} style={inputStyle} />
                </div>
              </div>

              {/* Save options — only shown for logged-in users entering a new address */}
              {user && !selectedAddressId && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {addresses.length >= 5 ? (
                    <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      Max 5 addresses saved. This will be used as a one-time delivery address.
                    </div>
                  ) : (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                        <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                        Save this address for future orders
                      </label>
                      {saveAddress && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, marginLeft: '1.5rem', color: '#64748b' }}>
                          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                          Make this my default address
                        </label>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Guest nudge to log in */}
              {!user && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                  <Link to="/login" style={{ color: '#1b2d2a', fontWeight: 800, textDecoration: 'underline' }}>Sign in</Link> to save your address and track orders easily.
                </div>
              )}
            </section>

            {/* Section 2: Payment Methods */}
            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: '#1b2d2a' }}>2</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0 }}>Payment Methods</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {/* Cards Payment */}
                {/*<div style={{ padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'center', cursor: 'default' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💳</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1b2d2a', marginBottom: '0.25rem' }}>Cards</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Credit/Debit</div>
                </div>*/}

                {/* Net Banking */}
                {/*<div style={{ padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'center', cursor: 'default' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏦</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1b2d2a', marginBottom: '0.25rem' }}>Net Banking</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>All Major Banks</div>
                </div>*/}

                {/* Digital Wallets */}
                {/*<div style={{ padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'center', cursor: 'default' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1b2d2a', marginBottom: '0.25rem' }}>Wallets</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Google/PhonePe/Paytm</div>
                </div>*/}

                {/* UPI */}
                <div style={{ padding: '1rem', borderRadius: '12px', border: '2px solid #1b2d2a', backgroundColor: '#f0fdf4', textAlign: 'center', cursor: 'default' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💸</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1b2d2a', marginBottom: '0.25rem' }}>UPI</div>
                  <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Instant Transfer</div>
                </div>
              </div>

              <div style={{ border: '2px solid var(--brand-gold)', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fffdf9' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '5px solid var(--brand-gold)', backgroundColor: 'white', flexShrink: 0 }} />
                <div style={{ flexGrow: 1 }}>
                  <span style={{ fontWeight: 800, color: '#1b2d2a', display: 'block', fontSize: '0.95rem' }}>Secure Payment Processing</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Powered by Cashfree Payments • Industry-leading encryption</span>
                </div>
                <ShieldCheck size={20} color="var(--brand-gold)" />
              </div>
            </section>

          </form>
        </div>

        {/* ── Right: Order Summary ── */}
        <aside style={{ position: 'sticky', top: '8rem' }} className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0 }}>Order Summary</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', backgroundColor: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Secure</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '420px', overflowY: 'auto', marginBottom: '2rem', paddingRight: '0.5rem' }}>
              {Object.entries(sellerGroups).map(([sellerId, group]) => {
                const storeName = group.seller?.store_name
                  || group.seller?.seller_profile?.store_name
                  || group.seller?.full_name
                  || 'Curator';
                const win = group.shipping_window;
                const pincodeReady = !!shipping.pincode && shipping.pincode.length === 6;
                return (
                  <div key={sellerId} style={{ border: '1px solid #f1f5f9', borderRadius: '14px', padding: '1rem', backgroundColor: '#fcfdfc' }}>
                    {/* Per-seller header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                      <Store size={14} color="#0A3029" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1b2d2a' }}>{storeName}</span>
                    </div>

                    {/* Items from this seller */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {group.items.map(item => {
                        const product = item.product_details || (item.product && typeof item.product === 'object' ? item.product : {});
                        const variant = item.variant_details || (item.variant && typeof item.variant === 'object' ? item.variant : {});
                        return (
                          <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Link to={`/product/${product.slug || product.id}`} style={{ width: '54px', height: '54px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f8fafc', display: 'block' }}>
                              <img src={getImageUrl(variant.image_url || product.image_url || product.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" onError={e => { e.target.onerror = null; e.target.src = '/assets/default-product.jpg'; }} />
                            </Link>
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Link to={`/product/${product.slug || product.id}`} style={{ textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0, color: '#1b2d2a' }}>{product.name || 'Botanical Specimen'}</h4>
                                </Link>
                                <button onClick={() => removeItem(cart.items.indexOf(item))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', flexShrink: 0 }} aria-label="Remove item">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Qty: {item.quantity} · {variant.name || 'Standard'}</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>₹{((parseFloat(variant.price || product.price) || 0) * item.quantity).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Shipping window */}
                    <div style={{ marginTop: '0.85rem', padding: '0.7rem 0.85rem', backgroundColor: '#f0fdf4', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {win ? (
                        win.unavailable ? (
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
                            <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
                            This curator hasn't published a shipping schedule yet.
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#15803d' }}>
                              <Truck size={13} />
                              Ships <strong style={{ color: '#1b2d2a' }}>{win.ships_on}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#15803d' }}>
                              <Calendar size={13} />
                              Est. delivery <strong style={{ color: '#1b2d2a' }}>{pincodeReady ? win.estimated_delivery : 'enter pincode for ETA'}</strong>
                            </div>
                            {win.on_break && (
                              <div style={{ fontSize: '0.7rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '0.3rem 0.5rem', borderRadius: '6px', marginTop: '0.2rem' }}>
                                Curator is on a break today — order will dispatch on their next shipping day.
                              </div>
                            )}
                          </>
                        )
                      ) : (
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Shipping date unavailable.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.5rem 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Subtotal <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>(GST Incl.)</span></span>
                  <span style={{ fontWeight: 700, color: '#1b2d2a' }}>₹{cart.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? '#10b981' : '#1b2d2a' }}>
                    {cart.shipping_total === 0 ? 'COMPLIMENTARY' : `₹${cart.shipping_total}`}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1b2d2a' }}>₹{cart.grand_total.toLocaleString()}</span>
              </div>
            </div>

            {outOfStockItems.length > 0 && (
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                {outOfStockItems.map(item => (
                  <div key={item.id}>
                    {item.product?.name} ({item.variant?.name}) is out of stock. Please remove it from your cart to continue.
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            {deliveryBlocked && (
              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Delivery is not available for your selected delivery address. Please update the address or choose a different shipping pin code.
              </div>
            )}

            <button
              type="submit"
              form="checkout-form"
              disabled={loading || deliveryBlocked || outOfStockItems.length > 0}
              style={{
                width: '100%', padding: '1.25rem',
                backgroundColor: loading || deliveryBlocked || outOfStockItems.length > 0 ? '#94a3b8' : '#1b2d2a',
                color: 'white', border: 'none', borderRadius: '14px',
                fontWeight: 800, fontSize: '1rem', cursor: loading || deliveryBlocked || outOfStockItems.length > 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Processing...' : 'PLACE ORDER'} {!loading && <ChevronRight size={20} />}
            </button>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Thermal-locked botanical packaging</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Leaf size={16} color="#10b981" />
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>100% vitality guaranteed</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Info size={14} color="#94a3b8" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>By clicking, you agree to our shipping & care protocols.</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>

      {/* Guest checkout confirmation modal */}

      <CheckoutRecommendationPopup
        isOpen={showNudge}
        onProceed={handleNudgeProceed}
      />

      {showGuestConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Info size={22} color="#ca8a04" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#1b2d2a', marginBottom: '0.5rem' }}>Continue without signing in?</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              You're about to complete your order as a guest. You won't be able to track your order or view it in your account later.{' '}
              <Link to="/login" style={{ color: '#1b2d2a', fontWeight: 700, textDecoration: 'underline' }}>Sign in</Link> for a better experience.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowGuestConfirm(false)}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', color: '#1b2d2a', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  const form = document.getElementById('checkout-form');
                  if (form) form.requestSubmit();
                }}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: 'none', backgroundColor: '#1b2d2a', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
