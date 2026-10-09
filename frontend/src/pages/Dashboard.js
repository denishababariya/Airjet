import React, { useState, useEffect } from 'react';
import {
  MdTrendingUp, MdShoppingCart, MdPointOfSale,
  MdWarning, MdPayments, MdPeople, MdInventory2,
  MdArrowUpward, MdArrowDownward, MdBuildCircle,
  MdAccessTime, MdAccountBalance, MdCheckCircle,
  MdEventBusy, MdCancel,
} from 'react-icons/md';
import { dashboardApi, sparePartsApi, salesOrdersApi, serviceRequestsApi } from '../utils/api';

// ── Safe access helpers ──────────────────────────────────────────────
// Normalises any value that may be a plain string, an object {name} or
// undefined/null so tables never crash on malformed / partial data.
const safeText = (v, fallback = '-') => {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'object') {
    const candidate = v.name || v.label || v.title || v.text || v.customer || v.supplier || v.emp;
    return safeText(candidate, fallback);
  }
  return String(v);
};

const safeNumber = (v, fallback = 0) => {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'object') {
    const candidate = v.total ?? v.value ?? v.amount ?? v.count ?? v.sum;
    return safeNumber(candidate, fallback);
  }
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
};

const safeCurrency = (v, fallback = '₹0') => {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'string' && /^₹?\s?[\d,]+(\.\d+)?$/.test(v.trim())) return v;
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return `₹${v.toLocaleString('en-IN')}`;
  }
  return fallback;
};

const safeArray = (v) => Array.isArray(v) ? v : [];

const safeStatus = (s) => {
  if (s === undefined || s === null || s === '') return 'Unknown';
  return String(s);
};

// Icon map: renders the component correctly as JSX
const ICON_MAP = {
  MdPointOfSale: <MdPointOfSale />,
  MdBuildCircle: <MdBuildCircle />,
  MdShoppingCart: <MdShoppingCart />,
  MdPeople: <MdPeople />,
  MdWarning: <MdWarning />,
  MdCheckCircle: <MdCheckCircle />,
  MdAccessTime: <MdAccessTime />,
};

const statusBadge = (s) => {
  const status = safeStatus(s);
  const map = {
    'In Stock': 'd_success', 'Low Stock': 'd_warning', 'Out of Stock': 'd_danger',
    Delivered: 'd_success', Processing: 'd_info', Confirmed: 'd_primary',
    Unpaid: 'd_warning', Overdue: 'd_danger', Paid: 'd_success',
    Open: 'd_warning', 'In Progress': 'd_info', Resolved: 'd_success',
    Pending: 'd_warning', 'In Transit': 'd_info',
  };
  return <span className={`d_badge ${map[status] || 'd_info'}`}>{status}</span>;
};

