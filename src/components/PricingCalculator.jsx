import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export default function PricingCalculator({ onCreateInvoice }) {
    const { catalog, getRecipeCost } = useFinance();
    const [orderItems, setOrderItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');

    const addOrderItem = () => {
        if (!selectedItemId) return;
        const item = catalog.find(i => i.id === selectedItemId);
        if (!item) return;

        const complexityTiers = (item.item_multipliers || []).filter(m => m.type === 'complexity');
        const creativityTiers = (item.item_multipliers || []).filter(m => m.type === 'creativity');
        const itemAddons = item.item_addons || [];

        setOrderItems(prev => [
            ...prev,
            {
                uid: Date.now(),
                catalogId: item.id,
                name: item.name,
                category: item.category,
                recipeCost: getRecipeCost(item),
                basePrice: Number(item.base_price),
                complexityTiers,
                creativityTiers,
                addons: itemAddons.map(a => ({ ...a, selected: false })),
                selectedComplexity: complexityTiers.length > 0 ? 0 : -1,
                selectedCreativity: creativityTiers.length > 0 ? 0 : -1,
                quantity: 1,
            },
        ]);
        setSelectedItemId('');
    };

    const updateItem = (uid, field, value) => {
        setOrderItems(prev => prev.map(i => i.uid === uid ? { ...i, [field]: value } : i));
    };

    const toggleAddon = (uid, addonIdx) => {
        setOrderItems(prev => prev.map(i => {
            if (i.uid !== uid) return i;
            const newAddons = [...i.addons];
            newAddons[addonIdx] = { ...newAddons[addonIdx], selected: !newAddons[addonIdx].selected };
            return { ...i, addons: newAddons };
        }));
    };

    const removeItem = (uid) => {
        setOrderItems(prev => prev.filter(i => i.uid !== uid));
    };

    const calcLine = (item) => {
        const cxMult = item.selectedComplexity >= 0 ? Number(item.complexityTiers[item.selectedComplexity]?.multiplier || 1) : 1;
        const crMult = item.selectedCreativity >= 0 ? Number(item.creativityTiers[item.selectedCreativity]?.multiplier || 1) : 1;
        const selectedAddons = item.addons.filter(a => a.selected);
        const addonsCost = selectedAddons.reduce((s, a) => s + Number(a.addon_cost || 0), 0);
        const addonsPrice = selectedAddons.reduce((s, a) => s + Number(a.addon_price || 0), 0);

        const unitPrice = item.basePrice * cxMult * crMult + addonsPrice;
        const unitCost = item.recipeCost + addonsCost;
        const totalPrice = Math.round(unitPrice * item.quantity);
        const totalCost = Math.round(unitCost * item.quantity);
        const profit = totalPrice - totalCost;

        return { unitPrice: Math.round(unitPrice), totalPrice, totalCost, profit, cxMult, crMult };
    };

    const orderTotals = orderItems.reduce(
        (acc, item) => {
            const line = calcLine(item);
            return {
                totalPrice: acc.totalPrice + line.totalPrice,
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
            const cxLabel = item.selectedComplexity >= 0 ? item.complexityTiers[item.selectedComplexity]?.label : 'Standard';
            const crLabel = item.selectedCreativity >= 0 ? item.creativityTiers[item.selectedCreativity]?.label : 'Standard';
            const selectedAddons = item.addons.filter(a => a.selected);
            return {
                item_name: item.name,
                category: item.category,
                quantity: item.quantity,
                complexity_label: cxLabel,
                creativity_label: crLabel,
                addons_json: selectedAddons.map(a => ({ name: a.name, cost: a.addon_cost, price: a.addon_price })),
                unit_price: line.unitPrice,
                total_price: line.totalPrice,
                total_cost: line.totalCost,
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
                <p>Build an order — select items, adjust tiers & add-ons, see live profit</p>
            </div>

            {/* Add item row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Select Item from Catalog</label>
                    <select className="form-select" value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}>
                        <option value="">— Choose an item —</option>
                        {catalog.map(it => (
                            <option key={it.id} value={it.id}>
                                {it.name} ({it.category}) — Rs. {Number(it.base_price).toLocaleString()}
                            </option>
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
                                        {item.complexityTiers.length > 0 && (
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Complexity</label>
                                                <select className="form-select" value={item.selectedComplexity}
                                                    onChange={e => updateItem(item.uid, 'selectedComplexity', Number(e.target.value))}>
                                                    {item.complexityTiers.map((tier, idx) => (
                                                        <option key={idx} value={idx}>{tier.label} ({tier.multiplier}x)</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {item.creativityTiers.length > 0 && (
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Creativity</label>
                                                <select className="form-select" value={item.selectedCreativity}
                                                    onChange={e => updateItem(item.uid, 'selectedCreativity', Number(e.target.value))}>
                                                    {item.creativityTiers.map((tier, idx) => (
                                                        <option key={idx} value={idx}>{tier.label} ({tier.multiplier}x)</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Qty</label>
                                            <input className="form-input" type="number" min="1" value={item.quantity}
                                                onChange={e => updateItem(item.uid, 'quantity', Math.max(1, Number(e.target.value)))} />
                                        </div>
                                    </div>

                                    {/* Add-ons */}
                                    {item.addons.length > 0 && (
                                        <div style={{ marginBottom: 12 }}>
                                            <label className="form-label" style={{ marginBottom: 8 }}>Add-ons</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {item.addons.map((addon, addonIdx) => (
                                                    <button key={addonIdx}
                                                        className={`btn btn-sm ${addon.selected ? 'btn-accent' : 'btn-secondary'}`}
                                                        onClick={() => toggleAddon(item.uid, addonIdx)}
                                                        style={{ fontSize: '0.78rem' }}>
                                                        {addon.selected ? '✓ ' : ''}{addon.name} (+Rs. {Number(addon.addon_price).toLocaleString()})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 24, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        <span>Price: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(line.totalPrice)}</strong></span>
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
                                    <span>{formatCurrency(line.totalPrice)}</span>
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
