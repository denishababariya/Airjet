import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './d_style.css';
import Layout from './components/Layout';
import { auth } from './utils/api';
import { SearchProvider } from './context/SearchContext';
import { PermissionProvider } from './context/PermissionContext';
import { isAdminRole, isManagerRole, isHeadRole, isHRRole } from './utils/roles';

// Pages
import Dashboard        from './pages/Dashboard';
import EmployeeMaster   from './pages/EmployeeMaster';
import Department       from './pages/Department';
import Designation      from './pages/Designation';
import Attendance       from './pages/Attendance';
import QRScanner        from './pages/attendance/QRScanner';
import TodayAttendance  from './pages/attendance/TodayAttendance';
import EmployeeQRCode   from './pages/attendance/EmployeeQRCode';
import LeaveTracking    from './pages/attendance/LeaveTracking';
import LateEntryReport  from './pages/attendance/LateEntryReport';
import AttendanceReport from './pages/attendance/AttendanceReport';
import CheckInOut       from './pages/attendance/CheckInOut';
import Payroll          from './pages/Payroll';
import Purchase         from './pages/Purchase';
import Sales            from './pages/Sales';
import SpareParts       from './pages/SpareParts';
import Warehouse        from './pages/Warehouse';
import Service          from './pages/Service';
import RawMaterials     from './pages/RawMaterials';
import RawMaterialPurchases from './pages/RawMaterialPurchases';
import RawMaterialReport from './pages/RawMaterialReport';
import Accounts         from './pages/Accounts';
import Reports          from './pages/Reports';
import Profile          from './pages/Profile';
import Settings         from './pages/Settings';
import Login            from './pages/Login';
import Register         from './pages/Register';
import ForgotPassword   from './pages/ForgotPassword';
import ChangePassword   from './pages/ChangePassword';
import SearchResults    from './pages/SearchResults';
import RoleManagement   from './pages/RoleManagement';

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
  'Search':            { component: SearchResults },

  // ── Employees ──────────────────────────────────────────────
  employee:            { component: EmployeeMaster },
  'Employee Master':   { component: EmployeeMaster },
  'Department':        { component: Department },
  'Designation':       { component: Designation },

  // ── Attendance ─────────────────────────────────────────────
  attendance:                   { component: Attendance, defaultTab: 'records' },
  'Today Attendance':           { component: TodayAttendance },
  'QR Scanner':                 { component: QRScanner },
  'Leave Tracking':             { component: LeaveTracking },
  'Employee QR Codes':          { component: EmployeeQRCode },
  'Late Entry Report':          { component: LateEntryReport },
  'Attendance Report':          { component: AttendanceReport },
  'Check In/Out':               { component: CheckInOut },

  // ── Payroll ────────────────────────────────────────────────
  payroll:                      { component: Payroll, defaultTab: 'salary' },
  'Salary Generation':          { component: Payroll, defaultTab: 'salary' },
  'Allowances':                 { component: Payroll, defaultTab: 'allowances' },
  'Deductions':                 { component: Payroll, defaultTab: 'deductions' },
  'Payslip Download':           { component: Payroll, defaultTab: 'payslip' },

  // ── Purchase ───────────────────────────────────────────────
  purchase:            { component: Purchase, defaultTab: 'suppliers' },
  'Suppliers':         { component: Purchase, defaultTab: 'suppliers' },
  'Purchase Orders':   { component: Purchase, defaultTab: 'orders' },
  'GRN':               { component: Purchase, defaultTab: 'grn' },
  'Returns':           { component: Purchase, defaultTab: 'returns' },
  'Raw Materials':     { component: RawMaterials },
  'Raw Material Purchases': { component: RawMaterialPurchases },

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
  'Raw Material Report': { component: RawMaterialReport },

  // ── Role Management ────────────────────────────────────────
  'Role Management':   { component: RoleManagement },
};

// Check if user has access to admin panel
const hasAdminAccess = (role) => {
  return isAdminRole(role) || isManagerRole(role) || isHeadRole(role) || isHRRole(role);
};

const AUTH_PAGES = ['Login', 'Register', 'ForgotPassword', 'ChangePassword'];
const getStoredMenu = () => {
  const saved = localStorage.getItem('activeMenu');
  if (saved && !AUTH_PAGES.includes(saved)) {
    return saved;
  }
  return null;
};

function App() {
  const [activeMenu, setActiveMenuState] = useState(() => {
    const token = auth.getToken();
    return getStoredMenu() || (token ? 'dashboard' : 'Login');
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return auth.getCurrentUser();
  });
  const [authReady, setAuthReady] = useState(false);

  const setActiveMenu = (menu) => {
    setActiveMenuState(menu);
    if (!AUTH_PAGES.includes(menu)) {
      localStorage.setItem('activeMenu', menu);
    }
  };

  // Handle login
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setActiveMenu('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    auth.clearSession();
    setActiveMenu('Login');
  };

  // Bootstrap auth and restore the last valid page once on load.
  // We intentionally bootstrap once from persisted auth/menu state on app load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = auth.getToken();
    const savedUser = auth.getCurrentUser();
    const savedMenu = getStoredMenu();
    
    if (token && !currentUser && savedUser) {
      setCurrentUser(savedUser);
    }
    
    if (!token && !AUTH_PAGES.includes(activeMenu)) {
      setActiveMenuState('Login');
      setAuthReady(true);
      return;
    }
    
    if (token && AUTH_PAGES.includes(activeMenu)) {
      setActiveMenuState(savedMenu || 'dashboard');
    }

    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!AUTH_PAGES.includes(activeMenu) && PAGE_MAP[activeMenu]) {
      localStorage.setItem('activeMenu', activeMenu);
    }
  }, [activeMenu]);

  const entry = PAGE_MAP[activeMenu] || PAGE_MAP['dashboard'];
  const PageComponent = entry.component;
  const defaultTab    = entry.defaultTab;

  // Only show Layout for authenticated routes
  const isAuthPage = AUTH_PAGES.includes(activeMenu);

  if (!authReady) {
    return <div className="text-center py-5">Loading…</div>;
  }

  if (isAuthPage) {
    return (
      <PageComponent 
        key={activeMenu} 
        defaultTab={defaultTab} 
        setActiveMenu={setActiveMenu}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <SearchProvider>
      <PermissionProvider currentUser={currentUser}>
        <Layout
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          currentUser={currentUser}
          onLogout={handleLogout}
          hasAdminAccess={hasAdminAccess}
        >
          {/* key forces remount when tab changes so defaultTab prop is fresh */}
          <PageComponent key={activeMenu} defaultTab={defaultTab} setActiveMenu={setActiveMenu} currentUser={currentUser} />
        </Layout>
      </PermissionProvider>
    </SearchProvider>
  );
}

export default App;
