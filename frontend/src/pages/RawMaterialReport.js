import React, { useEffect, useState } from 'react';
import { MdBarChart, MdInventory2, MdShoppingCart, MdTrendingUp, MdLayers, MdPieChart, MdShowChart } from 'react-icons/md';
import { rawMaterialsApi } from '../utils/api';
import ExportMenu from '../components/ExportMenu';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const useResponsive = () => {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = size.width < 576;
  const isTablet = size.width >= 576 && size.width < 992;
  const isDesktop = size.width >= 992;
  const isLarge = size.width >= 1600;

  const chartHeight = isMobile ? 260 : isTablet ? 290 : 320;
  const cardPadding = isMobile ? '16px' : isTablet ? '20px' : '28px';
  const statCardMinWidth = isMobile ? '100%' : '260px';
  const chartCardMinWidth = isMobile ? '100%' : isTablet ? '340px' : '420px';
  const yAxisWidth = isMobile ? 80 : 110;
  const gridGap = isMobile ? '14px' : '20px';
  const fontSize = isMobile ? '0.9rem' : '1rem';
  const titleFontSize = isMobile ? '1.05rem' : isTablet ? '1.15rem' : '1.25rem';
  const statValueFontSize = isMobile ? '1.25rem' : isTablet ? '1.4rem' : '1.5rem';
  const headerGap = isMobile ? '12px' : '14px';

  return {
    isMobile, isTablet, isDesktop, isLarge,
    chartHeight, cardPadding, statCardMinWidth,
    chartCardMinWidth, yAxisWidth, gridGap,
    fontSize, titleFontSize, statValueFontSize, headerGap,
  };
};

