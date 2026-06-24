import React from 'react';
import {
  MdTrendingUp, MdShoppingCart, MdPointOfSale,
  MdWarning, MdPayments, MdPeople, MdInventory2,
  MdArrowUpward, MdArrowDownward, MdBuildCircle,
  MdAccessTime, MdAccountBalance, MdCheckCircle,
} from 'react-icons/md';

const stats = [
  { label: "Today's Sales",      value: '₹1,24,500', icon: <MdPointOfSale />,  iconClass: 'd_accent',   cardClass: 'd_accent',   change: '+12.4%',   dir: 'up' },
  { label: "Today's Purchases",  value: '₹68,200',   icon: <MdShoppingCart />, iconClass: 'd_primary',  cardClass: '',           change: '+5.1%',    dir: 'up' },
  { label: 'Low Stock Alerts',   value: '14 Parts',  icon: <MdWarning />,      iconClass: 'd_danger',   cardClass: 'd_danger',   change: '+3 new',   dir: 'down' },
  { label: 'Pending Payments',   value: '₹2,36,000', icon: <MdPayments />,     iconClass: 'd_warning',  cardClass: 'd_warning',  change: '-8.2%',    dir: 'up' },
  { label: 'Attendance Today',   value: '38 / 42',   icon: <MdPeople />,       iconClass: 'd_success',  cardClass: 'd_success',  change: '90.4%',    dir: 'up' },
  { label: 'Total Stock Items',  value: '2,841',     icon: <MdInventory2 />,   iconClass: 'd_info',     cardClass: 'd_info',     change: '+26 today',dir: 'up' },
];

const topParts = [
  { part: 'Reed Valve Assembly',  partNo: 'AJ-RV-001', sold: 142, revenue: '₹71,000', status: 'In Stock' },
  { part: 'Air Jet Nozzle Set',   partNo: 'AJ-NZ-012', sold: 118, revenue: '₹59,000', status: 'Low Stock' },
  { part: 'Weft Detector Sensor', partNo: 'AJ-WD-034', sold: 97,  revenue: '₹48,500', status: 'In Stock' },
  { part: 'Main Shaft Bearing',   partNo: 'AJ-SB-007', sold: 84,  revenue: '₹42,000', status: 'In Stock' },
  { part: 'Selvage Cutter Blade', partNo: 'AJ-SC-021', sold: 76,  revenue: '₹38,000', status: 'Out of Stock' },
];

const recentOrders = [
  { id: 'SO-003', customer: 'National Weaving Works', amount: '₹45,000', date: '23-Jun-2026', status: 'Delivered' },
  { id: 'SO-002', customer: 'Shree Textile Mills',    amount: '₹38,400', date: '22-Jun-2026', status: 'Processing' },
  { id: 'SO-001', customer: 'Modi Fabric Industries', amount: '₹22,500', date: '21-Jun-2026', status: 'Confirmed' },
  { id: 'INV-001',customer: 'Shree Textile Mills',    amount: '₹24,500', date: '20-Jun-2026', status: 'Unpaid' },
  { id: 'INV-003',customer: 'Modi Fabric Industries', amount: '₹42,000', date: '18-Jun-2026', status: 'Overdue' },
];

const recentTickets = [
  { id: 'SRV-001', customer: 'Shree Textile Mills',    machine: 'AirJet AT-200', issue: 'Nozzle blockage',     engineer: 'Divya Verma', status: 'Open' },
  { id: 'SRV-002', customer: 'National Weaving Works', machine: 'AirJet JP-150', issue: 'Weft sensor failure',  engineer: 'Nikhil Rao',  status: 'In Progress' },
  { id: 'SRV-003', customer: 'Modi Fabric Industries', machine: 'AirJet AT-300', issue: 'Motor overheating',    engineer: 'Divya Verma', status: 'Resolved' },
];

const pendingPO = [
  { id: 'PO-001', supplier: 'Techno Parts Pvt Ltd',  amount: '₹1,24,500', date: '20-Jun-2026', delivery: '28-Jun-2026', status: 'Pending' },
  { id: 'PO-003', supplier: 'Airjet Components Ltd', amount: '₹2,10,000', date: '15-Jun-2026', delivery: '22-Jun-2026', status: 'In Transit' },
];

const activityFeed = [
  { icon: <MdPointOfSale />,   color: '#28a745', text: 'New invoice INV-001 created for Shree Textile Mills',     time: '10 min ago' },
  { icon: <MdBuildCircle />,   color: '#17a2b8', text: 'Service ticket SRV-004 assigned to Divya Verma',          time: '32 min ago' },
  { icon: <MdShoppingCart />,  color: '#f4a124', text: 'Purchase order PO-003 status updated to In Transit',      time: '1 hr ago' },
  { icon: <MdPeople />,        color: '#1a3c5e', text: 'New employee Pooja Desai added to HR department',         time: '2 hr ago' },
  { icon: <MdWarning />,       color: '#dc3545', text: 'Low stock alert: Air Jet Nozzle Set (8 units remaining)',  time: '3 hr ago' },
  { icon: <MdCheckCircle />,   color: '#28a745', text: 'Salary generated for June 2026 — 38 employees',           time: '5 hr ago' },
];

