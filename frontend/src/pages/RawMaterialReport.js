import React, { useEffect, useState } from 'react';
import { MdBarChart, MdInventory2, MdShoppingCart, MdTrendingUp, MdLayers, MdDownload, MdPieChart, MdShowChart } from 'react-icons/md';
import { rawMaterialsApi } from '../utils/api';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const RawMaterialReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await rawMaterialsApi.getReport();
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load raw material report');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = report?.summary || {};
  const purchaseSummary = report?.purchaseSummary || {};
  const categoryBreakdown = Object.entries(report?.categoryBreakdown || {}).map(([category, stats]) => ({ category, ...stats }));
  const stockMovements = Object.entries(report?.stockMovements || {}).map(([type, stats]) => ({ type, ...stats }));
  const materials = report?.materials || [];

  // Calculate compliance metrics from actual data
  const supplierComplianceRate = React.useMemo(() => {
    if (!materials || materials.length === 0) return 0;
    const compliantMaterials = materials.filter(m => m.qualityCheck?.status === 'Passed').length;
    return ((compliantMaterials / materials.length) * 100).toFixed(2);
  }, [materials]);

  const complianceBySupplier = React.useMemo(() => {
    if (!materials || materials.length === 0) return [];
    const supplierStats = {};
    materials.forEach(material => {
      const supplierName = material.supplierName || material.supplier?.name || 'Unknown';
      if (!supplierStats[supplierName]) {
        supplierStats[supplierName] = { total: 0, compliant: 0 };
      }
      supplierStats[supplierName].total += 1;
      if (material.qualityCheck?.status === 'Passed') {
        supplierStats[supplierName].compliant += 1;
      }
    });
    return Object.entries(supplierStats).map(([name, stats]) => ({
      name,
      compliance: stats.total > 0 ? ((stats.compliant / stats.total) * 100).toFixed(1) : 0
    })).slice(0, 8);
  }, [materials]);

  const passedTestsData = React.useMemo(() => {
    if (!report?.transactions || report.transactions.length === 0) return [];
    const weeklyData = {};
    report.transactions.forEach(transaction => {
      const weekNumber = transaction.transactionDate
        ? Math.ceil(new Date(transaction.transactionDate).getDate() / 7)
        : 1;
      const weekKey = weekNumber.toString();
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, passed: 0, total2: 0, passed2: 0 };
      }
      weeklyData[weekKey].total += 1;
      if (transaction.type === 'Purchase' || transaction.type === 'Add') {
        weeklyData[weekKey].passed += 1;
      }
      weeklyData[weekKey].total2 += 1;
      if (transaction.qualityCheck?.status === 'Passed') {
        weeklyData[weekKey].passed2 += 1;
      }
    });
    return Object.entries(weeklyData).map(([week, stats]) => ({
      week,
      'Line 1': stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(0) : 0,
      'Line 2': stats.total2 > 0 ? ((stats.passed2 / stats.total2) * 100).toFixed(0) : 0
    })).sort((a, b) => parseInt(a.week) - parseInt(b.week));
  }, [report?.transactions]);

  const purchaseTrend = React.useMemo(() => {
    const grouped = {};
    (report?.purchases || []).forEach((purchase) => {
      const date = purchase.purchaseDate ? new Date(purchase.purchaseDate) : null;
      const label = date ? date.toLocaleString('en-IN', { month: 'short', year: 'numeric' }) : 'Unknown';
      grouped[label] = grouped[label] || { month: label, count: 0, amount: 0 };
      grouped[label].count += 1;
      grouped[label].amount += Number(purchase.totalAmount) || 0;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [report?.purchases]);

  const stockStatusData = [
    { name: 'In Stock', value: summary.inStock || 0, color: 'var(--d-success)' },
    { name: 'Low Stock', value: summary.lowStock || 0, color: 'var(--d-warning)' },
    { name: 'Out of Stock', value: summary.outOfStock || 0, color: 'var(--d-danger)' }
  ];

  const purchaseStatusData = [
    { name: 'Pending', value: purchaseSummary.pending || 0, color: 'var(--d-warning)' },
    { name: 'Delivered', value: purchaseSummary.delivered || 0, color: 'var(--d-success)' },
    { name: 'Confirmed', value: purchaseSummary.confirmed || 0, color: 'var(--d-primary)' },
    { name: 'In Transit', value: purchaseSummary.inTransit || 0, color: 'var(--d-accent)' }
  ];

  const summaryCards = [
    { label: 'Total Materials', value: formatNumber(summary.totalMaterials), icon: <MdInventory2 />, color: 'var(--d-primary)' },
    { label: 'Current Quantity', value: formatNumber(summary.currentQuantity), icon: <MdLayers />, color: 'var(--d-info)' },
    { label: 'Stock Value', value: formatCurrency(summary.currentStockValue), icon: <MdShoppingCart />, color: 'var(--d-success)' },
    { label: 'Low Stock', value: formatNumber(summary.lowStock), icon: <MdTrendingUp />, color: 'var(--d-warning)' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '2560px', margin: '0 auto', minWidth: '320px' }}>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ marginBottom: '28px' }}>
        <div>
          <h5 className="d_page_title" style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#2C3E50', fontWeight: '700' }}>Raw Material Report</h5>
          <p className="d_page_subtitle" style={{ fontSize: '0.95rem', color: '#7F8C8D', fontWeight: '400' }}>Purchase and stock performance with interactive charts and live inventory metrics.</p>
        </div>
        <button className="d_btn d_btn_accent" style={{ fontSize: '0.9rem', padding: '12px 20px', backgroundColor: 'var(--d-primary)', color: '#2C3E50', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s ease' }}>
          <MdDownload style={{ marginRight: '8px', fontSize: '1.1rem' }} /> Export
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ padding: '16px', backgroundColor: '#FFB6C1', color: '#C0392B', borderRadius: '8px', marginBottom: '20px', fontSize: '1rem' }}>{error}</div>}
      {loading && <div className="text-center py-4" style={{ fontSize: '1.1rem', color: '#7F8C8D', padding: '40px' }}>Loading report…</div>}

      {!loading && report && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '28px'
          }}>
            {summaryCards.map((card) => (
              <div className="d_card" key={card.label} style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', border: `1px solid ${card.color}40`, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '1.5rem', color: card.color }}>{card.icon}</span>
                  <h5 style={{ fontSize: '1rem', color: '#546E7A', fontWeight: '600', margin: 0 }}>{card.label}</h5>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: card.color, letterSpacing: '-0.5px' }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '20px', marginBottom: '28px' }}>
            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdShoppingCart style={{ color: 'var(--d-primary)' }} /> Purchase Summary
                </h5>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Purchases', value: formatNumber(purchaseSummary.totalPurchases), color: 'var(--d-primary)' },
                  { label: 'Total Amount', value: formatCurrency(purchaseSummary.totalPurchaseAmount), color: 'var(--d-success)' },
                  { label: 'Total GST', value: formatCurrency(purchaseSummary.totalGstAmount), color: 'var(--d-warning)' },
                  { label: 'Grand Total', value: formatCurrency(purchaseSummary.totalGrandTotal), color: 'var(--d-accent)' }
                ].map((item) => (
                  <div key={item.label} style={{ padding: '20px', background: '#FFFFFF', borderRadius: '12px', border: `1px solid ${item.color}40` }}>
                    <h5 style={{ fontSize: '0.95rem', color: '#546E7A', marginBottom: '10px', fontWeight: '600', margin: 0 }}>{item.label}</h5>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: item.color, letterSpacing: '-0.5px' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdBarChart style={{ color: 'var(--d-primary)' }} /> Stock by Category
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                {categoryBreakdown.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: '50px', fontSize: '1rem', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>No category data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="category" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <YAxis dataKey="value" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }}
                      />
                      <Legend style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Bar dataKey="value" fill="var(--d-primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdLayers style={{ color: 'var(--d-success)' }} /> Stock Movement
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                {stockMovements.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: '50px', fontSize: '1rem', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>No stock movement data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockMovements}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="type" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <YAxis dataKey="quantity" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Tooltip
                        formatter={(value) => formatNumber(value)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }}
                      />
                      <Legend style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Area type="monotone" dataKey="quantity" stroke="var(--d-success)" fill="var(--d-success)" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdShowChart style={{ color: 'var(--d-accent)' }} /> Purchase Timeline
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                {purchaseTrend.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: '50px', fontSize: '1rem', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>No purchase timeline available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={purchaseTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="month" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <YAxis yAxisId="left" dataKey="count" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <YAxis yAxisId="right" dataKey="amount" orientation="right" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Tooltip
                        formatter={(value, name) => name === 'count' ? [value, 'Purchases'] : [formatCurrency(value), 'Amount']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }}
                      />
                      <Legend style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Line yAxisId="left" dataKey="count" stroke="var(--d-accent)" strokeWidth={2.5} dot={{ fill: 'var(--d-accent)', strokeWidth: 2, r: 5 }} />
                      <Line yAxisId="right" dataKey="amount" stroke="var(--d-danger)" strokeWidth={2.5} dot={{ fill: 'var(--d-danger)', strokeWidth: 2, r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdPieChart style={{ color: 'var(--d-warning)' }} /> Stock Status Distribution
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      style={{ fontSize: '0.9rem', fill: '#546E7A' }}
                    >
                      {stockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdPieChart style={{ color: 'var(--d-danger)' }} /> Purchase Status Distribution
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={purchaseStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      style={{ fontSize: '0.9rem', fill: '#546E7A' }}
                    >
                      {purchaseStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdInventory2 style={{ color: 'var(--d-info)' }} /> Top Materials by Quantity
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                {materials.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: '50px', fontSize: '1rem', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>No material data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={materials.slice().sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0)).slice(0, 8)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis type="number" dataKey="quantity" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Tooltip
                        formatter={(value) => formatNumber(value)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }}
                      />
                      <Bar dataKey="quantity" fill="var(--d-info)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdTrendingUp style={{ color: 'var(--d-success)' }} /> Supplier Compliance Rate
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#E8EAF6"
                      strokeWidth="16"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="var(--d-success)"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={`${(supplierComplianceRate / 100) * 502} 502`}
                      transform="rotate(-90 100 100)"
                      style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--d-success)', letterSpacing: '-0.5px' }}>
                      {supplierComplianceRate}%
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#7F8C8D', marginTop: '4px' }}>
                      Overall compliance
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdBarChart style={{ color: 'var(--d-primary)' }} /> Compliance by Supplier
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                {complianceBySupplier.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: '50px', fontSize: '1rem', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>No compliance data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complianceBySupplier}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="name" style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <YAxis domain={[0, 100]} style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Tooltip
                        formatter={(value) => `${value}%`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }}
                      />
                      <Legend style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Bar dataKey="compliance" fill="var(--d-primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                  <MdShowChart style={{ color: 'var(--d-accent)' }} /> % of Passed Tests
                </h5>
              </div>
              <div className="d_card_body" style={{ height: '320px' }}>
                {passedTestsData.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: '50px', fontSize: '1rem', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>No test data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={passedTestsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5, style: { fontSize: '0.85rem', fill: '#546E7A' } }} style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <YAxis domain={[0, 100]} label={{ value: 'Percentage', angle: -90, position: 'insideLeft', style: { fontSize: '0.85rem', fill: '#546E7A' } }} style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Tooltip
                        formatter={(value) => `${value}%`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: '0.95rem' }}
                      />
                      <Legend style={{ fontSize: '0.85rem', fill: '#546E7A' }} />
                      <Line dataKey="Line 1" stroke="var(--d-accent)" strokeWidth={2.5} dot={{ fill: 'var(--d-accent)', strokeWidth: 2, r: 5 }} />
                      <Line dataKey="Line 2" stroke="var(--d-danger)" strokeWidth={2.5} dot={{ fill: 'var(--d-danger)', strokeWidth: 2, r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="d_card" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', marginBottom: '28px' }}>
            <div className="d_card_header" style={{ marginBottom: '24px' }}>
              <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.25rem', fontWeight: '700', color: '#2C3E50', margin: 0 }}>
                <MdBarChart style={{ color: 'var(--d-primary)' }} /> Material Purchase & Stock Summary
              </h5>
            </div>
            <div className="d_card_body p-0">
              <div className="d_table_wrap" style={{ overflowX: 'auto' }}>
                <table className="d_table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '700', color: '#2C3E50', letterSpacing: '0.3px' }}>Material</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '700', color: '#2C3E50', letterSpacing: '0.3px' }}>Category</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '700', color: '#2C3E50', letterSpacing: '0.3px' }}>Quantity</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '700', color: '#2C3E50', letterSpacing: '0.3px' }}>Unit</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '700', color: '#2C3E50', letterSpacing: '0.3px' }}>Unit Price</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '700', color: '#2C3E50', letterSpacing: '0.3px' }}>Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.length === 0 && (
                      <tr style={{ background: '#FFFFFF' }}><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#7F8C8D', fontSize: '1rem' }}>No material rows available.</td></tr>
                    )}
                    {materials.slice(0, 15).map((material, index) => (
                      <tr key={material._id} style={{ borderBottom: '1px solid #E8EAF6', backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                        <td style={{ padding: '16px', fontSize: '0.95rem', color: '#2C3E50', fontWeight: '600' }}>{material.name || material.code}</td>
                        <td style={{ padding: '16px', fontSize: '0.95rem', color: '#546E7A' }}>{material.category || '—'}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '0.95rem', color: '#2C3E50', fontWeight: '600' }}>{formatNumber(material.quantity)}</td>
                        <td style={{ padding: '16px', fontSize: '0.95rem', color: '#546E7A' }}>{material.unit || '—'}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '0.95rem', color: '#546E7A' }}>{formatCurrency(material.unitPrice)}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '0.95rem', color: 'var(--d-success)', fontWeight: '700' }}>{formatCurrency((Number(material.quantity) || 0) * (Number(material.unitPrice) || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RawMaterialReport;
