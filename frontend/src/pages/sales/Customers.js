import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch, MdPeople } from 'react-icons/md';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import CustomerDetail from './CustomerDetail';
import api from '../../utils/api';

const blankCustomer = {
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    customerType: 'Other',
    creditLimit: 0,
    creditDays: 30,
    paymentTerms: '30 Days',
    openingBalance: 0,
    billingAddress: '',
    shippingAddress: '',
    status: 'Active',
    notes: ''
};

export default function Customers({ setActiveMenu }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(blankCustomer);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [viewModal, setViewModal] = useState(false);
    const [viewCustomer, setViewCustomer] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/customers');
            setCustomers(response.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load customers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        c.gstNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setForm({ ...blankCustomer });
        setEditId(null);
        setErrors({});
        setModal(true);
    };

    const openEdit = (customer) => {
        setForm({
            name: customer.name || '',
            companyName: customer.companyName || '',
            contactPerson: customer.contactPerson || '',
            email: customer.email || '',
            phone: customer.phone || '',
            alternatePhone: customer.alternatePhone || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            gstNumber: customer.gstNumber || '',
            panNumber: customer.panNumber || '',
            customerType: customer.customerType || 'Other',
            creditLimit: customer.creditLimit || 0,
            creditDays: customer.creditDays || 30,
            paymentTerms: customer.paymentTerms || '30 Days',
            openingBalance: customer.openingBalance || 0,
            billingAddress: customer.billingAddress || '',
            shippingAddress: customer.shippingAddress || '',
            status: customer.status || 'Active',
            notes: customer.notes || ''
        });
        setEditId(customer._id);
        setErrors({});
        setModal(true);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Customer name is required';
        if (!form.contactPerson.trim()) e.contactPerson = 'Contact person is required';
        if (!form.companyName.trim()) e.companyName = 'Company name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        if (!form.phone.trim()) e.phone = 'Phone is required';
        if (!form.city.trim()) e.city = 'City is required';
        if (!form.state.trim()) e.state = 'State is required';
        if (!form.pincode.trim()) e.pincode = 'Pincode is required';
        if (form.creditLimit < 0 || form.creditLimit > 10000000) e.creditLimit = 'Credit limit must be between 0 and 10,000,000';
        if (form.openingBalance < 0 || form.openingBalance > 10000000) e.openingBalance = 'Opening balance must be between 0 and 10,000,000';
        return e;
    };

    const handleSave = async () => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        try {
            if (editId) {
                await api.put(`/customers/${editId}`, form);
            } else {
                await api.post('/customers', form);
            }
            setModal(false);
            fetchCustomers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save customer');
        }
    };

    const handleDelete = async (id) => {
        const customer = customers.find(c => c._id === id);
        setConfirmModal({
            open: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/customers/${id}`);
                    fetchCustomers();
                    setConfirmModal({ open: false, onConfirm: null, title: '', message: '' });
                } catch (err) {
                    setError(err.response?.data?.error || 'Failed to delete customer');
                }
            },
            title: 'Delete Customer',
            message: `Are you sure you want to delete ${customer?.name || 'this customer'}? This action cannot be undone.`
        });
    };

    const handleView = (customer) => {
        setViewCustomer(customer);
        setViewModal(true);
    };

    const f = (field) => ({
        value: form[field] ?? '',
        onChange: (e) => {
            setForm(p => ({ ...p, [field]: e.target.value }));
            setErrors(p => ({ ...p, [field]: '' }));
        }
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Customers</div>
                    <div className="d_page_subtitle">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Customers</div>
                    <div className="d_page_subtitle">Manage textile mills and weaving industry clients</div>
                </div>
                <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Customer</button>
            </div>

            {error && <div style={{ padding: '12px', background: '#fee', color: '#c33', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

            <div className="d_card">
                <div className="d_card_header">
                    <div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Customer List ({filtered.length})</div>
                    <div className="d_search_box">
                        <span className="d_search_icon"><MdSearch /></span>
                        <input className="d_search_input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="d_card_body">
                    <div className="d_table_wrap">
                        <table className="d_table" style={{ minWidth: 1000 }}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Contact Person</th>
                                    <th>Phone</th>
                                    <th>City</th>
                                    <th>GST No.</th>
                                    <th>Credit Limit</th>
                                    <th>Outstanding</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr className="d_empty">
                                        <td colSpan={11}>No customers found.</td>
                                    </tr>
                                )}
                                {filtered.map(c => (
                                    <tr key={c._id}>
                                        <td><code>{c.id}</code></td>
                                        <td>{c.name}</td>
                                        <td>{c.companyName || '-'}</td>
                                        <td>{c.contactPerson || '-'}</td>
                                        <td>{c.phone}</td>
                                        <td>{c.city}</td>
                                        <td><code>{c.gstNumber || '-'}</code></td>
                                        <td>{formatCurrency(c.creditLimit)}</td>
                                        <td style={{ color: c.currentBalance > 0 ? 'var(--d-danger)' : 'inherit' }}>
                                            {formatCurrency(c.currentBalance)}
                                        </td>
                                        <td><span className={`d_badge ${c.status === 'Active' ? 'd_success' : 'd_danger'}`}>{c.status}</span></td>
                                        <td>
                                            <div className="d_action_btns">
                                                <button className="d_icon_btn d_view" onClick={() => handleView(c)}><MdVisibility /></button>
                                                <button className="d_icon_btn d_edit" onClick={() => openEdit(c)}><MdEdit /></button>
                                                <button className="d_icon_btn d_del" onClick={() => handleDelete(c._id)}><MdDelete /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Customer' : 'Add Customer'} size="xl">
                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Customer Name <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('name')} placeholder="Enter customer name" />
                        {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Company Name <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('companyName')} placeholder="Enter company name" />
                        {errors.companyName && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.companyName}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Contact Person <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('contactPerson')} placeholder="Enter contact person name" />
                        {errors.contactPerson && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.contactPerson}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Email <span className="d_req">*</span></label>
                        <input type="email" className="d_form_control" {...f('email')} placeholder="Enter email address" />
                        {errors.email && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.email}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Phone <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('phone')} />
                        {errors.phone && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.phone}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Alternate Phone</label>
                        <input className="d_form_control" {...f('alternatePhone')} />
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Address</label>
                        <textarea className="d_form_control" rows="2" {...f('address')} />
                    </div>
                </div>

                <div className="d_form_row cols-3">
                    <div className="d_form_group">
                        <label className="d_form_label">City <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('city')} placeholder="Enter city" />
                        {errors.city && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.city}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">State <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('state')} placeholder="Enter state" />
                        {errors.state && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.state}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Pincode <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('pincode')} placeholder="Enter pincode" />
                        {errors.pincode && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.pincode}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">GST Number</label>
                        <input className="d_form_control" {...f('gstNumber')} placeholder="24AABCU1234A1Z8" />
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">PAN Number</label>
                        <input className="d_form_control" {...f('panNumber')} placeholder="ABCDE1234F" />
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Customer Type</label>
                        <select className="d_form_control" {...f('customerType')}>
                            <option value="Dealer">Dealer</option>
                            <option value="Distributor">Distributor</option>
                            <option value="Retailer">Retailer</option>
                            <option value="Manufacturer">Manufacturer</option>
                            <option value="Service Customer">Service Customer</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Status</label>
                        <select className="d_form_control" {...f('status')}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Blocked">Blocked</option>
                        </select>
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Credit Limit (₹)</label>
                        <input type="number" className="d_form_control" {...f('creditLimit')} min="0" max="10000000" placeholder="Max: 10,000,000" />
                        {errors.creditLimit && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.creditLimit}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Credit Days</label>
                        <input type="number" className="d_form_control" {...f('creditDays')} min="0" />
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Terms</label>
                        <select className="d_form_control" {...f('paymentTerms')}>
                            <option value="Cash">Cash</option>
                            <option value="Immediate">Immediate</option>
                            <option value="7 Days">7 Days</option>
                            <option value="15 Days">15 Days</option>
                            <option value="30 Days">30 Days</option>
                            <option value="45 Days">45 Days</option>
                            <option value="60 Days">60 Days</option>
                        </select>
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Opening Balance (₹)</label>
                        <input type="number" className="d_form_control" {...f('openingBalance')} min="0" max="10000000" placeholder="Max: 10,000,000" />
                        {errors.openingBalance && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.openingBalance}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Billing Address</label>
                        <textarea className="d_form_control" rows="2" {...f('billingAddress')} />
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Shipping Address</label>
                        <textarea className="d_form_control" rows="2" {...f('shippingAddress')} />
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Notes</label>
                        <textarea className="d_form_control" rows="2" {...f('notes')} />
                    </div>
                </div>

                <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Customer' : 'Create Customer'}</button>
                </div>
            </Modal>

            {/* View Customer Modal */}
            <Modal open={viewModal} onClose={() => setViewModal(false)} title="Customer Details" size="xl">
                {viewCustomer && (
                    <div>
                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Customer Name</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.name}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Company Name</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.companyName}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Contact Person</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.contactPerson}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Email</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.email}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Phone</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.phone}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Alternate Phone</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.alternPhone || '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-1">
                            <div className="d_form_group">
                                <label className="d_form_label">Address</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewCustomer.address || '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-3">
                            <div className="d_form_group">
                                <label className="d_form_label">City</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.city}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">State</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.state}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Pincode</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.pincode}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">GST Number</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontFamily: 'monospace' }}>{viewCustomer.gstNumber || '-'}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">PAN Number</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontFamily: 'monospace' }}>{viewCustomer.panNumber || '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Customer Type</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.customerType}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Status</label>
                                <span className={`d_badge ${viewCustomer.status === 'Active' ? 'd_success' : viewCustomer.status === 'Inactive' ? 'd_warning' : 'd_danger'}`}>
                                    {viewCustomer.status}
                                </span>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Credit Limit (₹)</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold', color: 'var(--d-primary)' }}>
                                    {new Intl.NumberFormat('en-IN').format(viewCustomer.creditLimit || 0)}
                                </div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Credit Days</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.creditDays || 30}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Payment Terms</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewCustomer.paymentTerms}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Opening Balance (₹)</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold', color: 'var(--d-info)' }}>
                                    {new Intl.NumberFormat('en-IN').format(viewCustomer.openingBalance || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="d_form_row cols-1">
                            <div className="d_form_group">
                                <label className="d_form_label">Billing Address</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewCustomer.billingAddress || '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-1">
                            <div className="d_form_group">
                                <label className="d_form_label">Shipping Address</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewCustomer.shippingAddress || '-'}</div>
                            </div>
                        </div>

                        {viewCustomer.notes && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Notes</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewCustomer.notes}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmModal
                open={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, onConfirm: null, title: '', message: '' })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
