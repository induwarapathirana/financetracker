import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

const CATEGORIES = ['Cakes', 'Platters', 'Gift Packs'];

export default function ItemCatalog() {
    const { catalog, rawMaterials, addCatalogItem, updateCatalogItem, deleteCatalogItem, getRecipeCost } = useFinance();
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [filterCat, setFilterCat] = useState('All');

    // Form state
    const [form, setForm] = useState({ name: '', category: 'Cakes', base_price: '', description: '' });
    const [recipes, setRecipes] = useState([]);
    const [multipliers, setMultipliers] = useState([]);
    const [addons, setAddons] = useState([]);

    const formatCurrency = (v) => `Rs. ${Number(v).toLocaleString()}`;

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: '', category: 'Cakes', base_price: '', description: '' });
        setRecipes([]);
        setMultipliers([
            { type: 'complexity', label: 'Standard', multiplier: 1.0 },
            { type: 'creativity', label: 'Standard', multiplier: 1.0 },
        ]);
        setAddons([]);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            name: item.name,
            category: item.category,
            base_price: item.base_price,
            description: item.description || '',
        });
        setRecipes((item.item_recipes || []).map(r => ({
            material_id: r.material_id,
            quantity: r.quantity,
        })));
        setMultipliers((item.item_multipliers || []).map(m => ({
            type: m.type,
            label: m.label,
            multiplier: m.multiplier,
        })));
        setAddons((item.item_addons || []).map(a => ({
            name: a.name,
            addon_cost: a.addon_cost,
            addon_price: a.addon_price,
        })));
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.base_price) return;
        const payload = {
            name: form.name,
            category: form.category,
            base_price: Number(form.base_price),
            description: form.description,
        };
        if (editItem) {
            await updateCatalogItem(editItem.id, payload, recipes, multipliers, addons);
        } else {
            await addCatalogItem(payload, recipes, multipliers, addons);
        }
        setShowModal(false);
    };

    // Recipe helpers
    const addRecipeLine = () => setRecipes(prev => [...prev, { material_id: '', quantity: '' }]);
    const updateRecipe = (idx, field, val) => setRecipes(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const removeRecipe = (idx) => setRecipes(prev => prev.filter((_, i) => i !== idx));

    // Multiplier helpers
    const addMultiplier = (type) => setMultipliers(prev => [...prev, { type, label: '', multiplier: 1.0 }]);
    const updateMultiplier = (idx, field, val) => setMultipliers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
    const removeMultiplier = (idx) => setMultipliers(prev => prev.filter((_, i) => i !== idx));

    // Addon helpers
    const addAddon = () => setAddons(prev => [...prev, { name: '', addon_cost: '', addon_price: '' }]);
    const updateAddon = (idx, field, val) => setAddons(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));
    const removeAddon = (idx) => setAddons(prev => prev.filter((_, i) => i !== idx));

    // Calc recipe cost for form preview
    const formRecipeCost = recipes.reduce((sum, r) => {
        const mat = rawMaterials.find(m => m.id === r.material_id);
        if (!mat) return sum;
        return sum + Number(mat.unit_cost) * Number(r.quantity || 0);
    }, 0);

    const filtered = filterCat === 'All' ? catalog : catalog.filter(i => i.category === filterCat);

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Item Catalog</h2>
                <p>Manage products with ingredient-based costing and custom pricing tiers</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="ledger-tabs">
                    {['All', ...CATEGORIES].map(cat => (
                        <button key={cat} className={`ledger-tab ${filterCat === cat ? 'active' : ''}`}
                            onClick={() => setFilterCat(cat)}>{cat}</button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={openAdd}>＋ Add Product</button>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎂</div>
                    <p>No products yet. Add your first item with recipes and pricing tiers!</p>
                </div>
            ) : (
                <div className="catalog-grid">
                    {filtered.map((item, idx) => {
                        const recipeCost = getRecipeCost(item);
                        const complexityTiers = (item.item_multipliers || []).filter(m => m.type === 'complexity');
                        const creativityTiers = (item.item_multipliers || []).filter(m => m.type === 'creativity');
                        const itemAddons = item.item_addons || [];

                        return (
                            <div key={item.id} className="catalog-item" style={{ animationDelay: `${idx * 0.06}s` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className="catalog-item-name">{item.name}</div>
                                    <span className="badge badge-info">{item.category}</span>
                                </div>

                                <div className="catalog-item-detail">
                                    <span>Recipe Cost</span>
                                    <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(recipeCost)}</span>
                                </div>
                                <div className="catalog-item-detail">
                                    <span>Base Price</span>
                                    <span style={{ color: 'var(--color-success)' }}>{formatCurrency(item.base_price)}</span>
                                </div>
                                <div className="catalog-item-detail">
                                    <span>Base Profit</span>
                                    <span style={{ color: 'var(--color-gold)' }}>{formatCurrency(Number(item.base_price) - recipeCost)}</span>
                                </div>

                                {complexityTiers.length > 0 && (
                                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        <strong>Complexity:</strong> {complexityTiers.map(t => `${t.label} (${t.multiplier}x)`).join(' · ')}
                                    </div>
                                )}
                                {creativityTiers.length > 0 && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        <strong>Creativity:</strong> {creativityTiers.map(t => `${t.label} (${t.multiplier}x)`).join(' · ')}
                                    </div>
                                )}
                                {itemAddons.length > 0 && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        <strong>Add-ons:</strong> {itemAddons.map(a => a.name).join(', ')}
                                    </div>
                                )}

                                <div className="catalog-item-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => deleteCatalogItem(item.id)}>🗑️ Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── PRODUCT MODAL ─── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit Product' : 'Add New Product'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {/* Basic Info */}
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Product Name</label>
                                <input className="form-input" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Chocolate Drip Cake" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Base Selling Price (Rs.)</label>
                                <input className="form-input" type="number" value={form.base_price}
                                    onChange={e => setForm({ ...form, base_price: e.target.value })}
                                    placeholder="e.g. 2500" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (optional)</label>
                                <input className="form-input" value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Short description" />
                            </div>
                        </div>

                        {/* ─── RECIPE SECTION ─── */}
                        <div style={{ margin: '20px 0 8px', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span className="form-label" style={{ margin: 0 }}>🧾 Recipe (Ingredients)</span>
                                <button className="btn btn-secondary btn-sm" onClick={addRecipeLine}>+ Ingredient</button>
                            </div>
                            {recipes.map((r, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                    <select className="form-select" style={{ flex: 2 }} value={r.material_id}
                                        onChange={e => updateRecipe(idx, 'material_id', e.target.value)}>
                                        <option value="">Select ingredient</option>
                                        {rawMaterials.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} (Rs. {m.unit_cost}/{m.unit})</option>
                                        ))}
                                    </select>
                                    <input className="form-input" style={{ flex: 1 }} type="number" placeholder="Qty"
                                        value={r.quantity} onChange={e => updateRecipe(idx, 'quantity', e.target.value)} />
                                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeRecipe(idx)}>✕</button>
                                </div>
                            ))}
                            {recipes.length > 0 && (
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent)', marginTop: 4 }}>
                                    Calculated Recipe Cost: {formatCurrency(formRecipeCost)}
                                </div>
                            )}
                        </div>

                        {/* ─── MULTIPLIERS SECTION ─── */}
                        <div style={{ margin: '16px 0 8px', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span className="form-label" style={{ margin: 0 }}>⚙️ Pricing Tiers</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addMultiplier('complexity')}>+ Complexity</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addMultiplier('creativity')}>+ Creativity</button>
                                </div>
                            </div>
                            {multipliers.map((m, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                    <span className={`badge ${m.type === 'complexity' ? 'badge-warning' : 'badge-success'}`} style={{ minWidth: 80, textAlign: 'center' }}>
                                        {m.type}
                                    </span>
                                    <input className="form-input" style={{ flex: 2 }} placeholder="Label (e.g. Fondant)"
                                        value={m.label} onChange={e => updateMultiplier(idx, 'label', e.target.value)} />
                                    <input className="form-input" style={{ flex: 1 }} type="number" step="0.1" placeholder="×"
                                        value={m.multiplier} onChange={e => updateMultiplier(idx, 'multiplier', e.target.value)} />
                                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeMultiplier(idx)}>✕</button>
                                </div>
                            ))}
                        </div>

                        {/* ─── ADD-ONS SECTION ─── */}
                        <div style={{ margin: '16px 0 8px', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span className="form-label" style={{ margin: 0 }}>✨ Add-ons</span>
                                <button className="btn btn-secondary btn-sm" onClick={addAddon}>+ Add-on</button>
                            </div>
                            {addons.map((a, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                    <input className="form-input" style={{ flex: 2 }} placeholder="Add-on name"
                                        value={a.name} onChange={e => updateAddon(idx, 'name', e.target.value)} />
                                    <input className="form-input" style={{ flex: 1 }} type="number" placeholder="Cost"
                                        value={a.addon_cost} onChange={e => updateAddon(idx, 'addon_cost', e.target.value)} />
                                    <input className="form-input" style={{ flex: 1 }} type="number" placeholder="Price"
                                        value={a.addon_price} onChange={e => updateAddon(idx, 'addon_price', e.target.value)} />
                                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeAddon(idx)}>✕</button>
                                </div>
                            ))}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editItem ? 'Update Product' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
