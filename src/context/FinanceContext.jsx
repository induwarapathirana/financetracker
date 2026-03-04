/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [session, setSession] = useState(null);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── INIT AUTH SESSION ───
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen to login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Clear data on logout
        setRawMaterials([]);
        setCatalog([]);
        setInvoices([]);
        setExpenses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── LOAD DATA ONLY IF LOGGED IN ───
  const loadAll = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [matRes, catRes, invRes, expRes] = await Promise.all([
        supabase.from('raw_materials').select('*').order('created_at', { ascending: false }),
        supabase.from('catalog_items').select(`
          *,
          item_recipes ( *, raw_materials (*) ),
          item_multipliers ( * ),
          item_addons ( * )
        `).order('created_at', { ascending: false }),
        supabase.from('invoices').select(`
          *,
          invoice_line_items ( * )
        `).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      ]);

      if (matRes.data) setRawMaterials(matRes.data);
      if (catRes.data) {
        const items = catRes.data.map(item => ({
          ...item,
          item_multipliers: (item.item_multipliers || []).sort((a, b) => a.sort_order - b.sort_order),
        }));
        setCatalog(items);
      }
      if (invRes.data) setInvoices(invRes.data);
      if (expRes.data) setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
      showToast('Failed to load data', 'error');
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAll();
    }
  }, [session, loadAll]);

  // ─── RAW MATERIALS ───
  const addRawMaterial = async (mat) => {
    const { data, error } = await supabase.from('raw_materials').insert(mat).select().single();
    if (error) { showToast(error.message, 'error'); return null; }
    setRawMaterials(prev => [data, ...prev]);
    showToast('Ingredient added');
    return data;
  };

  const updateRawMaterial = async (id, updates) => {
    const { error } = await supabase.from('raw_materials').update(updates).eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    showToast('Ingredient updated');
  };

  const deleteRawMaterial = async (id) => {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setRawMaterials(prev => prev.filter(m => m.id !== id));
    showToast('Ingredient removed');
  };

  // ─── CATALOG ITEMS ───
  const addCatalogItem = async (item, recipes, multipliers, addons) => {
    const { data, error } = await supabase.from('catalog_items').insert({
      name: item.name,
      category: item.category,
      base_price: item.base_price,
      description: item.description || '',
    }).select().single();
    if (error) { showToast(error.message, 'error'); return null; }

    if (recipes?.length) {
      await supabase.from('item_recipes').insert(
        recipes.map(r => ({ item_id: data.id, material_id: r.material_id, quantity: r.quantity }))
      );
    }

    if (multipliers?.length) {
      await supabase.from('item_multipliers').insert(
        multipliers.map((m, idx) => ({ item_id: data.id, type: m.type, label: m.label, multiplier: m.multiplier, sort_order: idx }))
      );
    }

    if (addons?.length) {
      await supabase.from('item_addons').insert(
        addons.map(a => ({ item_id: data.id, name: a.name, addon_cost: a.addon_cost, addon_price: a.addon_price }))
      );
    }

    showToast('Product added to catalog');
    await loadAll();
    return data;
  };

  const updateCatalogItem = async (id, item, recipes, multipliers, addons) => {
    const { error } = await supabase.from('catalog_items').update({
      name: item.name,
      category: item.category,
      base_price: item.base_price,
      description: item.description || '',
    }).eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }

    await supabase.from('item_recipes').delete().eq('item_id', id);
    if (recipes?.length) {
      await supabase.from('item_recipes').insert(
        recipes.map(r => ({ item_id: id, material_id: r.material_id, quantity: r.quantity }))
      );
    }

    await supabase.from('item_multipliers').delete().eq('item_id', id);
    if (multipliers?.length) {
      await supabase.from('item_multipliers').insert(
        multipliers.map((m, idx) => ({ item_id: id, type: m.type, label: m.label, multiplier: m.multiplier, sort_order: idx }))
      );
    }

    await supabase.from('item_addons').delete().eq('item_id', id);
    if (addons?.length) {
      await supabase.from('item_addons').insert(
        addons.map(a => ({ item_id: id, name: a.name, addon_cost: a.addon_cost, addon_price: a.addon_price }))
      );
    }

    showToast('Product updated');
    await loadAll();
  };

  const deleteCatalogItem = async (id) => {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setCatalog(prev => prev.filter(i => i.id !== id));
    showToast('Product removed');
  };

  // ─── INVOICES ───
  const addInvoice = async (invoice, lineItems) => {
    const { data, error } = await supabase.from('invoices').insert({
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone || '',
      delivery_date: invoice.delivery_date || null,
      notes: invoice.notes || '',
      total_price: invoice.total_price,
      total_cost: invoice.total_cost,
      total_profit: invoice.total_profit,
      status: 'pending',
    }).select().single();
    if (error) { showToast(error.message, 'error'); return null; }

    if (lineItems?.length) {
      await supabase.from('invoice_line_items').insert(
        lineItems.map(li => ({ ...li, invoice_id: data.id }))
      );
    }

    showToast('Invoice created & income recorded');
    await loadAll();
    return data;
  };

  const updateInvoiceStatus = async (id, status) => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    showToast(`Invoice marked as ${status}`);
  };

  const deleteInvoice = async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setInvoices(prev => prev.filter(i => i.id !== id));
    showToast('Invoice deleted');
  };

  // ─── EXPENSES ───
  const addExpense = async (expense) => {
    const { data, error } = await supabase.from('expenses').insert({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      invoice_id: expense.invoice_id || null,
    }).select().single();
    if (error) { showToast(error.message, 'error'); return null; }
    setExpenses(prev => [data, ...prev]);
    showToast('Expense recorded');
    return data;
  };

  const deleteExpense = async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense removed');
  };

  // ─── COMPUTED STATS ───
  const getStats = () => {
    const totalIncome = invoices.reduce((s, i) => s + Number(i.total_price || 0), 0);
    const totalCost = invoices.reduce((s, i) => s + Number(i.total_cost || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return {
      totalIncome,
      totalCost,
      totalExpenses,
      grossProfit: totalIncome - totalCost,
      netProfit: totalIncome - totalCost - totalExpenses,
      orderCount: invoices.length,
    };
  };

  const getRecipeCost = (item) => {
    if (!item.item_recipes?.length) return 0;
    return item.item_recipes.reduce((sum, r) => {
      const unitCost = r.raw_materials?.unit_cost || 0;
      return sum + (Number(unitCost) * Number(r.quantity));
    }, 0);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <FinanceContext.Provider value={{
      session, logout,
      rawMaterials, catalog, invoices, expenses, loading,
      addRawMaterial, updateRawMaterial, deleteRawMaterial,
      addCatalogItem, updateCatalogItem, deleteCatalogItem,
      addInvoice, updateInvoiceStatus, deleteInvoice,
      addExpense, deleteExpense,
      getStats, getRecipeCost,
      toast, showToast, loadAll,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
