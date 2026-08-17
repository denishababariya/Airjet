import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdEdit, MdPrint, MdDescription, MdPerson, MdCalendarToday, MdLocationOn, MdAttachMoney, MdCheck, MdClose, MdSend } from 'react-icons/md';
import api from '../../utils/api';

export default function QuotationDetail({ quotationId, setActiveMenu, onBack }) {
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (quotationId) {
            fetchQuotationData();
        }
    }, [quotationId]);

    const fetchQuotationData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/quotations/${quotationId}`);
            setQuotation(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load quotation data');
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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN');
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="d_page_header">
                <div>
                    <div className="d_page_title">Quotation Detail</div>
                    <div className="d_page_subtitle">Loading...</div>
                </div>
                <button className="d_btn d_btn_outline" onClick={onBack}>
                    <MdArrowBack /> Back
                </button>
            </div>
        );
    }

    if (error || !quotation) {
        return (
            <div className="d_page_header">
                <div>
                    <div className="d_page_title">Error</div>
                    <div className="d_page_subtitle">{error || 'Quotation not found'}</div>
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
                    <div className="d_page_title">Quotation #{quotation.quotationNumber}</div>
                    <div className="d_page_subtitle">{quotation.customer?.name} - {formatDate(quotation.quotationDate)}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="d_btn d_btn_outline" onClick={handlePrint}>
                        <MdPrint /> Print
                    </button>
                    <button className="d_btn d_btn_primary" onClick={onBack}>
                        <MdEdit /> Edit
                    </button>
                </div>
            </div>

            <div className="d_card" style={{ marginBottom: '20px' }}>
                <div className="d_card_header">
                    <h3>Quotation Information</h3>
                </div>
                <div className="d_card_body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Customer</div>
                            <div style={{ fontWeight: 'bold' }}>{quotation.customer?.name}</div>
                            <div style={{ fontSize: '0.9em', color: '#666' }}>{quotation.customer?.companyName}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Quotation Date</div>
                            <div style={{ fontWeight: 'bold' }}>{formatDate(quotation.quotationDate)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Valid Until</div>
                            <div style={{ fontWeight: 'bold', color: new Date(quotation.validUntil) < new Date() ? 'var(--d-danger)' : 'var(--d-success)' }}>
                                {formatDate(quotation.validUntil)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Sales Person</div>
                            <div style={{ fontWeight: 'bold' }}>{quotation.salesPerson}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Status</div>
                            <span className={`d_badge ${quotation.status === 'Accepted' ? 'd_success' : quotation.status === 'Rejected' ? 'd_danger' : quotation.status === 'Sent' ? 'd_info' : 'd_warning'}`}>
                                {quotation.status}
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Payment Terms</div>
                            <div style={{ fontWeight: 'bold' }}>{quotation.paymentTerms}</div>
                        </div>
                    </div>
                    {quotation.billingAddress && (
                        <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Billing Address</div>
                            <div>{quotation.billingAddress}</div>
                        </div>
                    )}
                    {quotation.shippingAddress && quotation.shippingAddress !== quotation.billingAddress && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Shipping Address</div>
                            <div>{quotation.shippingAddress}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="d_card" style={{ marginBottom: '20px' }}>
                <div className="d_card_header">
                    <h3>Items</h3>
                </div>
                <div className="d_card_body">
                    <table className="d_table">
                        <thead>
                            <tr>
                                <th>Part Number</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>Discount</th>
                                <th>Taxable</th>
                                <th>GST</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.items?.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.partNumber}</td>
                                    <td>{item.description}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.rate)}</td>
                                    <td>{formatCurrency(item.discount)}</td>
                                    <td>{formatCurrency(item.taxableAmount)}</td>
                                    <td>{item.gstRate}%</td>
                                    <td>{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="d_card" style={{ marginBottom: '20px' }}>
                <div className="d_card_header">
                    <h3>Summary</h3>
                </div>
                <div className="d_card_body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Subtotal</div>
                            <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{formatCurrency(quotation.subtotal)}</div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Total Discount</div>
                            <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: 'var(--d-success)' }}>{formatCurrency(quotation.totalDiscount)}</div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>CGST</div>
                            <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{formatCurrency(quotation.cgst)}</div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>SGST</div>
                            <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{formatCurrency(quotation.sgst)}</div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>IGST</div>
                            <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{formatCurrency(quotation.igst)}</div>
                        </div>
                        <div style={{ background: 'var(--d-primary)', color: 'white', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9em', marginBottom: '5px' }}>Grand Total</div>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{formatCurrency(quotation.grandTotal)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {(quotation.notes || quotation.terms) && (
                <div className="d_card" style={{ marginBottom: '20px' }}>
                    <div className="d_card_header">
                        <h3>Additional Information</h3>
                    </div>
                    <div className="d_card_body">
                        {quotation.notes && (
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Notes</div>
                                <div>{quotation.notes}</div>
                            </div>
                        )}
                        {quotation.terms && (
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>Terms & Conditions</div>
                                <div>{quotation.terms}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