const statusBadge = (s) => {
  const map = {
    'In Stock': 'd_success', 'Low Stock': 'd_warning', 'Out of Stock': 'd_danger',
    Delivered: 'd_success', Processing: 'd_info', Confirmed: 'd_primary',
    Unpaid: 'd_warning', Overdue: 'd_danger', Paid: 'd_success',
    Open: 'd_warning', 'In Progress': 'd_info', Resolved: 'd_success',
    Pending: 'd_warning', 'In Transit': 'd_info',
  };
  return <span className={`d_badge ${map[s] || 'd_info'}`}>{s}</span>;
};

const Dashboard = () => (
  <div>
    <div className="d_page_header">
      <h1 className="d_page_title">Dashboard</h1>
      <p className="d_page_subtitle">Welcome back, Super Admin — here's what's happening today.</p>
    </div>

    {/* ── Stat Cards ─────────────────────────────────────────── */}
    <div className="row g-3 mb-4">
      {stats.map((s, i) => (
        <div key={i} className="col-12 col-md-4 col-xl-2">
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

    {/* ── Low Stock Alert ────────────────────────────────────── */}
    <div className="d_alert d_danger mb-4">
      <MdWarning style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }} />
      <div>
        <strong>Low Stock Warning:</strong> 14 spare parts are below minimum stock level.
        Immediate purchase orders recommended.
      </div>
    </div>

    {/* ── Row 2: Recent Orders + Pending POs ────────────────── */}
    <div className="row g-3 mb-4">
      {/* Recent Sales Orders */}
      <div className="col-12 col-lg-7">
        <div className="d_card h-100">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdPointOfSale className="d_card_icon" /> Recent Orders
            </h2>
            <button className="d_btn d_btn_outline d_btn_sm">View All</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={i}>
                      <td><code>{o.id}</code></td>
                      <td><strong>{o.customer}</strong></td>
                      <td>{o.amount}</td>
                      <td>{o.date}</td>
                      <td>{statusBadge(o.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Purchase Orders */}
      <div className="col-12 col-lg-5">
        <div className="d_card h-100">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdShoppingCart className="d_card_icon" /> Pending POs
            </h2>
            <button className="d_btn d_btn_outline d_btn_sm">View All</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr><th>PO No.</th><th>Supplier</th><th>Amount</th><th>Delivery</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {pendingPO.map((p, i) => (
                    <tr key={i}>
                      <td><code>{p.id}</code></td>
                      <td><strong>{p.supplier}</strong></td>
                      <td>{p.amount}</td>
                      <td>{p.delivery}</td>
                      <td>{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Row 3: Service Tickets + Activity Feed ─────────────── */}
    <div className="row g-3 mb-4">
      {/* Recent Service Tickets */}
      <div className="col-12 col-lg-7">
        <div className="d_card h-100">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdBuildCircle className="d_card_icon" /> Recent Service Tickets
            </h2>
            <button className="d_btn d_btn_outline d_btn_sm">View All</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr><th>Ticket</th><th>Customer</th><th>Machine</th><th>Engineer</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentTickets.map((t, i) => (
                    <tr key={i}>
                      <td><code>{t.id}</code></td>
                      <td><strong>{t.customer}</strong></td>
                      <td>{t.machine}</td>
                      <td>{t.engineer}</td>
                      <td>{statusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="col-12 col-lg-5">
        <div className="d_card h-100">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdAccessTime className="d_card_icon" /> Recent Activity
            </h2>
          </div>
          <div className="d_card_body" style={{ padding: '8px 16px' }}>
            {activityFeed.map((a, i) => (
              <div key={i} className="d_activity_item">
                <div className="d_activity_icon" style={{ background: a.color + '18', color: a.color }}>
                  {a.icon}
                </div>
                <div className="d_activity_content">
                  <p className="d_activity_text">{a.text}</p>
                  <span className="d_activity_time">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* ── Row 4: Top Selling Parts ───────────────────────────── */}
    <div className="d_card mb-4">
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
              <tr><th>#</th><th>Part Name</th><th>Part No.</th><th>Units Sold</th><th>Revenue</th><th>Status</th></tr>
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

    {/* ── Row 5: Quick Summary Pills ─────────────────────────── */}
    <div className="row g-3">
      {[
        { icon: <MdAccountBalance />, label: 'Total Receivables', value: '₹81,500',  color: 'var(--d-success)' },
        { icon: <MdAccountBalance />, label: 'Total Payables',    value: '₹2,11,700', color: 'var(--d-danger)' },
        { icon: <MdPeople />,         label: 'Total Employees',   value: '42',         color: 'var(--d-primary)' },
        { icon: <MdBuildCircle />,    label: 'Open Tickets',      value: '2',          color: 'var(--d-warning)' },
      ].map((item, i) => (
        <div key={i} className="col-6 col-md-3">
          <div className="d_card" style={{ borderLeft: `4px solid ${item.color}` }}>
            <div className="d_card_body d-flex align-items-center gap-3" style={{ padding: '16px 18px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: item.color + '18', color: item.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--d-text-main)', lineHeight: 1.1 }}>{item.value}</div>
                <div style={{ fontSize: 12, color: 'var(--d-text-muted)', marginTop: 2 }}>{item.label}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Dashboard;
