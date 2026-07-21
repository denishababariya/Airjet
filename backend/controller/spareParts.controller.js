const SpareParts = require('../model/SpareParts.model');

const createSparePart = async (req, res) => {
    try {
        const sparePart = await SpareParts.create(req.body);
        res.status(201).json(sparePart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllSpareParts = async (req, res) => {
    try {
        const { category, brand, status } = req.query;
        let query = {};
        
        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (status) query.status = status;
        
        const spareParts = await SpareParts.find(query).sort({ createdAt: -1 });
        res.status(200).json(spareParts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSparePartById = async (req, res) => {
    try {
        const sparePart = await SpareParts.findById(req.params.id);
        if (!sparePart) {
            return res.status(404).json({ error: 'Spare part not found' });
        }
        res.status(200).json(sparePart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSparePart = async (req, res) => {
    try {
        const sparePart = await SpareParts.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!sparePart) {
            return res.status(404).json({ error: 'Spare part not found' });
        }
        res.status(200).json(sparePart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteSparePart = async (req, res) => {
    try {
        const sparePart = await SpareParts.findByIdAndDelete(req.params.id);
        if (!sparePart) {
            return res.status(404).json({ error: 'Spare part not found' });
        }
        res.status(200).json({ message: 'Spare part deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLowStockSpareParts = async (req, res) => {
    try {
        const lowStockParts = await SpareParts.find({ 
            $or: [
                { status: 'Low Stock' },
                { status: 'Out of Stock' }
            ]
        }).sort({ quantity: 1 });
        res.status(200).json(lowStockParts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSparePartQuantity = async (req, res) => {
    try {
        const { quantity, operation } = req.body;
        const sparePart = await SpareParts.findById(req.params.id);
        
        if (!sparePart) {
            return res.status(404).json({ error: 'Spare part not found' });
        }

        if (operation === 'add') {
            sparePart.quantity += quantity;
            sparePart.lastRestockDate = new Date();
        } else if (operation === 'subtract') {
            sparePart.quantity = Math.max(0, sparePart.quantity - quantity);
        }

        await sparePart.save();
        res.status(200).json(sparePart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchSpareParts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const spareParts = await SpareParts.find({
            $or: [
                { partName: { $regex: query, $options: 'i' } },
                { partNumber: { $regex: query, $options: 'i' } },
                { brand: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        });
        res.status(200).json(spareParts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createSparePart,
    getAllSpareParts,
    getSparePartById,
    updateSparePart,
    deleteSparePart,
    getLowStockSpareParts,
    updateSparePartQuantity,
    searchSpareParts
};
