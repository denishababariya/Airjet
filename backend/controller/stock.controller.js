const Stock = require('../model/Stock.model');

const createStock = async (req, res) => {
    try {
        const stock = await Stock.create(req.body);
        res.status(201).json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllStock = async (req, res) => {
    try {
        const stocks = await Stock.find().sort({ createdAt: -1 });
        res.status(200).json(stocks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStockById = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock item not found' });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStock = async (req, res) => {
    try {
        const stock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!stock) {
            return res.status(404).json({ error: 'Stock item not found' });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteStock = async (req, res) => {
    try {
        const stock = await Stock.findByIdAndDelete(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock item not found' });
        }
        res.status(200).json({ message: 'Stock item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLowStockItems = async (req, res) => {
    try {
        const lowStockItems = await Stock.find({ 
            $or: [
                { status: 'Low Stock' },
                { status: 'Out of Stock' }
            ]
        }).sort({ quantity: 1 });
        res.status(200).json(lowStockItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStockQuantity = async (req, res) => {
    try {
        const { quantity, operation } = req.body;
        const stock = await Stock.findById(req.params.id);
        
        if (!stock) {
            return res.status(404).json({ error: 'Stock item not found' });
        }

        if (operation === 'add') {
            stock.quantity += quantity;
            stock.lastRestockDate = new Date();
        } else if (operation === 'subtract') {
            stock.quantity = Math.max(0, stock.quantity - quantity);
        }

        await stock.save();
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createStock,
    getAllStock,
    getStockById,
    updateStock,
    deleteStock,
    getLowStockItems,
    updateStockQuantity
};
