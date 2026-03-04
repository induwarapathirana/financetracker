import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'packs', 'boxes', 'sheets', 'rolls'];

export default function RawMaterials() {
    const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useFinance();
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', unit: 'kg', unit_cost: '', supplier: '' });
    const [search, setSearch] = useState('');

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: '', unit: 'kg', unit_cost: '', supplier: '' });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({ name: item.name, unit: item.unit, unit_cost: item.unit_cost, supplier: item.supplier || '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.unit_cost) return;
        const payload = { name: form.name, unit: form.unit, unit_cost: Number(form.unit_cost), supplier: form.supplier };
        if (editItem) {
            await updateRawMaterial(editItem.id, payload);
        } else {
            await addRawMaterial(payload);
        }
        setShowModal(false);
    };

    const filtered = rawMaterials.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.supplier || '').toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (v) => `Rs. ${Number(v).toLocaleString()}`;

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Raw Materials & Ingredients</h2>
                <p>Manage your ingredient inventory and track unit costs</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
                <input className="form-input" style={{ maxWidth: 320 }}
                    placeholder="🔍 Search ingredients..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                <button className="btn btn-primary" onClick={openAdd}>＋ Add Ingredient</button>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🧈</div>
                    <p>No ingredients yet. Add your raw materials to start building recipes!</p>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Unit</th>
                                    <th>Cost per Unit</th>
                                    <th>Supplier</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(mat => (
                                    <tr key={mat.id}>
                                        <td style={{ fontWeight: 600 }}>{mat.name}</td>
                                        <td><span className="badge badge-info">{mat.unit}</span></td>
                                        <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{formatCurrency(mat.unit_cost)}/{mat.unit}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{mat.supplier || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(mat)}>✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteRawMaterial(mat.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ingredient Name</label>
                            <input className="form-input" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. All-Purpose Flour" />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Unit</label>
                                <select className="form-select" value={form.unit}
                                    onChange={e => setForm({ ...form, unit: e.target.value })}>
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cost per Unit (Rs.)</label>
                                <input className="form-input" type="number" value={form.unit_cost}
                                    onChange={e => setForm({ ...form, unit_cost: e.target.value })}
                                    placeholder="e.g. 350" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Supplier (optional)</label>
                            <input className="form-input" value={form.supplier}
                                onChange={e => setForm({ ...form, supplier: e.target.value })}
                                placeholder="e.g. Lanka Baking Supplies" />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editItem ? 'Update' : 'Add Ingredient'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
