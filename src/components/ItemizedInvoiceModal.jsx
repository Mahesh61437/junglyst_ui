import React from 'react';
import { X, Printer, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ItemizedInvoiceModal({ isOpen, onClose, data, month }) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <motion.div 
        className="modal-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: 'white', width: '100%', maxWidth: '1000px', maxHeight: '90vh', borderRadius: '8px', overflowY: 'auto', overflowX: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
      >
        {/* Actions - hidden on print */}
        <div className="no-print" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', zIndex: 10 }}>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
            <Printer size={16} /> Print / Save PDF
          </button>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Invoice Content */}
        <div className="printable-invoice" style={{ minWidth: '800px', padding: '3rem', fontFamily: 'Arial, sans-serif', color: '#000' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Tax Invoice</h1>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.25rem 0 0' }}>Monthly Settlement Summary</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ maxWidth: '60%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Sold By: {data.store_name}</div>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}><i>Registered Email:</i> {data.seller_email}</div>
              <div style={{ fontSize: '0.85rem' }}><b>GSTIN:</b> Not Provided</div>
            </div>
            <div style={{ textAlign: 'right', border: '1px dashed #ccc', padding: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}><b>Invoice Number</b> # JUNG-{data.seller_id.substring(0,6).toUpperCase()}-{month.replace('-', '')}</div>
              <div style={{ fontSize: '0.85rem' }}><b>Settlement Period:</b> {month}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>Bill To</div>
              <div style={{ fontWeight: 'bold' }}>Junglyst Marketplace</div>
              <div style={{ fontSize: '0.85rem' }}>123 Botanical Avenue, Green Sector</div>
              <div style={{ fontSize: '0.85rem' }}>Bengaluru, Karnataka - 560001</div>
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Total items: {data.items ? data.items.length : 0}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderTop: '2px solid #000', borderBottom: '1px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0', width: '25%' }}>Product</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>Gross Amount ₹</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>Taxable Value ₹</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>SGST ₹</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>CGST ₹</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>Total ₹</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem 0', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                      Order: {item.order_id}<br/>
                      SGST: {item.gst_rate / 2}% | CGST: {item.gst_rate / 2}%
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem 0', verticalAlign: 'top' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0', verticalAlign: 'top' }}>{item.gross_amount.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0', verticalAlign: 'top' }}>{item.taxable_value.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0', verticalAlign: 'top' }}>{item.sgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0', verticalAlign: 'top' }}>{item.cgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0', verticalAlign: 'top' }}>{item.total.toFixed(2)}</td>
                </tr>
              ))}
              
              {/* Grand Total Row for Items */}
              <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 'bold' }}>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>Total</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                  {data.items ? data.items.reduce((sum, item) => sum + item.qty, 0) : 0}
                </td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{data.gross_sales.toFixed(2)}</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{data.taxable_value.toFixed(2)}</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{data.sgst.toFixed(2)}</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{data.cgst.toFixed(2)}</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{data.gross_sales.toFixed(2)}</td>
              </tr>
            </tbody>
            </table>
          </div>

          {/* Settlement Breakdown Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '400px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Gross Sales:</span>
                <span style={{ fontWeight: 'bold' }}>₹ {data.gross_sales.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#666' }}>
                <span>Less Platform Fee:</span>
                <span>- ₹ {data.platform_fee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#666' }}>
                <span>Less GST on Fee (18%):</span>
                <span>- ₹ {data.platform_fee_gst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#666' }}>
                <span>Less TCS (1% under GST):</span>
                <span>- ₹ {data.tcs_deducted.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#666' }}>
                <span>Less TDS (1% u/s 194-O):</span>
                <span>- ₹ {data.tds_deducted.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Net Settlement:</span>
                <span>₹ {data.net_settlement.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '4rem', fontSize: '0.75rem', color: '#666', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            This is a computer-generated document and does not require a signature.
          </div>

        </div>

        {/* Styles for printing */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-invoice, .printable-invoice * {
              visibility: visible;
            }
            .printable-invoice {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
            }
            .modal-overlay {
              position: absolute !important;
              background: transparent !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .modal-content {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              box-shadow: none !important;
              max-height: none !important;
              overflow: visible !important;
              width: 100% !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              margin: 1cm;
            }
          }
        `}} />
      </motion.div>
    </div>
  );
}
