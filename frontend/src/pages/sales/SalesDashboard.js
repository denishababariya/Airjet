import React, { useState, useEffect } from 'react';
import { MdTrendingUp, MdShoppingBag, MdReceipt, MdPeople, MdAttachMoney, MdWarning, MdCheckCircle, MdCancel, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import api from '../../utils/api';

export default function SalesDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [chartPeriod, setChartPeriod] = useState('monthly');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/sales/dashboard/summary');
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load dashboard data');
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
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="d_page_title">Sales Dashboard</div>
                <div className="d_page_subtitle">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="d_page_title">Sales Dashboard</div>
                <div className="d_page_subtitle" style={{ color: 'var(--d-danger)' }}>{error}</div>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Sales Dashboard</div>
                    <div className="d_page_subtitle">Overview of your sales performance</div>
                </div>
            </div>

            {/* Today's Summary */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Today's Sales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Today's Sales</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--d-primary)' }}>
                                        {formatCurrency(data?.today?.sales || 0)}
                                    </div>
                                </div>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    background: 'var(--d-primary-light)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'var(--d-primary)'
                                }}>
                                    <MdTrendingUp size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Orders</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                        {data?.today?.orders || 0}
                                    </div>
                                </div>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    background: '#e3f2fd', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#1976d2'
                                }}>
                                    <MdShoppingBag size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Invoices</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                        {data?.today?.invoices || 0}
                                    </div>
                                </div>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    background: '#fff3e0', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#f57c00'
                                }}>
                                    <MdReceipt size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Summary */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>This Month</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Sales</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--d-primary)' }}>
                                {formatCurrency(data?.month?.sales || 0)}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Orders</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                {data?.month?.orders || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Invoices</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                {data?.month?.invoices || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Paid Amount</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
                                {formatCurrency(data?.month?.paid || 0)}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Pending Amount</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
                                {formatCurrency(data?.month?.pending || 0)}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>GST Collected</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9c27b0' }}>
                                {formatCurrency(data?.month?.gstCollected || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Summary */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Orders Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Orders</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                {data?.orders?.total || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Pending</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
                                {data?.orders?.pending || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Completed</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
                                {data?.orders?.completed || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Cancelled</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                                {data?.orders?.cancelled || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Summary */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Invoices Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Invoices</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                {data?.invoices?.total || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Paid</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
                                {data?.invoices?.paid || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Pending</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
                                {data?.invoices?.pending || 0}
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Partially Paid</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196f3' }}>
                                {data?.invoices?.partiallyPaid || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receivables & Customers */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Receivables & Customers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Pending Receivables</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                                        {formatCurrency(data?.receivables?.pending || 0)}
                                    </div>
                                </div>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    background: '#fff3e0', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#f57c00'
                                }}>
                                    <MdAttachMoney size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d_card">
                        <div className="d_card_body">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Customers</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                        {data?.customers?.total || 0}
                                    </div>
                                </div>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    background: '#e3f2fd', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#1976d2'
                                }}>
                                    <MdPeople size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Selling Parts */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Top Selling Parts</h3>
                <div className="d_card">
                    <div className="d_card_body">
                        {data?.topSellingParts?.length > 0 ? (
                            <div className="d_table_wrap">
                                <table className="d_table">
                                    <thead>
                                        <tr>
                                            <th>Part Number</th>
                                            <th>Part Name</th>
                                            <th>Quantity Sold</th>
                                            <th>Sales Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.topSellingParts.map((part, index) => (
                                            <tr key={index}>
                                                <td><code>{part.partNumber}</code></td>
                                                <td>{part.partName}</td>
                                                <td>{part.quantitySold}</td>
                                                <td>{formatCurrency(part.salesAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                No sales data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Customers */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Top Customers</h3>
                <div className="d_card">
                    <div className="d_card_body">
                        {data?.topCustomers?.length > 0 ? (
                            <div className="d_table_wrap">
                                <table className="d_table">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Company</th>
                                            <th>Total Orders</th>
                                            <th>Total Purchase</th>
                                            <th>Pending</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.topCustomers.map((customer, index) => (
                                            <tr key={index}>
                                                <td>{customer.customerName}</td>
                                                <td>{customer.companyName || '-'}</td>
                                                <td>{customer.totalOrders}</td>
                                                <td>{formatCurrency(customer.totalPurchase)}</td>
                                                <td style={{ color: customer.totalPending > 0 ? '#f57c00' : 'inherit' }}>
                                                    {formatCurrency(customer.totalPending)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                No customer data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
