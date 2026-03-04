import { useFinance } from '../context/FinanceContext';

export default function Dashboard() {
    const { invoices, expenses, getStats } = useFinance();
    const stats = getStats();

    const recentInvoices = invoices.slice(0, 5);
    const recentExpenses = expenses.slice(0, 5);

    const formatCurrency = (val) => `Rs. ${val.toLocaleString()}`;

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your cake & treats business</p>
            </div>

            <div className="stat-grid">
                <div className="stat-card income">
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">{formatCurrency(stats.totalIncome)}</div>
                </div>
                <div className="stat-card expenses">
                    <div className="stat-label">Total Expenses</div>
                    <div className="stat-value">{formatCurrency(stats.totalExpenses)}</div>
                </div>
                <div className="stat-card profit">
                    <div className="stat-label">Net Profit</div>
                    <div className="stat-value">{formatCurrency(stats.netProfit)}</div>
                </div>
                <div className="stat-card orders">
                    <div className="stat-label">Total Orders</div>
                    <div className="stat-value">{stats.orderCount}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card">
                    <div className="card-title">Recent Invoices</div>
                    {recentInvoices.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📄</div>
                            <p>No invoices yet. Create your first order!</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Profit</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td>{inv.customer_name}</td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(Number(inv.total_price))}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(Number(inv.total_profit))}</td>
                                            <td>
                                                <span className={`badge badge-${inv.status === 'paid' ? 'success' : inv.status === 'cancelled' ? 'danger' : 'warning'}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-title">Recent Expenses</div>
                    {recentExpenses.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💰</div>
                            <p>No expenses recorded yet.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentExpenses.map(exp => (
                                        <tr key={exp.id}>
                                            <td>{exp.description}</td>
                                            <td><span className={`badge ${exp.category === 'Transportation' || exp.category === 'Delivery' ? 'badge-warning' : 'badge-info'}`}>{exp.category}</span></td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>
                                                {formatCurrency(Number(exp.amount))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