const Dashboard = ({ currentUser, setActiveMenu }) => {
  const navigateTo = (menu) => setActiveMenu?.(menu);

  const [stats, setStats] = useState([
    { label: "Today's Sales", value: '₹0', icon: <MdPointOfSale />, iconClass: 'd_accent', cardClass: 'd_accent', change: '+0%', dir: 'up' },
    { label: "Today's Purchases", value: '₹0', icon: <MdShoppingCart />, iconClass: 'd_primary', cardClass: '', change: '+0%', dir: 'up' },
    { label: 'Low Stock Alerts', value: '0 Parts', icon: <MdWarning />, iconClass: 'd_danger', cardClass: 'd_danger', change: '+0 new', dir: 'down' },
    { label: 'Pending Payments', value: '₹0', icon: <MdPayments />, iconClass: 'd_warning', cardClass: 'd_warning', change: '-0%', dir: 'up' },
    { label: 'Total Employees', value: '0', icon: <MdPeople />, iconClass: 'd_success', cardClass: 'd_success', change: '0', dir: 'up' },
    { label: 'Total Stock Items', value: '0', icon: <MdInventory2 />, iconClass: 'd_info', cardClass: 'd_info', change: '+0', dir: 'up' },
  ]);

  const [attendanceStats, setAttendanceStats] = useState({
    todayPresent: 0,
    todayAbsent: 0,
    todayLeave: 0,
    todayLate: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [pendingPO, setPendingPO] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [topPartsList, setTopPartsList] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalReceivables, setTotalReceivables] = useState('₹0');
  const [totalPayables, setTotalPayables] = useState('₹0');
  const [openTickets, setOpenTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  // Normalise + validate the dashboard payload so partial / malformed data
  // never breaks the UI (e.g. when redirected back from a "View All" page).
  const normaliseDashboard = (d = {}) => {
    const s = d.stats || {};
    return {
      stats: {
        todaySales: safeCurrency(s.todaySales),
        todayPurchases: safeCurrency(s.todayPurchases),
        lowStockAlerts: `${safeNumber(s.lowStockCount)} Parts`,
        lowStockCount: safeNumber(s.lowStockCount),
        pendingPayments: safeCurrency(s.pendingPayments),
        totalReceivables: safeCurrency(s.totalReceivables),
        totalPayables: safeCurrency(s.totalPayables),
        totalEmployees: safeNumber(s.totalEmployees),
        totalStockItems: safeNumber(s.totalStockItems),
        openTickets: safeNumber(s.openTickets),
      },
      recentOrders: safeArray(d.recentOrders).map((o) => ({
        id: safeText(o.orderNumber || o.id),
        customer: safeText(o.customer?.name || o.customer),
        amount: safeCurrency(o.grandTotal ?? o.amount),
        date: safeText(o.orderDate),
        status: safeStatus(o.status),
      })),
      recentTickets: safeArray(d.recentTickets).map((t) => ({
        id: safeText(t.requestNumber || t.id),
        customer: safeText(t.customer?.name || t.customer),
        machine: safeText(t.machine),
        issue: safeText(t.complaint),
        engineer: safeText(t.assignedEngineer?.name || t.assignedEngineer, 'Unassigned'),
        status: safeStatus(t.status),
      })),
      pendingPOs: safeArray(d.pendingPOs).map((p) => ({
        id: safeText(p.id),
        supplier: safeText(p.supplier),
        amount: safeCurrency(p.amount),
        date: safeText(p.date),
        delivery: safeText(p.delivery),
        status: safeStatus(p.status),
      })),
    };
  };

  const normaliseAttendance = (data = {}) => ({
    todayPresent: safeNumber(data.todayPresent),
    todayAbsent: safeNumber(data.todayAbsent),
    todayLeave: safeNumber(data.todayLeave),
    todayLate: safeNumber(data.todayLate),
  });

  const normaliseActivity = (data = []) =>
    safeArray(data).map((a) => ({
      icon: safeText(a.icon, 'MdAccessTime'),
      color: safeText(a.color, '#1a3c5e'),
      text: safeText(a.text, 'Activity'),
      time: safeText(a.time, 'Just now'),
    }));

  const normaliseParts = (data = []) =>
    [...safeArray(data)]
      .sort((a, b) => safeNumber(b.quantity) - safeNumber(a.quantity))
      .slice(0, 5)
      .map((p) => ({
        part: safeText(p.partName, 'Unknown Part'),
        partNo: safeText(p.partNumber, '-'),
        sold: safeNumber(p.quantity),
        revenue: `₹${(safeNumber(p.sellingPrice) * safeNumber(p.quantity)).toLocaleString('en-IN')}`,
        status: safeStatus(p.status),
      }));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dashRes, partsRes, activityRes, attendanceRes, salesRes, serviceRes] =
          await Promise.allSettled([
            dashboardApi.getStats(),
            sparePartsApi.getAll(),
            dashboardApi.getActivity(),
            dashboardApi.getAttendanceStats(),
            salesOrdersApi.getAll(),
            serviceRequestsApi.getAll(),
          ]);

        if (dashRes.status === 'fulfilled') {
          const norm = normaliseDashboard(dashRes.value.data);
          setStats([
            { label: "Today's Sales", value: norm.stats.todaySales, icon: <MdPointOfSale />, iconClass: 'd_accent', cardClass: 'd_accent', change: '+0%', dir: 'up' },
            { label: "Today's Purchases", value: norm.stats.todayPurchases, icon: <MdShoppingCart />, iconClass: 'd_primary', cardClass: '', change: '+0%', dir: 'up' },
            { label: 'Low Stock Alerts', value: `${norm.stats.lowStockCount} Parts`, icon: <MdWarning />, iconClass: 'd_danger', cardClass: 'd_danger', change: '+0 new', dir: 'down' },
            { label: 'Pending Payments', value: norm.stats.pendingPayments, icon: <MdPayments />, iconClass: 'd_warning', cardClass: 'd_warning', change: '-0%', dir: 'up' },
            { label: 'Total Employees', value: String(norm.stats.totalEmployees), icon: <MdPeople />, iconClass: 'd_success', cardClass: 'd_success', change: '0', dir: 'up' },
            { label: 'Total Stock Items', value: String(norm.stats.totalStockItems), icon: <MdInventory2 />, iconClass: 'd_info', cardClass: 'd_info', change: '+0', dir: 'up' },
          ]);
          setLowStockCount(norm.stats.lowStockCount);
          setTotalReceivables(norm.stats.totalReceivables);
          setTotalPayables(norm.stats.totalPayables);
          setOpenTickets(norm.stats.openTickets);
          setPendingPO(norm.pendingPOs);
        }

        // Recent Orders now come from the SAME endpoint as Sales.js
        // (/sales-orders → SalesOrder model) so the data matches exactly.
        if (salesRes.status === 'fulfilled') {
          setRecentOrders(normaliseDashboard({ recentOrders: salesRes.value.data }).recentOrders);
        }

        // Recent Service Tickets now come from the SAME endpoint as Service.js
        // (/service-requests → ServiceRequest model) so the data matches exactly.
        if (serviceRes.status === 'fulfilled') {
          setRecentTickets(normaliseDashboard({ recentTickets: serviceRes.value.data }).recentTickets);
        }

        if (attendanceRes.status === 'fulfilled') {
          setAttendanceStats(normaliseAttendance(attendanceRes.value.data));
        }

        if (activityRes.status === 'fulfilled') {
          setActivityFeed(normaliseActivity(activityRes.value.data));
        }

        if (partsRes.status === 'fulfilled') {
          setTopPartsList(normaliseParts(partsRes.value.data));
        }
      } catch {
        // Keep default zeroed stats on failure.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Dashboard</h1>
          <p className="d_page_subtitle">Welcome back, {currentUser?.employee?.name || 'User'} — here's what's happening today.</p>
        </div>
      </div>

      {loading && <div className="text-center py-3">Loading dashboard…</div>}

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="row g-3 mb-4 d_stat_cards_section">
        {stats.map((s, i) => (
          <div key={i} className="col-12 col-md-4 col-xl-2">
            <div className={`d_stat_card ${s.cardClass}`}>
              <div className={`d_stat_icon ${s.iconClass}`}>{s.icon}</div>
              <div className="d_stat_card_content">
                <div className="d_stat_value">{s.value}</div>
                <div className="d_stat_label">{s.label}</div>
                <div className={`d_stat_change ${s.dir === 'up' ? 'd_up' : 'd_down'}`}>
                  {s.dir === 'up' ? <MdArrowUpward /> : <MdArrowDownward />}
                  {s.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Attendance Stats ───────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3 ">
        <h5 className="mb-0">Today's Attendance</h5>
        <button className="d_btn d_btn_outline d_btn_sm" onClick={() => navigateTo('Today Attendance')}>View All</button>
      </div>
      <div className="row g-3 mb-4 d_stat_cards_section">
        <div className="col-12 col-md-3">
          <div className="d_stat_card d_success">
            <div className="d_stat_icon d_success"><MdCheckCircle /></div>
            <div className="d_stat_card_content">
              <div className="d_stat_value">{attendanceStats.todayPresent}</div>
              <div className="d_stat_label">Present</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="d_stat_card d_danger">
            <div className="d_stat_icon d_danger"><MdCancel /></div>
            <div className="d_stat_card_content">
              <div className="d_stat_value">{attendanceStats.todayAbsent}</div>
              <div className="d_stat_label">Absent</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="d_stat_card d_info">
            <div className="d_stat_icon d_info"><MdEventBusy /></div>
            <div className="d_stat_card_content">
              <div className="d_stat_value">{attendanceStats.todayLeave}</div>
              <div className="d_stat_label">Leave</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="d_stat_card d_warning">
            <div className="d_stat_icon d_warning"><MdAccessTime /></div>
            <div className="d_stat_card_content">
              <div className="d_stat_value">{attendanceStats.todayLate}</div>
              <div className="d_stat_label">Late</div>
            </div>
          </div>
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
              <button className="d_btn d_btn_outline d_btn_sm" onClick={() => navigateTo('Sales Orders')}>View All</button>
            </div>
            <div className="d_card_body p-2">
              <div className="d_table_wrap">
                <table className="d_table">
                  <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 && <tr className="d_empty"><td colSpan={5}>No orders yet.</td></tr>}
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
              <button className="d_btn d_btn_outline d_btn_sm" onClick={() => navigateTo('Purchase Orders')}>View All</button>
            </div>
            <div className="d_card_body p-2">
              <div className="d_table_wrap">
                <table className="d_table">
                  <thead>
                    <tr><th>PO No.</th><th>Supplier</th><th>Amount</th><th>Delivery</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {pendingPO.length === 0 && <tr className="d_empty"><td colSpan={5}>No pending POs.</td></tr>}
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
              <button className="d_btn d_btn_outline d_btn_sm" onClick={() => navigateTo('Service Tickets')}>View All</button>
            </div>
            <div className="d_card_body p-2">
              <div className="d_table_wrap">
                <table className="d_table">
                  <thead>
                    <tr><th>Ticket</th><th>Customer</th><th>Machine</th><th>Engineer</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentTickets.length === 0 && <tr className="d_empty"><td colSpan={5}>No service tickets.</td></tr>}
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
          <div className="d_card h-100 pb-2">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdAccessTime className="d_card_icon" /> Recent Activity
              </h2>
              {/* <button className="d_btn d_btn_outline d_btn_sm" onClick={() => navigateTo('reports')}>View All</button> */}
            </div>
            <div className="d_card_body" style={{ padding: '2px 16px', height: '300px', overflowY: 'scroll' }}>
              {activityFeed.length === 0 && <p className="text-center text-muted py-3">No recent activity</p>}
              {activityFeed.map((a, i) => (
                <div key={i} className="d_activity_item d-flex gap-3 my-2 border p-2">
                  <div className="d_activity_icon" style={{ background: a.color + '18', color: a.color }}>
                    {ICON_MAP[a.icon] ?? <MdAccessTime />}
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
          <button className="d_btn d_btn_outline d_btn_sm" onClick={() => navigateTo('Part Number')}>View All</button>
        </div>
        <div className="d_card_body p-2">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>#</th><th>Part Name</th><th>Part No.</th><th>Units Sold</th><th>Revenue</th><th>Status</th></tr>
              </thead>
              <tbody>
                {topPartsList.length === 0 && <tr className="d_empty"><td colSpan={6}>No parts data available.</td></tr>}
                {topPartsList.map((p, i) => (
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
          { icon: <MdAccountBalance />, label: 'Total Receivables', value: totalReceivables, color: 'var(--d-success)', menu: 'Receivables' },
          { icon: <MdAccountBalance />, label: 'Total Payables', value: totalPayables, color: 'var(--d-danger)', menu: 'Payables' },
          { icon: <MdPeople />, label: 'Total Employees', value: String(stats[4].value), color: 'var(--d-primary)', menu: 'Employee Master' },
          { icon: <MdBuildCircle />, label: 'Open Tickets', value: String(openTickets), color: 'var(--d-warning)', menu: 'Service Tickets' },
        ].map((item, i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-3">
            <div
              className="d_card"
              style={{ borderLeft: `4px solid ${item.color}`, cursor: item.menu ? 'pointer' : 'default' }}
              onClick={() => item.menu && setActiveMenu?.(item.menu)}
            >
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
};

export default Dashboard;
