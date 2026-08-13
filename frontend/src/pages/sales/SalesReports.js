import React, { useState, useEffect } from 'react';
import { MdCalendarToday, MdTrendingUp, MdPeople, MdInventory, MdDownload, MdFilterList } from 'react-icons/md';
import api from '../../utils/api';

const tabs = ['Daily', 'Monthly', 'Customer', 'Product', 'GST'];

export default function SalesReports() {
    const [activeTab, setActiveTab] = useState('Daily');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    
    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchReferenceData();
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [activeTab, startDate, endDate, selectedCustomer, selectedProduct, selectedMonth]);

    const fetchReferenceData = async () => {
        try {
            const [customersRes, sparePartsRes] = await Promise.all([
                api.get('/customers'),
                api.get('/spare-parts')
            ]);
            setCustomers(customersRes.data || []);
            setSpareParts(sparePartsRes.data || []);
        } catch (err) {
            console.error('Failed to load reference data:', err);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let url = '';
            let params = {};

            switch (activeTab) {
                case 'Daily':
                    url = '/sales/reports/daily';
                    params = { startDate, endDate };
                    break;
                case 'Monthly':
                    url = '/sales/reports/monthly';
                    params = { month: selectedMonth };
                    break;
                case 'Customer':
                    url = '/sales/reports/customer';
                    if (selectedCustomer) params.customerId = selectedCustomer;
                    break;
                case 'Product':
                    url = '/sales/reports/product';
                    if (selectedProduct) params.productId = selectedProduct;
                    break;
                case 'GST':
                    url = '/sales/reports/gst';
                    params = { startDate, endDate };
                    break;
            }

            const response = await api.get(url, { params });
            setData(response.data?.data || []);
            setSummary(response.data?.summary || null);
        } catch (err) {
            setError('Failed to load report data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const exportReport = () => {
        // Simple CSV export
        let csv = '';
        let filename = '';

        if (activeTab === 'Daily') {
            csv = 'Date,Orders,Total Sales,Total GST\n';
            data.forEach(row => {
                csv += `${row.date},${row.orders},${row.totalSales},${row.totalGST}\n`;
            });
            filename = `daily-sales-${startDate}-to-${endDate}.csv`;
        } else if (activeTab === 'Monthly') {
            csv = 'Day,Orders,Total Sales,Total GST\n';
            data.forEach(row => {
                csv += `${row.day},${row.orders},${row.totalSales},${row.totalGST}\n`;
            });
            filename = `monthly-sales-${selectedMonth}.csv`;
        } else if (activeTab === 'Customer') {
            csv = 'Customer,Orders,Total Purchased,Total Amount,Outstanding\n';
            data.forEach(row => {
                csv += `"${row.customer?.name}",${row.totalOrders},${row.totalQuantity},${row.totalAmount},${row.outstanding}\n`;
            });
            filename = 'customer-sales-report.csv';
        } else if (activeTab === 'Product') {
            csv = 'Product,Part Number,Quantity Sold,Total Revenue\n';
            data.forEach(row => {
                csv += `"${row.part?.partName}",${row.part?.partNumber},${row.totalQuantity},${row.totalRevenue}\n`;
            });
            filename = 'product-sales-report.csv';
        } else if (activeTab === 'GST') {
            csv = 'Date,Total Sales,CGST,SGST,IGST,Total GST\n';
            data.forEach(row => {
                csv += `${row.date},${row.totalSales},${row.totalCGST},${row.totalSGST},${row.totalIGST},${row.totalGST}\n`;
            });
            filename = `gst-report-${startDate}-to-${endDate}.csv`;
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Sales Reports</div>
                    <div className="d_page_subtitle">View and analyze sales data</div>
                </div>
                <button className="d_btn d_btn_outline" onClick={exportReport}><MdDownload /> Export CSV</button>
            </div>

            {error && <div style={{ padding: '12px', background: '#fee', color: '#c33', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

            <div className="d_card">
                <div className="d_card_header">
                    <div className="d_tabs">
                        {tabs.map(t => (
                            <button key={t} className={`d_tab_btn${activeTab === t ? ' d_active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <MdFilterList style={{ color: '#999' }} />
                        {activeTab === 'Daily' && (
                            <>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </>
                        )}
                        {activeTab === 'Monthly' && (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        )}
                        {activeTab === 'Customer' && (
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="">All Customers</option>
                                {customers.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                        {activeTab === 'Product' && (
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="">All Products</option>
                                {spareParts.map(p => (
                                    <option key={p._id} value={p._id}>{p.partNumber} - {p.partName}</option>
                                ))}
                            </select>
                        )}
                        {activeTab === 'GST' && (
                            <>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </>
                        )}
                    </div>
                </div>

                {summary && (
                    <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            {activeTab === 'Daily' && (
                                <>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Orders</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-primary)' }}>{summary.totalOrders}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Sales</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-success)' }}>{formatCurrency(summary.totalSales)}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total GST</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-info)' }}>{formatCurrency(summary.totalGST)}</div>
                                    </div>
                                </>
                            )}
                            {activeTab === 'Customer' && (
                                <>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Customers</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-primary)' }}>{summary.totalCustomers}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Revenue</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-success)' }}>{formatCurrency(summary.totalRevenue)}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Outstanding</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-danger)' }}>{formatCurrency(summary.totalOutstanding)}</div>
                                    </div>
                                </>
                            )}
                            {activeTab === 'Product' && (
                                <>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Products</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-primary)' }}>{summary.totalProducts}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Quantity Sold</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-success)' }}>{summary.totalQuantity}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Revenue</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-info)' }}>{formatCurrency(summary.totalRevenue)}</div>
                                    </div>
                                </>
                            )}
                            {activeTab === 'GST' && (
                                <>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Sales</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-primary)' }}>{formatCurrency(summary.totalSales)}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total CGST</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-success)' }}>{formatCurrency(summary.totalCGST)}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total SGST</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-info)' }}>{formatCurrency(summary.totalSGST)}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total IGST</div>
                                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-warning)' }}>{formatCurrency(summary.totalIGST)}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="d_card_body">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading report data...</div>
                    ) : (
                        <div className="d_table_wrap">
                            <table className="d_table" style={{ minWidth: 800 }}>
                                <thead>
                                    {activeTab === 'Daily' && (
                                        <tr>
                                            <th>Date</th>
                                            <th>Orders</th>
                                            <th>Total Sales (₹)</th>
                                            <th>Total GST (₹)</th>
                                        </tr>
                                    )}
                                    {activeTab === 'Monthly' && (
                                        <tr>
                                            <th>Day</th>
                                            <th>Orders</th>
                                            <th>Total Sales (₹)</th>
                                            <th>Total GST (₹)</th>
                                        </tr>
                                    )}
                                    {activeTab === 'Customer' && (
                                        <tr>
                                            <th>Customer</th>
                                            <th>Total Orders</th>
                                            <th>Total Quantity</th>
                                            <th>Total Amount (₹)</th>
                                            <th>Outstanding (₹)</th>
                                        </tr>
                                    )}
                                    {activeTab === 'Product' && (
                                        <tr>
                                            <th>Product</th>
                                            <th>Part Number</th>
                                            <th>Quantity Sold</th>
                                            <th>Total Revenue (₹)</th>
                                        </tr>
                                    )}
                                    {activeTab === 'GST' && (
                                        <tr>
                                            <th>Date</th>
                                            <th>Total Sales (₹)</th>
                                            <th>CGST (₹)</th>
                                            <th>SGST (₹)</th>
                                            <th>IGST (₹)</th>
                                            <th>Total GST (₹)</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {data.length === 0 && (
                                        <tr className="d_empty">
                                            <td colSpan={activeTab === 'GST' ? 6 : 5}>No data available for selected period.</td>
                                        </tr>
                                    )}
                                    {activeTab === 'Daily' && data.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(row.date).toLocaleDateString('en-IN')}</td>
                                            <td>{row.orders}</td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(row.totalSales)}</td>
                                            <td>{formatCurrency(row.totalGST)}</td>
                                        </tr>
                                    ))}
                                    {activeTab === 'Monthly' && data.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.day}</td>
                                            <td>{row.orders}</td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(row.totalSales)}</td>
                                            <td>{formatCurrency(row.totalGST)}</td>
                                        </tr>
                                    ))}
                                    {activeTab === 'Customer' && data.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.customer?.name || 'Unknown'}</td>
                                            <td>{row.totalOrders}</td>
                                            <td>{row.totalQuantity}</td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(row.totalAmount)}</td>
                                            <td style={{ color: row.outstanding > 0 ? 'var(--d-danger)' : 'var(--d-success)' }}>
                                                {formatCurrency(row.outstanding)}
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'Product' && data.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.part?.partName || 'Unknown'}</td>
                                            <td>{row.part?.partNumber || '-'}</td>
                                            <td>{row.totalQuantity}</td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(row.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                    {activeTab === 'GST' && data.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(row.date).toLocaleDateString('en-IN')}</td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(row.totalSales)}</td>
                                            <td>{formatCurrency(row.totalCGST)}</td>
                                            <td>{formatCurrency(row.totalSGST)}</td>
                                            <td>{formatCurrency(row.totalIGST)}</td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(row.totalGST)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
