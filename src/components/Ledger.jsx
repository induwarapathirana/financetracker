import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

const EXPENSE_CATEGORIES = ['Ingredients', 'Packaging', 'Transportation', 'Delivery', 'Equipment', 'Utilities', 'Rent', 'Labor', 'Marketing', 'Other'];

export default function Ledger() {
    const { invoices, expenses, addExpense, deleteExpense, updateInvoiceStatus, deleteInvoice } = useFinance();
    const [tab, setTab] = useState('income');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'Ingredients', invoice_id: '' });

    const formatCurrency = (v) => `Rs. ${Number(v).toLocaleString()}`;
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const handleAddExpense = async () => {
        if (!expForm.description || !expForm.amount) return;
        await addExpense({
            description: expForm.description,
            amount: Number(expForm.amount),
            category: expForm.category,
            invoice_id: expForm.invoice_id || null,
        });
        setExpForm({ description: '', amount: '', category: 'Ingredients', invoice_id: '' });
        setShowExpenseModal(false);
    };

    // Group expenses by category for summary
    const categoryTotals = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
        return acc;
    }, {});

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Finance Ledger</h2>
                <p>Track all income from invoices and business expenses</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="ledger-tabs">
                    <button className={`ledger-tab ${tab === 'income' ? 'active' : ''}`} onClick={() => setTab('income')}>
                        💰 Income
                    </button>
                    <button className={`ledger-tab ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
                        💸 Expenses
                    </button>
                    <button className={`ledger-tab ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>
                        📊 Summary
                    </button>
                </div>
                {tab === 'expenses' && (
                    <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                        ＋ Add Expense
                    </button>
                )}
            </div>

            {tab === 'income' && (
                <div className="card">
                    {invoices.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📄</div>
                            <p>No invoices yet. Create one from the Pricing Calculator.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Revenue</th>
                                        <th>Cost</th>
                                        <th>Profit</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td>{formatDate(inv.created_at)}</td>
                                            <td style={{ fontWeight: 500 }}>{inv.customer_name}</td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                {(inv.invoice_line_items || []).map(l => l.item_name).join(', ') || '—'}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total_price)}</td>
                                            <td style={{ color: 'var(--color-danger)' }}>{formatCurrency(inv.total_cost)}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(inv.total_profit)}</td>
                                            <td>
                                                <select className="form-select" value={inv.status}
                                                    onChange={e => updateInvoiceStatus(inv.id, e.target.value)}
                                                    style={{ width: 110, padding: '5px 10px', fontSize: '0.78rem' }}>
                                                    <option value="pending">Pending</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteInvoice(inv.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'expenses' && (
                <div className="card">
                    {expenses.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💸</div>
                            <p>No expenses recorded yet.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(exp => (
                                        <tr key={exp.id}>
                                            <td>{formatDate(exp.created_at)}</td>
                                            <td style={{ fontWeight: 500 }}>{exp.description}</td>
                                            <td><span className={`badge ${exp.category === 'Transportation' || exp.category === 'Delivery' ? 'badge-warning' : 'badge-info'}`}>{exp.category}</span></td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatCurrency(exp.amount)}</td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteExpense(exp.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'summary' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="card">
                        <div className="card-title">Expense Breakdown by Category</div>
                        {Object.keys(categoryTotals).length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No expenses recorded yet.</p>
                        ) : (
                            <div>
                                {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <span>
                                            <span className={`badge ${cat === 'Transportation' || cat === 'Delivery' ? 'badge-warning' : 'badge-info'}`} style={{ marginRight: 8 }}>{cat}</span>
                                        </span>
                                        <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatCurrency(total)}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700, fontSize: '1.05rem' }}>
                                    <span>Total Expenses</span>
                                    <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(Object.values(categoryTotals).reduce((s, v) => s + v, 0))}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="card">
                        <div className="card-title">Quick Stats</div>
                        <div className="catalog-item-detail" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Total Invoices</span>
                            <span style={{ fontWeight: 600 }}>{invoices.length}</span>
                        </div>
                        <div className="catalog-item-detail" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Paid Invoices</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{invoices.filter(i => i.status === 'paid').length}</span>
                        </div>
                        <div className="catalog-item-detail" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Pending Invoices</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>{invoices.filter(i => i.status === 'pending').length}</span>
                        </div>
                        <div className="catalog-item-detail" style={{ padding: '10px 0' }}>
                            <span>Total Expense Records</span>
                            <span style={{ fontWeight: 600 }}>{expenses.length}</span>
                        </div>
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Expense</h3>
                            <button className="modal-close" onClick={() => setShowExpenseModal(false)}>✕</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input className="form-input" value={expForm.description}
                                onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                                placeholder="e.g. Flour, sugar, delivery fuel" />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Amount (Rs.)</label>
                                <input className="form-input" type="number" value={expForm.amount}
                                    onChange={e => setExpForm({ ...expForm, amount: e.target.value })}
                                    placeholder="e.g. 3500" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={expForm.category}
                                    onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Link to Invoice (optional)</label>
                            <select className="form-select" value={expForm.invoice_id}
                                onChange={e => setExpForm({ ...expForm, invoice_id: e.target.value })}>
                                <option value="">— No linked invoice —</option>
                                {invoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.customer_name} — {formatCurrency(inv.total_price)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddExpense}>Add Expense</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
