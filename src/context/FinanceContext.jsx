import { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

const STORAGE_KEY = 'caketracker_data';

const defaultData = {
  catalog: [
    { id: '1', name: 'Butter Cake', category: 'Cakes', baseCost: 800, basePrice: 1500 },
    { id: '2', name: 'Chocolate Cake', category: 'Cakes', baseCost: 1200, basePrice: 2500 },
    { id: '3', name: 'Red Velvet Cake', category: 'Cakes', baseCost: 1500, basePrice: 3000 },
    { id: '4', name: 'Fruit Platter', category: 'Platters', baseCost: 2000, basePrice: 3500 },
    { id: '5', name: 'Chocolate Platter', category: 'Platters', baseCost: 2500, basePrice: 4500 },
    { id: '6', name: 'Sweet Gift Pack', category: 'Gift Packs', baseCost: 1000, basePrice: 2000 },
    { id: '7', name: 'Premium Gift Box', category: 'Gift Packs', baseCost: 2000, basePrice: 4000 },
  ],
  invoices: [],
  expenses: [],
};

const complexityLevels = [
  { label: 'Standard', multiplier: 1.0 },
  { label: 'Moderate', multiplier: 1.25 },
  { label: 'Intricate', multiplier: 1.5 },
  { label: 'Multi-tier / Complex', multiplier: 1.8 },
  { label: 'Custom Moulding', multiplier: 2.0 },
];

const creativityLevels = [
  { label: 'Standard', multiplier: 1.0 },
  { label: 'Premium', multiplier: 1.2 },
  { label: 'Signature', multiplier: 1.4 },
  { label: 'Avant-garde', multiplier: 1.6 },
];

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultData, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return defaultData;
}

export function FinanceProvider({ children }) {
  const [data, setData] = useState(loadData);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Catalog
  const addCatalogItem = (item) => {
    const newItem = { ...item, id: Date.now().toString() };
    setData(prev => ({ ...prev, catalog: [...prev.catalog, newItem] }));
    showToast('Item added to catalog');
  };

  const updateCatalogItem = (id, updated) => {
    setData(prev => ({
      ...prev,
      catalog: prev.catalog.map(i => i.id === id ? { ...i, ...updated } : i),
    }));
    showToast('Catalog item updated');
  };

  const deleteCatalogItem = (id) => {
    setData(prev => ({
      ...prev,
      catalog: prev.catalog.filter(i => i.id !== id),
    }));
    showToast('Item removed from catalog');
  };

  // Invoices
  const addInvoice = (invoice) => {
    const newInvoice = {
      ...invoice,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setData(prev => ({ ...prev, invoices: [newInvoice, ...prev.invoices] }));
    showToast('Invoice created & income recorded');
    return newInvoice;
  };

  const updateInvoiceStatus = (id, status) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(i => i.id === id ? { ...i, status } : i),
    }));
    showToast(`Invoice marked as ${status}`);
  };

  const deleteInvoice = (id) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
    }));
    showToast('Invoice deleted');
  };

  // Expenses
  const addExpense = (expense) => {
    const newExpense = { ...expense, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
    showToast('Expense recorded');
  };

  const deleteExpense = (id) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
    showToast('Expense removed');
  };

  // Computed stats
  const getStats = () => {
    const totalIncome = data.invoices.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
    const totalExpenses = data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalCost = data.invoices.reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
    return {
      totalIncome,
      totalExpenses,
      totalCost,
      grossProfit: totalIncome - totalCost,
      netProfit: totalIncome - totalCost - totalExpenses,
      orderCount: data.invoices.length,
    };
  };

  return (
    <FinanceContext.Provider value={{
      ...data,
      complexityLevels,
      creativityLevels,
      addCatalogItem, updateCatalogItem, deleteCatalogItem,
      addInvoice, updateInvoiceStatus, deleteInvoice,
      addExpense, deleteExpense,
      getStats, toast, showToast,
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
