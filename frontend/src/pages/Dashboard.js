import React from 'react';
import {
  MdTrendingUp, MdTrendingDown, MdShoppingCart, MdPointOfSale,
  MdWarning, MdPayments, MdPeople, MdInventory2, MdArrowUpward,
  MdArrowDownward,
} from 'react-icons/md';

const stats = [
  {
    label: "Today's Sales",
    value: '₹1,24,500',
    icon: <MdPointOfSale />,
    iconClass: 'd_accent',
    cardClass: 'd_accent',
    change: '+12.4%',
    dir: 'up',
  },
  {
    label: "Today's Purchases",
    value: '₹68,200',
    icon: <MdShoppingCart />,
    iconClass: 'd_primary',
    cardClass: '',
    change: '+5.1%',
    dir: 'up',
  },
  {
    label: 'Low Stock Alerts',
    value: '14 Parts',
    icon: <MdWarning />,
    iconClass: 'd_danger',
    cardClass: 'd_danger',
    change: '+3 new',
    dir: 'down',
  },
  {
    label: 'Pending Payments',
    value: '₹2,36,000',
    icon: <MdPayments />,
    iconClass: 'd_warning',
    cardClass: 'd_warning',
    change: '-8.2%',
    dir: 'up',
  },
  {
    label: 'Attendance Today',
    value: '38 / 42',
    icon: <MdPeople />,
    iconClass: 'd_success',
    cardClass: 'd_success',
    change: '90.4%',
    dir: 'up',
  },
  {
    label: 'Total Stock Items',
    value: '2,841',
    icon: <MdInventory2 />,
    iconClass: 'd_info',
    cardClass: 'd_info',
    change: '+26 today',
    dir: 'up',
  },
];

const topParts = [
  { part: 'Reed Valve Assembly',       partNo: 'AJ-RV-001', sold: 142, revenue: '₹71,000',  status: 'In Stock' },
  { part: 'Air Jet Nozzle Set',        partNo: 'AJ-NZ-012', sold: 118, revenue: '₹59,000',  status: 'Low Stock' },
  { part: 'Weft Detector Sensor',      partNo: 'AJ-WD-034', sold: 97,  revenue: '₹48,500',  status: 'In Stock' },
  { part: 'Main Shaft Bearing',        partNo: 'AJ-SB-007', sold: 84,  revenue: '₹42,000',  status: 'In Stock' },
  { part: 'Selvage Cutter Blade',      partNo: 'AJ-SC-021', sold: 76,  revenue: '₹38,000',  status: 'Out of Stock' },
];

const statusBadge = (s) => {
  const map = { 'In Stock': 'd_success', 'Low Stock': 'd_warning', 'Out of Stock': 'd_danger' };
  return <span className={`d_badge ${map[s] || 'd_info'}`}>{s}</span>;
};

const Dashboard = () => (
  <div>
    <div className="d_page_header">
      <h1 className="d_page_title">Dashboard</h1>
      <p className="d_page_subtitle">Welcome back, Super Admin — here's what's happening today.</p>
    </div>

    {/* Stat Cards */}
    <div className="row g-3 mb-4">
      {stats.map((s, i) => (
        <div key={i} className="col-6 col-md-4 col-xl-2">
          <div className={`d_stat_card ${s.cardClass}`}>
            <div className={`d_stat_icon ${s.iconClass}`}>{s.icon}</div>
            <div className="d_stat_value">{s.value}</div>
            <div className="d_stat_label">{s.label}</div>
            <div className={`d_stat_change ${s.dir === 'up' ? 'd_up' : 'd_down'}`}>
              {s.dir === 'up' ? <MdArrowUpward /> : <MdArrowDownward />}
              {s.change}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Low Stock Alert */}
    <div className="d_alert d_danger mb-4">
      <MdWarning style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }} />
      <div>
        <strong>Low Stock Warning:</strong> 14 spare parts are below minimum stock level.
        Immediate purchase orders recommended.
      </div>
    </div>

    {/* Top Selling Parts */}
    <div className="d_card">
      <div className="d_card_header">
        <h2 className="d_card_title">
          <MdTrendingUp className="d_card_icon" /> Top Selling Spare Parts
        </h2>
        <button className="d_btn d_btn_outline d_btn_sm">View All</button>
      </div>
      <div className="d_card_body p-0">
        <div className="d_table_wrap">
          <table className="d_table">
            <thead>
              <tr>
                <th>#</th>
                <th>Part Name</th>
                <th>Part No.</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topParts.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td><strong>{p.part}</strong></td>
                  <td><code>{p.partNo}</code></td>
                  <td>{p.sold}</td>
                  <td>{p.revenue}</td>
                  <td>{statusBadge(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
