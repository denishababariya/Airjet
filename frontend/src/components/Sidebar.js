import React, { useState } from 'react';
import {
  MdDashboard, MdPeople, MdAccessTime, MdPayments,
  MdShoppingCart, MdPointOfSale, MdInventory2, MdWarehouse,
  MdBuildCircle, MdAccountBalance, MdBarChart, MdChevronRight,
} from 'react-icons/md';

const menuConfig = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: <MdDashboard />, id: 'dashboard', allowedRoles: ['Admin', 'Manager', 'Head', 'HR', 'User'] },
    ],
  },
  {
    section: 'HR & Payroll',
    items: [
      {
        label: 'Employees', icon: <MdPeople />, id: 'employee',
        children: ['Employee Master', 'Department', 'Designation'],
        allowedRoles: ['Admin', 'Manager', 'Head', 'HR'],
      },
      {
        label: 'Attendance', icon: <MdAccessTime />, id: 'attendance',
        children: ['Check In/Out', 'Leave Tracking', 'Overtime Calculation'],
        allowedRoles: ['Admin', 'Manager', 'Head', 'HR', 'User'],
      },
      {
        label: 'Payroll', icon: <MdPayments />, id: 'payroll',
        children: ['Salary Generation', 'Allowances', 'Deductions', 'Payslip Download'],
        allowedRoles: ['Admin', 'Manager', 'HR'],
      },
    ],
  },
  {
    section: 'Trade',
    items: [
      {
        label: 'Purchase', icon: <MdShoppingCart />, id: 'purchase',
        children: ['Suppliers', 'Purchase Orders', 'GRN', 'Returns'],
        allowedRoles: ['Admin', 'Manager', 'Head'],
      },
      {
        label: 'Sales', icon: <MdPointOfSale />, id: 'sales',
        children: ['Customers', 'Quotations', 'Sales Orders', 'Invoices'],
        allowedRoles: ['Admin', 'Manager', 'Head'],
      },
    ],
  },
  {
    section: 'Inventory',
    items: [
      {
        label: 'Spare Parts', icon: <MdInventory2 />, id: 'spareparts',
        children: ['Part Number', 'Category', 'Brand', 'Compatible Models'],
        allowedRoles: ['Admin', 'Manager', 'Head'],
      },
      {
        label: 'Warehouse', icon: <MdWarehouse />, id: 'warehouse',
        children: ['Warehouses', 'Stock Transfers', 'Stock Audits'],
        allowedRoles: ['Admin', 'Manager', 'Head'],
      },
    ],
  },
  {
    section: 'Operations',
    items: [
      {
        label: 'Service', icon: <MdBuildCircle />, id: 'service',
        children: ['Service Tickets', 'Engineer Assignment', 'Service Reports'],
        allowedRoles: ['Admin', 'Manager', 'Head', 'User'],
      },
      {
        label: 'Accounts & GST', icon: <MdAccountBalance />, id: 'accounts',
        children: ['Receivables', 'Payables', 'Ledger', 'GST Reports', 'Profit & Loss'],
        allowedRoles: ['Admin', 'Manager'],
      },
      {
        label: 'Reports', icon: <MdBarChart />, id: 'reports',
        children: ['Sales Report', 'Purchase Report', 'Inventory Report', 'Payroll Report'],
        allowedRoles: ['Admin', 'Manager', 'Head', 'HR'],
      },
    ],
  },
];

const Sidebar = ({ collapsed, mobileOpen, activeMenu, setActiveMenu, currentUser, hasAdminAccess }) => {
  // Only ONE menu open at a time — store the single open id (or null)
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (id) => {
    // If already open → close it; else open this one and close previous
    setOpenMenu(prev => (prev === id ? null : id));
  };

  const handleItemClick = (id, hasChildren) => {
    if (hasChildren) {
      toggleMenu(id);
    } else {
      setActiveMenu(id);
    }
  };

  const sidebarClass = [
    'd_sidebar',
    collapsed ? 'd_collapsed' : '',
    mobileOpen ? 'd_mobile_open' : '',
  ].filter(Boolean).join(' ');

  const userRole = currentUser?.role || 'User';
  const userName = currentUser?.employee?.name || 'User';

  return (
    <aside className={sidebarClass}>
      {/* Brand */}
      <div className="d_sidebar_brand">
        <div className="d_brand_logo"><img src={require('../assests/favicon.ico')} alt="Logo" width={30} /></div>
        <div className="d_brand_text">
          <span className="d_brand_title">AIRJET ERP</span>
          <span className="d_brand_sub">Spare Parts</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="d_sidebar_nav">
        {menuConfig.map((section) => {
          // Check if section has any visible items
          const hasVisibleItems = section.items.some(item => item.allowedRoles.includes(userRole));
          if (!hasVisibleItems) return null;

          return (
            <div key={section.section}>
              <div className="d_section_title">{section.section}</div>

              {section.items.map((item) => {
                if (!item.allowedRoles.includes(userRole)) return null;

                const hasChildren = item.children && item.children.length > 0;
                const isOpen      = openMenu === item.id;   // ← single open check
                const isActive    = activeMenu === item.id;

                return (
                  <div key={item.id} className="d_nav_item">
                    <div
                      className={[
                        'd_nav_link',
                        isActive ? 'd_active' : '',
                        isOpen   ? 'd_open'   : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleItemClick(item.id, hasChildren)}
                      title={collapsed ? item.label : ''}
                    >
                      <span className="d_nav_icon">{item.icon}</span>
                      <span className="d_nav_label">{item.label}</span>
                      {hasChildren && (
                        <span className="d_nav_arrow">
                          <MdChevronRight />
                        </span>
                      )}
                    </div>

                    {hasChildren && (
                      <div className={`d_submenu ${isOpen ? 'd_open' : ''}`}>
                        {item.children.map((child) => (
                          <div
                            key={child}
                            className={`d_submenu_link ${activeMenu === child ? 'd_active' : ''}`}
                            onClick={() => setActiveMenu(child)}
                          >
                            <span className="d_submenu_dot" />
                            {child}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="d_sidebar_footer" onClick={() => setActiveMenu('My Profile')} style={{ cursor: 'pointer' }}>
        <div className="d_sidebar_footer_avatar">{userName.charAt(0).toUpperCase()}</div>
        <div className="d_sidebar_footer_info">
          <div className="d_sidebar_footer_name">{userName}</div>
          <div className="d_sidebar_footer_role">{userRole}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
