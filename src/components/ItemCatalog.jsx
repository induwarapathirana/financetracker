import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

const categories = ['Cakes', 'Platters', 'Gift Packs'];

export default function ItemCatalog() {
    const { catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem } = useFinance();
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', category: 'Cakes', baseCost: '', basePrice: '' });
    const [filterCat, setFilterCat] = useState('All');

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: '', category: 'Cakes', baseCost: '', basePrice: '' });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({ name: item.name, category: item.category, baseCost: item.baseCost, basePrice: item.basePrice });
        setShowModal(true);
    };

    const handleSave = () => {
        if (!form.name || !form.baseCost || !form.basePrice) return;
        const payload = { name: form.name, category: form.category, baseCost: Number(form.baseCost), basePrice: Number(form.basePrice) };
        if (editItem) {
            updateCatalogItem(editItem.id, payload);
        } else {
            addCatalogItem(payload);
        }
        setShowModal(false);
    };

    const filtered = filterCat === 'All' ? catalog : catalog.filter(i => i.category === filterCat);
    const formatCurrency = (v) => `Rs. ${Number(v).toLocaleString()}`;

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Item Catalog</h2>
                <p>Manage your products — set base cost and selling price</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="ledger-tabs">
                    {['All', ...categories].map(cat => (
                        <button key={cat} className={`ledger-tab ${filterCat === cat ? 'active' : ''}`}
                            onClick={() => setFilterCat(cat)}>{cat}</button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={openAdd}>＋ Add Item</button>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎂</div>
                    <p>No items in this category yet. Add your first product!</p>
                </div>
            ) : (
                <div className="catalog-grid">
                    {filtered.map((item, idx) => (
                        <div key={item.id} className="catalog-item" style={{ animationDelay: `${idx * 0.06}s` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="catalog-item-name">{item.name}</div>
                                <span className="badge badge-info">{item.category}</span>
                            </div>
                            <div className="catalog-item-detail">
                                <span>Base Cost</span>
                                <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(item.baseCost)}</span>
                            </div>
                            <div className="catalog-item-detail">
                                <span>Base Price</span>
                                <span style={{ color: 'var(--color-success)' }}>{formatCurrency(item.basePrice)}</span>
                            </div>
                            <div className="catalog-item-detail">
                                <span>Base Profit</span>
                                <span style={{ color: 'var(--color-gold)' }}>{formatCurrency(item.basePrice - item.baseCost)}</span>
                            </div>
                            <div className="catalog-item-actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteCatalogItem(item.id)}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit Item' : 'Add New Item'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Item Name</label>
                            <input className="form-input" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Chocolate Drip Cake" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-select" value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Base Cost (Rs.)</label>
                                <input className="form-input" type="number" value={form.baseCost}
                                    onChange={e => setForm({ ...form, baseCost: e.target.value })}
                                    placeholder="e.g. 1200" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Base Price (Rs.)</label>
                                <input className="form-input" type="number" value={form.basePrice}
                                    onChange={e => setForm({ ...form, basePrice: e.target.value })}
                                    placeholder="e.g. 2500" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editItem ? 'Update' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
