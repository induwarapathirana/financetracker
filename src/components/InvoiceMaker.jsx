import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export default function InvoiceMaker({ orderData, onBack }) {
    const { addInvoice } = useFinance();
    const [customer, setCustomer] = useState({ name: '', phone: '', deliveryDate: '', notes: '' });
    const [saved, setSaved] = useState(false);
    const [savedInvoice, setSavedInvoice] = useState(null);

    const formatCurrency = (v) => `Rs. ${Number(v).toLocaleString()}`;

    const handleSave = async () => {
        if (!customer.name) return;
        const invoice = {
            customer_name: customer.name,
            customer_phone: customer.phone,
            delivery_date: customer.deliveryDate || null,
            notes: customer.notes,
            total_price: orderData.totalPrice,
            total_cost: orderData.totalCost,
            total_profit: orderData.totalProfit,
        };
        const result = await addInvoice(invoice, orderData.lineItems);
        if (result) {
            setSavedInvoice({ ...result, lineItems: orderData.lineItems });
            setSaved(true);
        }
    };

    const handlePrint = () => window.print();

    const previewInvoice = {
        id: savedInvoice?.id || '—',
        customer_name: customer.name || 'Customer Name',
        customer_phone: customer.phone,
        delivery_date: customer.deliveryDate,
        notes: customer.notes,
        lineItems: orderData.lineItems,
        total_price: orderData.totalPrice,
        created_at: savedInvoice?.created_at || new Date().toISOString(),
    };

    if (saved && savedInvoice) {
        return (
            <div className="animate-in">
                <div className="page-header">
                    <h2>Invoice Created ✓</h2>
                    <p>Income has been recorded in your ledger</p>
                </div>
                <InvoicePreview invoice={previewInvoice} formatCurrency={formatCurrency} />
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button className="btn btn-secondary" onClick={onBack}>← Back to Calculator</button>
                    <button className="btn btn-primary" onClick={handlePrint}>🖨 Print Invoice</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Create Invoice</h2>
                <p>Fill in customer details and confirm the order</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="card">
                    <div className="card-title">Customer Details</div>
                    <div className="form-group">
                        <label className="form-label">Customer Name *</label>
                        <input className="form-input" value={customer.name}
                            onChange={e => setCustomer({ ...customer, name: e.target.value })}
                            placeholder="e.g. Nishadi Fernando" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input className="form-input" value={customer.phone}
                            onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                            placeholder="e.g. 0771234567" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Delivery Date</label>
                        <input className="form-input" type="date" value={customer.deliveryDate}
                            onChange={e => setCustomer({ ...customer, deliveryDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea className="form-textarea" value={customer.notes}
                            onChange={e => setCustomer({ ...customer, notes: e.target.value })}
                            placeholder="Special instructions, delivery address, etc." />
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={!customer.name}
                        style={{ width: '100%', marginTop: 8 }}>
                        💾 Save Invoice & Record Income
                    </button>
                    <button className="btn btn-secondary" onClick={onBack} style={{ width: '100%', marginTop: 8 }}>
                        ← Back
                    </button>
                </div>

                <div>
                    <div className="card-title" style={{ marginBottom: 12 }}>Invoice Preview</div>
                    <InvoicePreview invoice={previewInvoice} formatCurrency={formatCurrency} />
                </div>
            </div>
        </div>
    );
}

function InvoicePreview({ invoice, formatCurrency }) {
    const dateStr = invoice.created_at
        ? new Date(invoice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="invoice-preview" id="invoice-print">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', marginBottom: 4 }}>🎂 Sweet Delights</h2>
                    <p style={{ color: '#888', fontSize: '0.85rem' }}>Cakes · Platters · Gift Packs</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Invoice</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>#{String(invoice.id).slice(0, 8)}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888' }}>{dateStr}</div>
                </div>
            </div>

            <div style={{ marginBottom: 24, padding: '14px 18px', background: '#f8f4f0', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.08em', marginBottom: 4 }}>Bill To</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{invoice.customer_name}</div>
                {invoice.customer_phone && <div style={{ fontSize: '0.85rem', color: '#666' }}>{invoice.customer_phone}</div>}
                {invoice.delivery_date && <div style={{ fontSize: '0.85rem', color: '#666' }}>Delivery: {invoice.delivery_date}</div>}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Details</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.lineItems.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                            <td style={{ fontSize: '0.82rem', color: '#888' }}>
                                {item.complexity_label} · {item.creativity_label}
                                {item.addons_json?.length > 0 && (
                                    <>, +{item.addons_json.map(a => a.name).join(', ')}</>
                                )}
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total_price)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <div style={{ width: 260 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e5e5e5', fontWeight: 700, fontSize: '1.1rem' }}>
                        <span>Total</span>
                        <span>{formatCurrency(invoice.total_price)}</span>
                    </div>
                </div>
            </div>

            {invoice.notes && (
                <div style={{ marginTop: 24, padding: '12px 16px', background: '#fef9f3', borderRadius: 8, fontSize: '0.85rem', color: '#777' }}>
                    <strong style={{ color: '#555' }}>Notes:</strong> {invoice.notes}
                </div>
            )}

            <div style={{ marginTop: 40, textAlign: 'center', fontSize: '0.75rem', color: '#bbb' }}>
                Thank you for your order! 🎉
            </div>
        </div>
    );
}
