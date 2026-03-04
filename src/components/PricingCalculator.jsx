import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export default function PricingCalculator({ onCreateInvoice }) {
    const { catalog, complexityLevels, creativityLevels } = useFinance();
    const [orderItems, setOrderItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');

    const addOrderItem = () => {
        if (!selectedItemId) return;
        const catalogItem = catalog.find(i => i.id === selectedItemId);
        if (!catalogItem) return;
        setOrderItems(prev => [
            ...prev,
            {
                uid: Date.now(),
                catalogId: catalogItem.id,
                name: catalogItem.name,
                category: catalogItem.category,
                baseCost: catalogItem.baseCost,
                basePrice: catalogItem.basePrice,
                complexity: 0,
                creativity: 0,
                quantity: 1,
            },
        ]);
        setSelectedItemId('');
    };

    const updateItem = (uid, field, value) => {
        setOrderItems(prev => prev.map(i => i.uid === uid ? { ...i, [field]: value } : i));
    };

    const removeItem = (uid) => {
        setOrderItems(prev => prev.filter(i => i.uid !== uid));
    };

    const calcLine = (item) => {
        const cxMult = complexityLevels[item.complexity].multiplier;
        const crMult = creativityLevels[item.creativity].multiplier;
        const finalPrice = item.basePrice * cxMult * crMult * item.quantity;
        const totalCost = item.baseCost * item.quantity;
        const profit = finalPrice - totalCost;
        return { finalPrice: Math.round(finalPrice), totalCost: Math.round(totalCost), profit: Math.round(profit) };
    };

    const orderTotals = orderItems.reduce(
        (acc, item) => {
            const line = calcLine(item);
            return {
                totalPrice: acc.totalPrice + line.finalPrice,
                totalCost: acc.totalCost + line.totalCost,
                totalProfit: acc.totalProfit + line.profit,
            };
        },
        { totalPrice: 0, totalCost: 0, totalProfit: 0 }
    );

    const formatCurrency = (v) => `Rs. ${v.toLocaleString()}`;

    const handleCreateInvoice = () => {
        if (orderItems.length === 0) return;
        const lineItems = orderItems.map(item => {
            const line = calcLine(item);
            return {
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                complexity: complexityLevels[item.complexity].label,
                creativity: creativityLevels[item.creativity].label,
                unitPrice: Math.round(item.basePrice * complexityLevels[item.complexity].multiplier * creativityLevels[item.creativity].multiplier),
                totalPrice: line.finalPrice,
                totalCost: line.totalCost,
                profit: line.profit,
            };
        });
        onCreateInvoice({
            lineItems,
            totalPrice: orderTotals.totalPrice,
            totalCost: orderTotals.totalCost,
            totalProfit: orderTotals.totalProfit,
        });
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Pricing Calculator</h2>
                <p>Build an order — select items, adjust complexity & creativity, see live profit</p>
            </div>

            {/* Add item row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Select Item from Catalog</label>
                    <select className="form-select" value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}>
                        <option value="">— Choose an item —</option>
                        {catalog.map(it => (
                            <option key={it.id} value={it.id}>{it.name} ({it.category}) — Rs. {it.basePrice.toLocaleString()}</option>
                        ))}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={addOrderItem} disabled={!selectedItemId}>
                    ＋ Add to Order
                </button>
            </div>

            <div className="pricing-section">
                {/* Left: Order Items */}
                <div className="order-builder">
                    {orderItems.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🛒</div>
                            <p>Select items from your catalog to build an order</p>
                        </div>
                    ) : (
                        orderItems.map(item => {
                            const line = calcLine(item);
                            return (
                                <div key={item.uid} className="order-item-card">
                                    <div className="order-item-header">
                                        <div>
                                            <div className="order-item-name">{item.name}</div>
                                            <span className="badge badge-info" style={{ marginTop: 4 }}>{item.category}</span>
                                        </div>
                                        <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.uid)}>✕</button>
                                    </div>

                                    <div className="modifier-row">
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Complexity</label>
                                            <select className="form-select" value={item.complexity}
                                                onChange={e => updateItem(item.uid, 'complexity', Number(e.target.value))}>
                                                {complexityLevels.map((lvl, idx) => (
                                                    <option key={idx} value={idx}>{lvl.label} ({lvl.multiplier}x)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Creativity</label>
                                            <select className="form-select" value={item.creativity}
                                                onChange={e => updateItem(item.uid, 'creativity', Number(e.target.value))}>
                                                {creativityLevels.map((lvl, idx) => (
                                                    <option key={idx} value={idx}>{lvl.label} ({lvl.multiplier}x)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Qty</label>
                                            <input className="form-input" type="number" min="1" value={item.quantity}
                                                onChange={e => updateItem(item.uid, 'quantity', Math.max(1, Number(e.target.value)))} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 24, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        <span>Price: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(line.finalPrice)}</strong></span>
                                        <span>Cost: <strong style={{ color: 'var(--color-danger)' }}>{formatCurrency(line.totalCost)}</strong></span>
                                        <span>Profit: <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(line.profit)}</strong></span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right: Order Summary */}
                <div>
                    <div className="order-summary-card">
                        <div className="card-title">Order Summary</div>

                        {orderItems.map(item => {
                            const line = calcLine(item);
                            return (
                                <div key={item.uid} className="summary-row">
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {item.name} ×{item.quantity}
                                    </span>
                                    <span>{formatCurrency(line.finalPrice)}</span>
                                </div>
                            );
                        })}

                        <div className="summary-row total">
                            <span>Total Price</span>
                            <span>{formatCurrency(orderTotals.totalPrice)}</span>
                        </div>
                        <div className="summary-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Total Cost</span>
                            <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(orderTotals.totalCost)}</span>
                        </div>
                        <div className="summary-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Estimated Profit</span>
                            <span className="profit-highlight">{formatCurrency(orderTotals.totalProfit)}</span>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <button className="btn btn-accent" style={{ flex: 1 }}
                                onClick={handleCreateInvoice}
                                disabled={orderItems.length === 0}>
                                📄 Create Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
