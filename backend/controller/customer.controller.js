const Customer = require('../model/Customer.model');
const { syncEntityAcrossModules, deleteEntityFromModules, getEntityFromAllModules } = require('../services/universalDataSync.service');

const generateCustomerId = async () => {
    const count = await Customer.countDocuments();
    return `CUS${String(count + 1).padStart(3, '0')}`;
};

const createCustomer = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name?.trim()) {
            return res.status(400).json({ error: 'Customer name is required' });
        }
        if (!req.body.contactPerson?.trim()) {
            return res.status(400).json({ error: 'Contact person is required' });
        }
        if (!req.body.companyName?.trim()) {
            return res.status(400).json({ error: 'Company name is required' });
        }
        if (!req.body.email?.trim()) {
            return res.status(400).json({ error: 'Email is required' });
        }
        if (!req.body.phone?.trim()) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        if (!req.body.city?.trim()) {
            return res.status(400).json({ error: 'City is required' });
        }
        if (!req.body.state?.trim()) {
            return res.status(400).json({ error: 'State is required' });
        }
        if (!req.body.pincode?.trim()) {
            return res.status(400).json({ error: 'Pincode is required' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())) {
            return res.status(400).json({ error: 'Enter a valid email address' });
        }
        if (!/^\d{10}$/.test(req.body.phone.trim())) {
            return res.status(400).json({ error: 'Enter a valid 10 digit phone number' });
        }
        if (!/^\d{6}$/.test(req.body.pincode.trim())) {
            return res.status(400).json({ error: 'Enter a valid 6 digit pincode' });
        }
        if (req.body.alternatePhone && !/^\d{10}$/.test(req.body.alternatePhone.trim())) {
            return res.status(400).json({ error: 'Enter a valid 10 digit alternate phone number' });
        }
        const gstNumber = req.body.gstNumber?.trim().toUpperCase();
        const panNumber = req.body.panNumber?.trim().toUpperCase();
        if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber)) {
            return res.status(400).json({ error: 'Enter a valid GST number' });
        }
        if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
            return res.status(400).json({ error: 'Enter a valid PAN number' });
        }
        if (req.body.creditLimit < 0 || req.body.creditLimit > 10000000) {
            return res.status(400).json({ error: 'Credit limit must be between 0 and 10,000,000' });
        }
        if (req.body.openingBalance < 0 || req.body.openingBalance > 10000000) {
            return res.status(400).json({ error: 'Opening balance must be between 0 and 10,000,000' });
        }

        const body = {
            ...req.body,
            name: req.body.name.trim(),
            contactPerson: req.body.contactPerson.trim(),
            companyName: req.body.companyName.trim(),
            email: req.body.email.trim().toLowerCase(),
            phone: req.body.phone.trim(),
            city: req.body.city.trim(),
            state: req.body.state.trim(),
            pincode: req.body.pincode.trim(),
            gstNumber: gstNumber || '',
            panNumber: panNumber || '',
        };
        if (req.file) {
            body.image = `/uploads/${req.file.filename}`;
        }
        const customer = await Customer.create({
            ...body,
            id: body.id || await generateCustomerId(),
        });
        
        // Sync customer data across relevant modules
        try {
            await syncEntityAcrossModules(customer, 'customer', 'create');
        } catch (syncError) {
            // Customer creation has succeeded; a secondary ERP sync issue must
            // not tell the client that the create failed and invite duplicates.
            console.error('Customer created, but ERP sync failed:', syncError);
        }
        
        res.status(201).json(customer);
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'value';
            return res.status(409).json({ error: `A customer with this ${field} already exists.` });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

const getAllCustomers = async (req, res) => {
    try {
        const { status, customerType, city } = req.query;
        let query = {};
        
        if (status) query.status = status;
        if (customerType) query.customerType = customerType;
        if (city) query.city = city;
        
        const customers = await Customer.find(query).sort({ createdAt: -1 });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const body = { ...req.body };
        if (req.file) {
            body.image = `/uploads/${req.file.filename}`;
        }
        const customer = await Customer.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Sync updated customer data across relevant modules
        await syncEntityAcrossModules(customer, 'customer', 'update');
        
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Delete customer data from all modules
        await deleteEntityFromModules(req.params.id, 'customer');
        
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchCustomers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const customers = await Customer.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
                { companyName: { $regex: query, $options: 'i' } }
            ]
        });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCustomerPurchase = async (req, res) => {
    try {
        const { amount, purchaseCount = 1 } = req.body;
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        customer.totalPurchases += purchaseCount;
        customer.totalAmountSpent += amount;
        customer.lastPurchaseDate = new Date();
        
        await customer.save();
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCustomerModuleData = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const SalesOrder = require('../model/SalesOrder.model');
        const Payment = require('../model/Payment.model');
        
        // Get sales summary
        const salesOrders = await SalesOrder.find({ customer: req.params.id });
        const totalOrders = salesOrders.length;
        const totalPurchased = salesOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
        
        const payments = await Payment.find({ customer: req.params.id });
        const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        const lastPurchaseDate = salesOrders.length > 0 
            ? salesOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))[0].orderDate
            : null;
        
        const salesSummary = {
            totalOrders,
            totalPurchased,
            totalPaid,
            lastPurchaseDate
        };
        
        res.status(200).json({
            customer,
            salesSummary
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    updateCustomerPurchase,
    getCustomerModuleData
};
