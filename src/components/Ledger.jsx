import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

const expenseCategories = ['Ingredients', 'Packaging', 'Delivery', 'Equipment', 'Utilities', 'Marketing', 'Other'];

export default function Ledger() {
    const { invoices, expenses, addExpense, deleteExpense, updateInvoiceStatus, deleteInvoice } = useFinance();
    const [tab, setTab] = useState('income');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'Ingredients' });

    const formatCurrency = (v) => `Rs. ${Number(v).toLocaleString()}`;
    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const handleAddExpense = () => {
        if (!expForm.description || !expForm.amount) return;
        addExpense({ description: expForm.description, amount: Number(expForm.amount), category: expForm.category });
        setExpForm({ description: '', amount: '', category: 'Ingredients' });
        setShowExpenseModal(false);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Finance Ledger</h2>
                <p>Track all your income from invoices and manual expenses</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="ledger-tabs">
                    <button className={`ledger-tab ${tab === 'income' ? 'active' : ''}`} onClick={() => setTab('income')}>
                        💰 Income
                    </button>
                    <button className={`ledger-tab ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
                        💸 Expenses
                    </button>
                </div>
                {tab === 'expenses' && (
                    <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                        ＋ Add Expense
                    </button>
                )}
            </div>

            {tab === 'income' ? (
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
                                        <th>Amount</th>
                                        <th>Profit</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td>{formatDate(inv.createdAt)}</td>
                                            <td style={{ fontWeight: 500 }}>{inv.customerName}</td>
                                            <td>{inv.lineItems.map(l => l.name).join(', ')}</td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(inv.totalPrice)}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(inv.totalProfit)}</td>
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
            ) : (
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
                                            <td>{formatDate(exp.createdAt)}</td>
                                            <td style={{ fontWeight: 500 }}>{exp.description}</td>
                                            <td><span className="badge badge-info">{exp.category}</span></td>
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
                                placeholder="e.g. Flour, sugar, butter" />
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
                                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
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
