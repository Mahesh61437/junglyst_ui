// Opens the Razorpay / Cashfree modal for a server-created order and resolves
// once the outcome is known. Used by workshop bookings; mirrors the flow in
// pages/Checkout.jsx (verify on success, poll when the modal closes mid-payment).
import { load } from '@cashfreepayments/cashfree-js';
import api from '../services/api';
import { OrderService } from '../services/OrderService';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 30; // 90 seconds

export const PAYMENT_MESSAGES = {
  cancelled: 'Payment was cancelled. No money was taken. You can try again.',
  failed: 'Payment failed. Please try a different payment method.',
  timeout: 'Payment status is taking longer than expected. Please check My Orders or contact support.',
  verifyFailed: 'Payment was received but confirmation failed. Please contact support with your booking reference.',
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${RAZORPAY_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function pollPaymentStatus(param, gatewayOrderId) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.get(`/orders/payment-status/?${param}=${encodeURIComponent(gatewayOrderId)}`);
      if (data.status === 'success') return { status: 'success', order: data.order };
      if (data.status === 'cancelled') return { status: 'cancelled', message: PAYMENT_MESSAGES.cancelled };
      if (data.status === 'failed') return { status: 'failed', message: PAYMENT_MESSAGES.failed };
    } catch {
      // network blip: keep polling until the attempt budget runs out
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return { status: 'failed', message: PAYMENT_MESSAGES.timeout };
}

function payWithRazorpay(response, { prefill, description, onVerifying }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; resolve(result); } };
    const rzp = new window.Razorpay({
      key: response.razorpay_key_id,
      amount: Math.round(parseFloat(response.amount) * 100),
      currency: response.currency || 'INR',
      order_id: response.razorpay_order_id,
      name: 'JungLyst',
      description,
      prefill,
      theme: { color: '#1b2d2a' },
      handler: async (rzpRes) => {
        settled = true; // ondismiss can fire after the handler; ignore it
        onVerifying?.();
        try {
          const verified = await OrderService.verifyPayment({ gateway: 'razorpay', ...rzpRes });
          resolve({ status: 'success', order: verified.order });
        } catch {
          resolve({ status: 'failed', message: PAYMENT_MESSAGES.verifyFailed });
        }
      },
      modal: { ondismiss: () => finish({ status: 'cancelled', message: PAYMENT_MESSAGES.cancelled }) },
    });
    rzp.on('payment.failed', () => finish({ status: 'failed', message: PAYMENT_MESSAGES.failed }));
    rzp.open();
  });
}

async function payWithCashfree(response, { onVerifying }) {
  const cashfree = await load({
    mode: (import.meta.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase(),
    appId: import.meta.env.VITE_CASHFREE_APP_ID,
  });
  if (!cashfree) throw new Error('Payment SDK could not be initialized. Please refresh and try again.');
  const result = await cashfree.checkout({
    paymentSessionId: response.payment_session_id,
    redirectTarget: '_modal',
    components: ['order-details', 'card', 'netbanking', 'upi', 'wallet'],
  });
  if (result.error) {
    return { status: 'failed', message: result.error.message || PAYMENT_MESSAGES.failed };
  }
  onVerifying?.();
  if (result.paymentDetails) {
    try {
      const verified = await OrderService.verifyPayment({ cashfree_order_id: response.cashfree_order_id });
      return { status: 'success', order: verified.order };
    } catch {
      // fall through to polling: the capture may still land via webhook
    }
  }
  return pollPaymentStatus('cashfree_order_id', response.cashfree_order_id);
}

/**
 * @param response  server payload from a booking/checkout endpoint (gateway + ids)
 * @param options   { prefill: {name,email,contact}, description, onVerifying() }
 * @returns Promise<{status: 'success'|'failed'|'cancelled', order?, message?}>
 */
export async function launchGatewayPayment(response, options = {}) {
  if (response.gateway === 'razorpay') {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error('Failed to load Razorpay. Please refresh and try again.');
    return payWithRazorpay(response, options);
  }
  if (!response.payment_session_id) throw new Error('Payment session could not be created. Please try again.');
  return payWithCashfree(response, options);
}
