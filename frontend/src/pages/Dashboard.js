import React, { useState, useEffect } from 'react';
import {
  MdTrendingUp, MdShoppingCart, MdPointOfSale,
  MdWarning, MdPayments, MdPeople, MdInventory2,
  MdArrowUpward, MdArrowDownward, MdBuildCircle,
  MdAccessTime, MdAccountBalance, MdCheckCircle,
} from 'react-icons/md';
import { dashboardApi, sparePartsApi } from '../utils/api';

const ICON_MAP = {
  MdPointOfSale,
  MdBuildCircle,
  MdShoppingCart,
  MdPeople,
  MdWarning,
  MdCheckCircle,
  MdAccessTime,
};

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

const Dashboard = ({ currentUser }) => {
  const [stats, setStats] = useState([
    { label: "Today's Sales",      value: '₹0',       icon: <MdPointOfSale />,  iconClass: 'd_accent',   cardClass: 'd_accent',   change: '+0%',     dir: 'up' },
    { label: "Today's Purchases",  value: '₹0',       icon: <MdShoppingCart />, iconClass: 'd_primary',  cardClass: '',           change: '+0%',     dir: 'up' },
    { label: 'Low Stock Alerts',   value: '0 Parts',  icon: <MdWarning />,      iconClass: 'd_danger',   cardClass: 'd_danger',   change: '+0 new',  dir: 'down' },
    { label: 'Pending Payments',   value: '₹0',       icon: <MdPayments />,     iconClass: 'd_warning',  cardClass: 'd_warning',  change: '-0%',     dir: 'up' },
    { label: 'Total Employees',    value: '0',        icon: <MdPeople />,       iconClass: 'd_success',  cardClass: 'd_success',  change: '0',       dir: 'up' },
    { label: 'Total Stock Items',  value: '0',        icon: <MdInventory2 />,   iconClass: 'd_info',     cardClass: 'd_info',     change: '+0',      dir: 'up' },
  ]);

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [pendingPO, setPendingPO] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [topPartsList, setTopPartsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dashRes, partsRes, activityRes] = await Promise.allSettled([
          dashboardApi.getStats(),
          sparePartsApi.getAll(),
          dashboardApi.getActivity(),
        ]);

        if (dashRes.status === 'fulfilled') {
          const d = dashRes.value.data;
          setStats(prev => {
            const newStats = [...prev];
            newStats[0] = { ...newStats[0], value: d.stats?.todaySales || '₹0' };
            newStats[1] = { ...newStats[1], value: d.stats?.todayPurchases || '₹0' };
            newStats[2] = { ...newStats[2], value: d.stats?.lowStockAlerts || '0 Parts' };
            newStats[3] = { ...newStats[3], value: d.stats?.pendingPayments || '₹0' };
            newStats[4] = { ...newStats[4], value: String(d.stats?.totalEmployees || 0) };
            newStats[5] = { ...newStats[5], value: String(d.stats?.totalStockItems || 0) };
            return newStats;
          });
          setRecentOrders(d.recentOrders || []);
          setRecentTickets(d.recentTickets || []);
          setPendingPO(d.pendingPOs || []);
        }

        if (activityRes.status === 'fulfilled') {
          const activities = (activityRes.value.data || []).map(a => ({
            icon: a.icon,
            color: a.color,
            text: a.text,
            time: a.time,
          }));
          setActivityFeed(activities);
        }

        if (partsRes.status === 'fulfilled') {
          const parts = (partsRes.value.data || []).slice(0, 5).map(p => ({
            part: p.partName,
            partNo: p.partNumber,
            sold: p.quantity,
            revenue: `₹${((p.sellingPrice || 0) * (p.quantity || 0)).toLocaleString()}`,
            status: p.status,
          }));
          setTopPartsList(parts);
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
      <div className="d_page_header">
        <h1 className="d_page_title">Dashboard</h1>
        <p className="d_page_subtitle">Welcome back, {currentUser?.employee?.name || 'User'} — here's what's happening today.</p>
      </div>

      {loading && <div className="text-center py-3">Loading dashboard…</div>}

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
          <strong>Low Stock Warning:</strong> {stats[2].value} are below minimum stock level.
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
              <button className="d_btn d_btn_outline d_btn_sm">View All</button>
            </div>
            <div className="d_card_body p-0">
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
              <button className="d_btn d_btn_outline d_btn_sm">View All</button>
            </div>
            <div className="d_card_body p-0">
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
          <div className="d_card h-100">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdAccessTime className="d_card_icon" /> Recent Activity
              </h2>
            </div>
            <div className="d_card_body" style={{ padding: '8px 16px' }}>
              {activityFeed.length === 0 && <p className="text-center text-muted py-3">No recent activity</p>}
              {activityFeed.map((a, i) => (
                <div key={i} className="d_activity_item">
                  <div className="d_activity_icon" style={{ background: a.color + '18', color: a.color }}>
                    {ICON_MAP[a.icon] || <MdAccessTime />}
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
          { icon: <MdAccountBalance />, label: 'Total Receivables', value: '₹81,500',  color: 'var(--d-success)' },
          { icon: <MdAccountBalance />, label: 'Total Payables',    value: '₹2,11,700', color: 'var(--d-danger)' },
          { icon: <MdPeople />,         label: 'Total Employees',   value: String(stats[4].value),         color: 'var(--d-primary)' },
          { icon: <MdBuildCircle />,    label: 'Open Tickets',      value: String(stats[5].value),          color: 'var(--d-warning)' },
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
};

export default Dashboard;
