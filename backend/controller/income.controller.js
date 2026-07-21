const Income = require('../model/Income.model');

const createIncome = async (req, res) => {
    try {
        const income = await Income.create(req.body);
        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllIncome = async (req, res) => {
    try {
        const { startDate, endDate, incomeType } = req.query;
        let query = {};
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        if (incomeType) {
            query.incomeType = incomeType;
        }
        
        const incomes = await Income.find(query).sort({ date: -1 }).populate('customerId').populate('receivedBy');
        res.status(200).json(incomes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getIncomeById = async (req, res) => {
    try {
        const income = await Income.findById(req.params.id).populate('customerId').populate('receivedBy');
        if (!income) {
            return res.status(404).json({ error: 'Income record not found' });
        }
        res.status(200).json(income);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateIncome = async (req, res) => {
    try {
        const income = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!income) {
            return res.status(404).json({ error: 'Income record not found' });
        }
        res.status(200).json(income);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteIncome = async (req, res) => {
    try {
        const income = await Income.findByIdAndDelete(req.params.id);
        if (!income) {
            return res.status(404).json({ error: 'Income record not found' });
        }
        res.status(200).json({ message: 'Income record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTotalIncome = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchStage = {};
        
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }
        
        const result = await Income.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalTax: { $sum: '$taxAmount' },
                    totalDiscount: { $sum: '$discountAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const summary = result[0] || { totalAmount: 0, totalTax: 0, totalDiscount: 0, count: 0 };
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getIncomeByType = async (req, res) => {
    try {
        const result = await Income.aggregate([
            {
                $group: {
                    _id: '$incomeType',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createIncome,
    getAllIncome,
    getIncomeById,
    updateIncome,
    deleteIncome,
    getTotalIncome,
    getIncomeByType
};
