const Customer = require('../model/Customer.model');
const { syncEntityAcrossModules, deleteEntityFromModules, getEntityFromAllModules } = require('../services/universalDataSync.service');

const createCustomer = async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        
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
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
        
        const moduleData = await getEntityFromAllModules(req.params.id, 'customer');
        
        res.status(200).json({
            customer,
            moduleData
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
