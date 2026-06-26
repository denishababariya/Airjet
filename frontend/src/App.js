import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './d_style.css';
import Layout from './components/Layout';

// Pages
import Dashboard      from './pages/Dashboard';
import EmployeeMaster from './pages/EmployeeMaster';
import Department     from './pages/Department';
import Designation    from './pages/Designation';
import Attendance     from './pages/Attendance';
import Payroll        from './pages/Payroll';
import Purchase       from './pages/Purchase';
import Sales          from './pages/Sales';
import SpareParts     from './pages/SpareParts';
import Warehouse      from './pages/Warehouse';
import Service        from './pages/Service';
import Accounts       from './pages/Accounts';
import Reports        from './pages/Reports';
import Profile        from './pages/Profile';
import Settings       from './pages/Settings';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';

/**
 * Map every sidebar child label → { component, defaultTab }
 * Tab value must match the tab keys used inside each page component.
 */
const PAGE_MAP = {
  // ── Dashboard ──────────────────────────────────────────────
  dashboard:           { component: Dashboard },
  'My Profile':        { component: Profile },
  'Settings':          { component: Settings },
  'Login':             { component: Login },
  'Register':          { component: Register },
  'ForgotPassword':    { component: ForgotPassword },
  'ChangePassword':    { component: ChangePassword },

  // ── Employees ──────────────────────────────────────────────
  employee:            { component: EmployeeMaster },
  'Employee Master':   { component: EmployeeMaster },
  'Department':        { component: Department },
  'Designation':       { component: Designation },

  // ── Attendance ─────────────────────────────────────────────
  attendance:          { component: Attendance, defaultTab: 'records' },
  'Check In/Out':      { component: Attendance, defaultTab: 'records' },
  'Leave Tracking':    { component: Attendance, defaultTab: 'leave' },
  'Overtime Calculation': { component: Attendance, defaultTab: 'overtime' },

  // ── Payroll ────────────────────────────────────────────────
  payroll:             { component: Payroll, defaultTab: 'salary' },
  'Salary Generation': { component: Payroll, defaultTab: 'salary' },
  'Allowances':        { component: Payroll, defaultTab: 'allowances' },
  'Deductions':        { component: Payroll, defaultTab: 'deductions' },
  'Payslip Download':  { component: Payroll, defaultTab: 'payslip' },

  // ── Purchase ───────────────────────────────────────────────
  purchase:            { component: Purchase, defaultTab: 'suppliers' },
  'Suppliers':         { component: Purchase, defaultTab: 'suppliers' },
  'Purchase Orders':   { component: Purchase, defaultTab: 'orders' },
  'GRN':               { component: Purchase, defaultTab: 'grn' },
  'Returns':           { component: Purchase, defaultTab: 'returns' },

  // ── Sales ──────────────────────────────────────────────────
  sales:               { component: Sales, defaultTab: 'customers' },
  'Customers':         { component: Sales, defaultTab: 'customers' },
  'Quotations':        { component: Sales, defaultTab: 'quotations' },
  'Sales Orders':      { component: Sales, defaultTab: 'orders' },
  'Invoices':          { component: Sales, defaultTab: 'invoices' },

  // ── Spare Parts ────────────────────────────────────────────
  spareparts:          { component: SpareParts, defaultTab: 'parts' },
  'Part Number':       { component: SpareParts, defaultTab: 'parts' },
  'Category':          { component: SpareParts, defaultTab: 'category' },
  'Brand':             { component: SpareParts, defaultTab: 'brand' },
  'Compatible Models': { component: SpareParts, defaultTab: 'models' },

  // ── Warehouse ──────────────────────────────────────────────
  warehouse:           { component: Warehouse, defaultTab: 'warehouses' },
  'Warehouses':        { component: Warehouse, defaultTab: 'warehouses' },
  'Stock Transfers':   { component: Warehouse, defaultTab: 'transfers' },
  'Stock Audits':      { component: Warehouse, defaultTab: 'audits' },

  // ── Service ────────────────────────────────────────────────
  service:             { component: Service, defaultTab: 'tickets' },
  'Service Tickets':   { component: Service, defaultTab: 'tickets' },
  'Engineer Assignment': { component: Service, defaultTab: 'assignment' },
  'Service Reports':   { component: Service, defaultTab: 'reports' },

  // ── Accounts ───────────────────────────────────────────────
  accounts:            { component: Accounts, defaultTab: 'receivables' },
  'Receivables':       { component: Accounts, defaultTab: 'receivables' },
  'Payables':          { component: Accounts, defaultTab: 'payables' },
  'Ledger':            { component: Accounts, defaultTab: 'ledger' },
  'GST Reports':       { component: Accounts, defaultTab: 'gst' },
  'Profit & Loss':     { component: Accounts, defaultTab: 'pl' },

  // ── Reports ────────────────────────────────────────────────
  reports:             { component: Reports, defaultTab: 'sales' },
  'Sales Report':      { component: Reports, defaultTab: 'sales' },
  'Purchase Report':   { component: Reports, defaultTab: 'purchase' },
  'Inventory Report':  { component: Reports, defaultTab: 'inventory' },
  'Payroll Report':    { component: Reports, defaultTab: 'payroll' },
};

function App() {
  const [activeMenu, setActiveMenu] = useState(() => {
    const saved = localStorage.getItem('activeMenu');
    return saved || 'dashboard';
  });

  const handleSetMenu = (menu) => {
    setActiveMenu(menu);
    localStorage.setItem('activeMenu', menu);
  };

  const entry = PAGE_MAP[activeMenu] || { component: Dashboard };
  const PageComponent = entry.component;
  const defaultTab    = entry.defaultTab;

  return (
    <Layout activeMenu={activeMenu} setActiveMenu={handleSetMenu}>
      {/* key forces remount when tab changes so defaultTab prop is fresh */}
      <PageComponent key={activeMenu} defaultTab={defaultTab} setActiveMenu={handleSetMenu} />
    </Layout>
  );
}

export default App;
