const Customer = require('../model/Customer.model');
const { syncEntityAcrossModules, deleteEntityFromModules, getEntityFromAllModules } = require('../services/universalDataSync.service');

const generateCustomerId = async () => {
    const count = await Customer.countDocuments();
    return `CUS${String(count + 1).padStart(3, '0')}`;
};

const createCustomer = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }
        if (!req.body.contactPerson) {
            return res.status(400).json({ error: 'Contact person is required' });
        }
        if (!req.body.companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }
        if (!req.body.email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        if (!req.body.phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        if (!req.body.city) {
            return res.status(400).json({ error: 'City is required' });
        }
        if (!req.body.state) {
            return res.status(400).json({ error: 'State is required' });
        }
        if (!req.body.pincode) {
            return res.status(400).json({ error: 'Pincode is required' });
        }
        if (req.body.creditLimit < 0 || req.body.creditLimit > 10000000) {
            return res.status(400).json({ error: 'Credit limit must be between 0 and 10,000,000' });
        }
        if (req.body.openingBalance < 0 || req.body.openingBalance > 10000000) {
            return res.status(400).json({ error: 'Opening balance must be between 0 and 10,000,000' });
        }

        const body = { ...req.body };
        if (req.file) {
            body.image = `/uploads/${req.file.filename}`;
        }
        const customer = await Customer.create({
            ...body,
            id: body.id || await generateCustomerId(),
        });
        
        // Sync customer data across relevant modules
        await syncEntityAcrossModules(customer, 'customer', 'create');
        
        res.status(201).json(customer);
    } catch (error) {
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
        const customer = await Customer.findByIdAndUpdate(req.params.id, body, { new: true });
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
