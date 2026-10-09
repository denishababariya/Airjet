import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdEdit, MdShoppingCart, MdReceipt, MdAccountBalance, MdWarning, MdPhone, MdEmail, MdLocationOn, MdBusiness, MdPerson, MdCalendarToday } from 'react-icons/md';
import api from '../../utils/api';
import { getErrorMessage } from '../../utils/errorMessages';

export default function CustomerDetail({ customerId, setActiveMenu, onBack }) {
    const [customer, setCustomer] = useState(null);
    const [salesSummary, setSalesSummary] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (customerId) {
            fetchCustomerData();
        }
    }, [customerId]);

    const fetchCustomerData = async () => {
        try {
            setLoading(true);
            const [customerRes, ordersRes] = await Promise.all([
                api.get(`/customers/${customerId}/modules`),
                api.get(`/sales-orders?customer=${customerId}`)
            ]);
            setCustomer(customerRes.data.customer);
            setSalesSummary(customerRes.data.salesSummary);
            setRecentOrders(ordersRes.data || []);
            setError(null);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load customer data'));
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

    if (loading) {
        return (
            <div className="d_page_header">
                <div>
                    <div className="d_page_title">Loading...</div>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="d_page_header">
                <div>
                    <div className="d_page_title">Error</div>
                    <div className="d_page_subtitle">{error || 'Customer not found'}</div>
                </div>
                <button className="d_btn d_btn_outline" onClick={onBack}>
                    <MdArrowBack /> Back
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header">
                <div>
                    <button className="d_btn d_btn_outline" onClick={onBack} style={{ marginBottom: '10px' }}>
                        <MdArrowBack /> Back
                    </button>
                    <div className="d_page_title">{customer.name}</div>
                    <div className="d_page_subtitle">{customer.companyName || 'Individual Customer'}</div>
                </div>
                <button className="d_btn d_btn_primary" onClick={onBack}>
                    <MdEdit /> Edit Customer
                </button>
            </div>

            {error && <div style={{ padding: '12px', background: '#fee', color: '#c33', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

            {/* Customer Information */}
            <div className="d_card" style={{ marginBottom: '20px' }}>
                <div className="d_card_header">
                    <h3>Customer Information</h3>
                </div>
                <div className="d_card_body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MdPerson style={{ color: 'var(--d-primary)', fontSize: '1.5em' }} />
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>Customer ID</div>
                                <div style={{ fontWeight: 'bold' }}>{customer.id}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MdPhone style={{ color: 'var(--d-primary)', fontSize: '1.5em' }} />
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>Phone</div>
                                <div style={{ fontWeight: 'bold' }}>{customer.phone}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MdEmail style={{ color: 'var(--d-primary)', fontSize: '1.5em' }} />
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>Email</div>
                                <div style={{ fontWeight: 'bold' }}>{customer.email}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MdLocationOn style={{ color: 'var(--d-primary)', fontSize: '1.5em' }} />
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>City</div>
                                <div style={{ fontWeight: 'bold' }}>{customer.city || '-'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MdBusiness style={{ color: 'var(--d-primary)', fontSize: '1.5em' }} />
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>State</div>
                                <div style={{ fontWeight: 'bold' }}>{customer.state || '-'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`d_badge ${customer.status === 'Active' ? 'd_success' : customer.status === 'Inactive' ? 'd_warning' : 'd_danger'}`}>
                                {customer.status}
                            </span>
                            <span className="d_badge d_info">{customer.customerType}</span>
                        </div>
                    </div>
                    {customer.address && (
                        <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Address</div>
                            <div>{customer.address}</div>
                            {customer.pincode && <div>{customer.city}, {customer.state} - {customer.pincode}</div>}
                        </div>
                    )}
                    {customer.gstNumber && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>GST Number</div>
                            <div style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{customer.gstNumber}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Credit Information */}
            <div className="d_card" style={{ marginBottom: '20px' }}>
                <div className="d_card_header">
                    <h3>Credit Information</h3>
                </div>
                <div className="d_card_body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Credit Limit</div>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-primary)' }}>{formatCurrency(customer.creditLimit)}</div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Current Balance</div>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: customer.currentBalance > 0 ? 'var(--d-danger)' : 'var(--d-success)' }}>
                                {formatCurrency(customer.currentBalance)}
                            </div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Available Credit</div>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-success)' }}>
                                {formatCurrency(customer.creditLimit - customer.currentBalance)}
                            </div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Payment Terms</div>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--d-info)' }}>{customer.paymentTerms || '30 Days'}</div>
                        </div>
                    </div>
                    {customer.currentBalance > customer.creditLimit && (
                        <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MdWarning style={{ color: '#856404', fontSize: '1.5em' }} />
                            <span style={{ color: '#856404', fontWeight: 'bold' }}>Credit limit exceeded by {formatCurrency(customer.currentBalance - customer.creditLimit)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sales Summary */}
            {salesSummary && (
                <div className="d_card" style={{ marginBottom: '20px' }}>
                    <div className="d_card_header">
                        <h3>Sales Summary</h3>
                    </div>
                    <div className="d_card_body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <MdShoppingCart style={{ color: 'var(--d-primary)' }} />
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>Total Orders</span>
                                </div>
                                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{salesSummary.totalOrders || 0}</div>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <MdReceipt style={{ color: 'var(--d-success)' }} />
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>Total Purchased</span>
                                </div>
                                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{formatCurrency(salesSummary.totalPurchased || 0)}</div>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <MdAccountBalance style={{ color: 'var(--d-info)' }} />
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>Total Paid</span>
                                </div>
                                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{formatCurrency(salesSummary.totalPaid || 0)}</div>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <MdCalendarToday style={{ color: 'var(--d-warning)' }} />
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>Last Purchase</span>
                                </div>
                                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                                    {salesSummary.lastPurchaseDate ? new Date(salesSummary.lastPurchaseDate).toLocaleDateString('en-IN') : 'Never'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Orders */}
            <div className="d_card">
                <div className="d_card_header">
                    <h3>Recent Sales Orders</h3>
                </div>
                <div className="d_card_body">
                    {recentOrders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No sales orders found</div>
                    ) : (
                        <div className="d_table_wrap">
                            <table className="d_table">
                                <thead>
                                    <tr>
                                        <th>Order No.</th>
                                        <th>Date</th>
                                        <th>Total (₹)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.slice(0, 10).map(order => (
                                        <tr key={order._id}>
                                            <td><strong>{order.orderNumber}</strong></td>
                                            <td>{new Date(order.orderDate).toLocaleDateString('en-IN')}</td>
                                            <td>{formatCurrency(order.grandTotal)}</td>
                                            <td>
                                                <span className={`d_badge ${
                                                    order.status === 'Completed' ? 'd_success' :
                                                    order.status === 'Cancelled' ? 'd_danger' :
                                                    order.status === 'Confirmed' ? 'd_info' : 'd_warning'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
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
