import React, { useState } from 'react';
import {
  MdDashboard, MdPeople, MdSecurity, MdAccessTime, MdPayments,
  MdShoppingCart, MdPointOfSale, MdInventory2, MdWarehouse,
  MdBuildCircle, MdAccountBalance, MdBarChart, MdChevronRight,
  MdKeyboardArrowDown, MdSettings, MdLogout
} from 'react-icons/md';
import { FaGear } from 'react-icons/fa6';

const menuConfig = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: <MdDashboard />, id: 'dashboard' },
    ],
  },
  {
    section: 'HR & Payroll',
    items: [
      {
        label: 'Employee Management', icon: <MdPeople />, id: 'employee',
        children: ['Employee Master', 'Department', 'Designation', 'Salary Information', 'Documents Storage'],
      },
      {
        label: 'Role & Permissions', icon: <MdSecurity />, id: 'roles',
        children: ['Super Admin', 'Admin', 'Purchase Manager', 'Sales Manager', 'Inventory Manager', 'Accountant', 'HR Manager'],
      },
      {
        label: 'Attendance', icon: <MdAccessTime />, id: 'attendance',
        children: ['Check In/Out', 'Leave Tracking', 'Late Entry Report', 'Overtime Calculation'],
      },
      {
        label: 'Payroll', icon: <MdPayments />, id: 'payroll',
        children: ['Salary Generation', 'Allowances', 'Deductions', 'Payslip Download'],
      },
    ],
  },
  {
    section: 'Trade',
    items: [
      {
        label: 'Purchase', icon: <MdShoppingCart />, id: 'purchase',
        children: ['Suppliers', 'Purchase Orders', 'GRN', 'Returns'],
      },
      {
        label: 'Sales', icon: <MdPointOfSale />, id: 'sales',
        children: ['Customers', 'Quotations', 'Sales Orders', 'Invoices'],
      },
    ],
  },
  {
    section: 'Inventory',
    items: [
      {
        label: 'Spare Parts', icon: <MdInventory2 />, id: 'spareparts',
        children: ['Part Number', 'Category', 'Brand', 'Compatible Machine Models'],
      },
      {
        label: 'Warehouse', icon: <MdWarehouse />, id: 'warehouse',
        children: ['Multiple Warehouses', 'Stock Transfers', 'Stock Audits'],
      },
    ],
  },
  {
    section: 'Operations',
    items: [
      {
        label: 'Service', icon: <MdBuildCircle />, id: 'service',
        children: ['Complaints', 'Service Tickets', 'Engineer Assignment', 'Service Reports'],
      },
      {
        label: 'Accounts & GST', icon: <MdAccountBalance />, id: 'accounts',
        children: ['Receivables', 'Payables', 'Ledger', 'GST Reports', 'Profit & Loss'],
      },
      {
        label: 'Reports', icon: <MdBarChart />, id: 'reports',
        children: ['Sales', 'Purchase', 'Inventory', 'Employee', 'Attendance', 'Payroll', 'Service'],
      },
    ],
  },
];

const Sidebar = ({ collapsed, mobileOpen, activeMenu, setActiveMenu }) => {
  const [openMenus, setOpenMenus] = useState({ dashboard: false });

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
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
    mobileOpen  ? 'd_mobile_open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass}>
      {/* Brand */}
      <div className="d_sidebar_brand">
        <div className="d_brand_logo">AJ</div>
        <div className="d_brand_text">
          <span className="d_brand_title">AIRJET ERP</span>
          <span className="d_brand_sub">Spare Parts</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="d_sidebar_nav">
        {menuConfig.map((section) => (
          <div key={section.section}>
            <div className="d_section_title">{section.section}</div>

            {section.items.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isOpen      = openMenus[item.id];
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
        ))}
      </nav>

      {/* Footer */}
      <div className="d_sidebar_footer">
        <div className="d_sidebar_footer_avatar">SA</div>
        <div className="d_sidebar_footer_info">
          <div className="d_sidebar_footer_name">Super Admin</div>
          <div className="d_sidebar_footer_role">Administrator</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
