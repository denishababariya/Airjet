import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './d_style.css';
import Layout from './components/Layout';

// Pages
import Dashboard       from './pages/Dashboard';
import EmployeeMaster  from './pages/EmployeeMaster';
import Department      from './pages/Department';
import Designation     from './pages/Designation';
import SalaryInformation from './pages/SalaryInformation';
import DocumentsStorage  from './pages/DocumentsStorage';
import RolePermissions from './pages/RolePermissions';
import Attendance      from './pages/Attendance';
import Payroll         from './pages/Payroll';
import Purchase        from './pages/Purchase';
import Sales           from './pages/Sales';
import SpareParts      from './pages/SpareParts';
import Warehouse       from './pages/Warehouse';
import Service         from './pages/Service';
import Accounts        from './pages/Accounts';
import Reports         from './pages/Reports';

const renderPage = (activeMenu) => {
  switch (activeMenu) {
    // Dashboard
    case 'dashboard':           return <Dashboard />;

    // Employee Management
    case 'Employee Master':     return <EmployeeMaster />;
    case 'Department':          return <Department />;
    case 'Designation':         return <Designation />;
    case 'Salary Information':  return <SalaryInformation />;
    case 'Documents Storage':   return <DocumentsStorage />;

    // Role & Permissions (all sub-items → same page)
    case 'roles':
    case 'Super Admin':
    case 'Admin':
    case 'Purchase Manager':
    case 'Sales Manager':
    case 'Inventory Manager':
    case 'Accountant':
    case 'HR Manager':          return <RolePermissions />;

    // Attendance
    case 'attendance':
    case 'Check In/Out':
    case 'Leave Tracking':
    case 'Late Entry Report':
    case 'Overtime Calculation': return <Attendance />;

    // Payroll
    case 'payroll':
    case 'Salary Generation':
    case 'Allowances':
    case 'Deductions':
    case 'Payslip Download':    return <Payroll />;

    // Purchase
    case 'purchase':
    case 'Suppliers':
    case 'Purchase Orders':
    case 'GRN':
    case 'Returns':             return <Purchase />;

    // Sales
    case 'sales':
    case 'Customers':
    case 'Quotations':
    case 'Sales Orders':
    case 'Invoices':            return <Sales />;

    // Spare Parts
    case 'spareparts':
    case 'Part Number':
    case 'Category':
    case 'Brand':
    case 'Compatible Machine Models': return <SpareParts />;

    // Warehouse
    case 'warehouse':
    case 'Multiple Warehouses':
    case 'Stock Transfers':
    case 'Stock Audits':        return <Warehouse />;

    // Service
    case 'service':
    case 'Complaints':
    case 'Service Tickets':
    case 'Engineer Assignment':
    case 'Service Reports':     return <Service />;

    // Accounts
    case 'accounts':
    case 'Receivables':
    case 'Payables':
    case 'Ledger':
    case 'GST Reports':
    case 'Profit & Loss':       return <Accounts />;

    // Reports
    case 'reports':
    case 'Sales':
    case 'Purchase':
    case 'Inventory':
    case 'Employee':
    case 'Attendance':
    case 'Payroll':
    case 'Service':             return <Reports />;

    default:                    return <Dashboard />;
  }
};

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <Layout activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
      {renderPage(activeMenu)}
    </Layout>
  );
}

export default App;
