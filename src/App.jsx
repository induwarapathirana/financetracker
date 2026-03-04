import { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Dashboard from './components/Dashboard';
import ItemCatalog from './components/ItemCatalog';
import PricingCalculator from './components/PricingCalculator';
import InvoiceMaker from './components/InvoiceMaker';
import Ledger from './components/Ledger';
import './index.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'catalog', label: 'Item Catalog', icon: '🎂' },
  { id: 'calculator', label: 'Pricing Calculator', icon: '🧮' },
  { id: 'ledger', label: 'Finance Ledger', icon: '📒' },
];

function AppContent() {
  const { toast } = useFinance();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoiceOrderData, setInvoiceOrderData] = useState(null);

  const handleCreateInvoice = (orderData) => {
    setInvoiceOrderData(orderData);
    setPage('invoice');
  };

  const handleBackFromInvoice = () => {
    setInvoiceOrderData(null);
    setPage('calculator');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard />;
      case 'catalog':
        return <ItemCatalog />;
      case 'calculator':
        return <PricingCalculator onCreateInvoice={handleCreateInvoice} />;
      case 'invoice':
        return invoiceOrderData
          ? <InvoiceMaker orderData={invoiceOrderData} onBack={handleBackFromInvoice} />
          : <PricingCalculator onCreateInvoice={handleCreateInvoice} />;
      case 'ledger':
        return <Ledger />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🎂</div>
          <div>
            <h1>Sweet Delights</h1>
            <p>Finance Tracker</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            © 2026 Sweet Delights
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default App;