const RawMaterialReport = ({ setActiveMenu }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigateTo = (menu) => setActiveMenu?.(menu);
  const {
    isMobile, isTablet, isDesktop, isLarge,
    chartHeight, cardPadding, statCardMinWidth,
    chartCardMinWidth, yAxisWidth, gridGap,
    fontSize, titleFontSize, statValueFontSize, headerGap,
  } = useResponsive();

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
    { label: 'Total Materials', value: formatNumber(summary.totalMaterials), icon: <MdInventory2 />, color: 'var(--d-success)', backgroundColor: 'rgba(40, 167, 69, 0.1)' },
    { label: 'Current Quantity', value: formatNumber(summary.currentQuantity), icon: <MdLayers />, color: 'var(--d-primary)', backgroundColor: 'rgba(26, 60, 94, 0.1)' },
    { label: 'Stock Value', value: formatCurrency(summary.currentStockValue), icon: <MdShoppingCart />, color: 'var(--d-info)', backgroundColor: 'rgba(23, 162, 184, 0.1)' },
    { label: 'Low Stock', value: formatNumber(summary.lowStock), icon: <MdTrendingUp />, color: 'var(--d-danger)', backgroundColor: 'rgba(220, 53, 69, 0.1)' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', padding: isMobile ? '12px' : isTablet ? '16px' : '20px', boxSizing: 'border-box' }}>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ marginBottom: isMobile ? '16px' : '20px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="d_page_title" style={{ fontSize: isMobile ? '1.4rem' : isTablet ? '1.6rem' : '1.8rem', marginBottom: '4px' }}>Raw Material Report</h1>
          <p className="d_page_subtitle" style={{ fontSize: isMobile ? '0.85rem' : '0.95rem' }}>Purchase and stock performance with interactive charts and live inventory metrics.</p>
        </div>
        <ExportMenu className="d_btn d_btn_primary" label="Export" filename="raw_material_report" data={report} />
      </div>

      {error && <div className="alert alert-danger" style={{ padding: isMobile ? '12px' : '16px', backgroundColor: '#FFB6C1', color: '#C0392B', borderRadius: '8px', marginBottom: isMobile ? '16px' : '20px', fontSize: fontSize }}>{error}</div>}
      {loading && <div className="text-center py-4" style={{ fontSize: '1.1rem', color: '#7F8C8D', padding: '40px' }}>Loading report…</div>}

      {!loading && report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100%' : '260px'}, 1fr))`, gap: gridGap, marginBottom: isMobile ? '18px' : '28px' }}>
            {summaryCards.map((card) => (
              <div className="d_stat_card" key={card.label} style={{ borderLeft: `4px solid ${card.color}`, padding: isMobile ? '14px' : '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
                  <span className='d_stat_icon' style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', marginBottom: '5px', color: card.color, backgroundColor: card.backgroundColor, }}>
                    {card.icon}
                  </span>
                  <h5 style={{ fontSize: isMobile ? '0.85rem' : '1rem', color: '#546E7A', fontWeight: '600', margin: 0, wordBreak: 'break-word' }}>
                    {card.label}
                  </h5>
                </div>
                <div className='ms-1' style={{ fontSize: statValueFontSize, fontWeight: '700', color: card.color, letterSpacing: '-0.5px', marginTop: isMobile ? '6px' : '10px', wordBreak: 'break-word' }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${chartCardMinWidth}, 1fr))`, gap: gridGap, marginBottom: isMobile ? '18px' : '28px' }}>
            <div className="d_card" style={{ padding: cardPadding, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: isMobile ? '14px' : '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: headerGap, fontSize: titleFontSize, fontWeight: '700', color: '#2C3E50', margin: 0, flexWrap: 'wrap' }}>
                  <MdBarChart style={{ color: 'var(--d-primary)' }} /> Stock by Category
                </h5>
              </div>
              <div className="d_card_body" style={{ height: chartHeight, padding: 0, minHeight: isMobile ? '240px' : '280px' }}>
                {categoryBreakdown.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: isMobile ? '30px' : '50px', fontSize: fontSize, backgroundColor: '#F8F9FA', borderRadius: '12px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No category data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={categoryBreakdown} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? 0 : 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="category" tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} interval={isMobile ? 'preserveStartEnd' : 0} angle={isMobile ? -20 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                      <YAxis tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} width={isMobile ? 45 : 60} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: fontSize }}
                      />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13, paddingTop: '10px' }} />
                      <Bar dataKey="value" fill="var(--d-primary)" radius={[8, 8, 0, 0]} maxBarSize={isMobile ? 30 : 50} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="d_card" style={{ padding: cardPadding, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: isMobile ? '14px' : '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: headerGap, fontSize: titleFontSize, fontWeight: '700', color: '#2C3E50', margin: 0, flexWrap: 'wrap' }}>
                  <MdLayers style={{ color: 'var(--d-success)' }} /> Stock Movement
                </h5>
              </div>
              <div className="d_card_body" style={{ height: chartHeight, padding: 0, minHeight: isMobile ? '240px' : '280px' }}>
                {stockMovements.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: isMobile ? '30px' : '50px', fontSize: fontSize, backgroundColor: '#F8F9FA', borderRadius: '12px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No stock movement data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={stockMovements} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? 0 : 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="type" tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} interval={isMobile ? 'preserveStartEnd' : 0} angle={isMobile ? -15 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 50 : 30} />
                      <YAxis tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} width={isMobile ? 45 : 60} />
                      <Tooltip
                        formatter={(value) => formatNumber(value)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: fontSize }}
                      />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13, paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="quantity" stroke="var(--d-success)" fill="#00800014" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>


          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${chartCardMinWidth}, 1fr))`, gap: gridGap, marginBottom: isMobile ? '18px' : '28px' }}>
            {/* <div className="d_card" style={{ padding: cardPadding, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: isMobile ? '14px' : '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: headerGap, fontSize: titleFontSize, fontWeight: '700', color: '#2C3E50', margin: 0, flexWrap: 'wrap' }}>
                  <MdBarChart style={{ color: 'var(--d-primary)' }} /> Compliance by Supplier
                </h5>
              </div>
              <div className="d_card_body" style={{ height: chartHeight, padding: 0, minHeight: isMobile ? '240px' : '280px' }}>
                {complianceBySupplier.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: isMobile ? '30px' : '50px', fontSize: fontSize, backgroundColor: '#F8F9FA', borderRadius: '12px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No compliance data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={complianceBySupplier} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? 0 : 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis dataKey="name" tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} interval={isMobile ? 'preserveStartEnd' : 0} angle={isMobile ? -20 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} width={isMobile ? 45 : 60} />
                      <Tooltip
                        formatter={(value) => `${value}%`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: fontSize }}
                      />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13, paddingTop: '10px' }} />
                      <Bar dataKey="compliance" fill="var(--d-primary)" radius={[8, 8, 0, 0]} maxBarSize={isMobile ? 30 : 50} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div> */}
            <div className="d_card" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            <div className="d_card_header" style={{ padding: isMobile ? '14px 16px' : '20px 24px' }}>
              <h2 className="d_card_title" style={{ fontSize: titleFontSize, display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', margin: 0, flex: 1, minWidth: 0 }}>
                <MdBarChart className="d_card_icon" />
                <span style={{ whiteSpace: isMobile ? 'normal' : 'nowrap' }}>Material Purchase &amp; Stock Summary</span>
              </h2>

              <button
                className="d_btn d_btn_outline d_btn_sm"
                onClick={() => navigateTo('Raw Materials')}
                style={{ flexShrink: 0 }}
              >
                View All
              </button>
            </div>

            <div className="d_card_body p-0" style={{ padding: 0 }}>
              <div className="d_table_wrap" style={{ maxWidth: '100%' }}>
                <table className="d_table" style={{ minWidth: isMobile ? '650px' : '750px' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Material</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Stock Value</th>
                    </tr>
                  </thead>

                  <tbody>
                    {materials.length === 0 && (
                      <tr className="d_empty">
                        <td colSpan={7}>
                          No material rows available.
                        </td>
                      </tr>
                    )}

                    {materials.slice(0, 5).map((material, index) => (<tr key={material._id}>                          <td>{index + 1}</td>
                      <td>
                        <strong style={{ fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                          {material.name || material.code}
                        </strong>
                      </td>

                      <td>
                        {material.category || '—'}
                      </td>

                      <td>
                        {formatNumber(material.quantity)}
                      </td>

                      <td>
                        {material.unit || '—'}
                      </td>

                      <td>
                        {formatCurrency(material.unitPrice)}
                      </td>

                      <td>
                        <strong style={{ color: 'var(--d-success)' }}>
                          {formatCurrency(
                            (Number(material.quantity) || 0) *
                            (Number(material.unitPrice) || 0)
                          )}
                        </strong>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

            <div className="d_card" style={{ padding: cardPadding, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}>
              <div className="d_card_header" style={{ marginBottom: isMobile ? '14px' : '24px' }}>
                <h5 className="d_card_title" style={{ display: 'flex', alignItems: 'center', gap: headerGap, fontSize: titleFontSize, fontWeight: '700', color: '#2C3E50', margin: 0, flexWrap: 'wrap' }}>
                  <MdInventory2 style={{ color: 'var(--d-info)' }} /> Top Materials by Quantity
                </h5>
              </div>
              <div className="d_card_body" style={{ height: chartHeight, padding: 0, minHeight: isMobile ? '240px' : '280px' }}>
                {materials.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#7F8C8D', padding: isMobile ? '30px' : '50px', fontSize: fontSize, backgroundColor: '#F8F9FA', borderRadius: '12px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No material data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart
                      data={materials.slice().sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0)).slice(0, isMobile ? 5 : 8)}
                      layout="vertical"
                      margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? 0 : 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF6" />
                      <XAxis type="number" dataKey="quantity" tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} width={isMobile ? 45 : 60} />
                      <YAxis dataKey="name" type="category" width={yAxisWidth} tick={{ fontSize: isMobile ? 11 : 13, fill: '#546E7A' }} />
                      <Tooltip
                        formatter={(value) => formatNumber(value)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8EAF6', backgroundColor: '#FFFFFF', fontSize: fontSize }}
                      />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13, paddingTop: '10px' }} />
                      <Bar dataKey="quantity" fill="var(--d-info)" radius={[0, 8, 8, 0]} maxBarSize={isMobile ? 24 : 36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>


        </>
      )}
    </div>
  );
};

export default RawMaterialReport;
