const Invoice = require('../model/Invoice.model');
const SalesOrder = require('../model/SalesOrder.model');
const Quotation = require('../model/Quotation.model');
const Customer = require('../model/Customer.model');
const Payment = require('../model/Payment.model');
const SpareParts = require('../model/SpareParts.model');

// Get sales dashboard summary
exports.getDashboardSummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisYear = new Date(today.getFullYear(), 0, 1);
        
        // Today's sales
        const todayInvoices = await Invoice.find({
            invoiceDate: { $gte: today },
            status: { $ne: 'Cancelled' }
        });
        
        const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const todayOrders = await SalesOrder.countDocuments({
            orderDate: { $gte: today }
        });
        const todayInvoicesCount = todayInvoices.length;
        
        // Monthly sales
        const monthlyInvoices = await Invoice.find({
            invoiceDate: { $gte: thisMonth },
            status: { $ne: 'Cancelled' }
        });
        
        const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const monthlyOrders = await SalesOrder.countDocuments({
            orderDate: { $gte: thisMonth }
        });
        const monthlyInvoicesCount = monthlyInvoices.length;
        
        // Calculate monthly GST collected
        const monthlyGST = monthlyInvoices.reduce((sum, inv) => sum + inv.cgst + inv.sgst + inv.igst, 0);
        
        // Calculate monthly paid and pending
        const monthlyPaid = monthlyInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const monthlyPending = monthlyInvoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);
        
        // Yearly sales
        const yearlyInvoices = await Invoice.find({
            invoiceDate: { $gte: thisYear },
            status: { $ne: 'Cancelled' }
        });
        
        const yearlySales = yearlyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        
        // Total orders by status
        const totalOrders = await SalesOrder.countDocuments();
        const pendingOrders = await SalesOrder.countDocuments({ status: 'Draft' });
        const completedOrders = await SalesOrder.countDocuments({ status: 'Completed' });
        const cancelledOrders = await SalesOrder.countDocuments({ status: 'Cancelled' });
        
        // Total invoices
        const totalInvoices = await Invoice.countDocuments();
        const paidInvoices = await Invoice.countDocuments({ paymentStatus: 'Paid' });
        const pendingInvoices = await Invoice.countDocuments({ paymentStatus: 'Unpaid' });
        const partiallyPaidInvoices = await Invoice.countDocuments({ paymentStatus: 'Partially Paid' });
        
        // Pending receivables
        const pendingReceivables = await Invoice.aggregate([
            { $match: { paymentStatus: { $in: ['Unpaid', 'Partially Paid'] }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
        ]);
        
        // Total customers
        const totalCustomers = await Customer.countDocuments({ status: 'Active' });
        
        // Top selling parts
        const topSellingParts = await Invoice.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.sparePart',
                partNumber: { $first: '$items.partNumber' },
                partName: { $first: '$items.description' },
                quantitySold: { $sum: '$items.quantity' },
                salesAmount: { $sum: '$items.total' }
            }},
            { $sort: { salesAmount: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'spareparts',
                localField: '_id',
                foreignField: '_id',
                as: 'partDetails'
            }},
            { $unwind: '$partDetails' }
        ]);
        
        // Top customers
        const topCustomers = await Invoice.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: {
                _id: '$customer',
                totalOrders: { $sum: 1 },
                totalPurchase: { $sum: '$grandTotal' },
                totalPaid: { $sum: '$paidAmount' },
                totalPending: { $sum: '$pendingAmount' }
            }},
            { $sort: { totalPurchase: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'customers',
                localField: '_id',
                foreignField: '_id',
                as: 'customerDetails'
            }},
            { $unwind: '$customerDetails' },
            { $project: {
                customerName: '$customerDetails.name',
                companyName: '$customerDetails.companyName',
                totalOrders: 1,
                totalPurchase: 1,
                totalPaid: 1,
                totalPending: 1
            }}
        ]);
        
        res.json({
            today: {
                sales: todaySales,
                orders: todayOrders,
                invoices: todayInvoicesCount
            },
            month: {
                sales: monthlySales,
                orders: monthlyOrders,
                invoices: monthlyInvoicesCount,
                paid: monthlyPaid,
                pending: monthlyPending,
                gstCollected: monthlyGST
            },
            year: {
                sales: yearlySales
            },
            orders: {
                total: totalOrders,
                pending: pendingOrders,
                completed: completedOrders,
                cancelled: cancelledOrders
            },
            invoices: {
                total: totalInvoices,
                paid: paidInvoices,
                pending: pendingInvoices,
                partiallyPaid: partiallyPaidInvoices
            },
            receivables: {
                pending: pendingReceivables[0]?.total || 0
            },
            customers: {
                total: totalCustomers
            },
            topSellingParts,
            topCustomers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get sales chart data
exports.getSalesChartData = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;
        
        let groupBy, dateFormat;
        const matchCondition = { status: { $ne: 'Cancelled' } };
        
        if (startDate && endDate) {
            matchCondition.invoiceDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        switch (period) {
            case 'daily':
                groupBy = {
                    year: { $year: '$invoiceDate' },
                    month: { $month: '$invoiceDate' },
                    day: { $dayOfMonth: '$invoiceDate' }
                };
                dateFormat = '%Y-%m-%d';
                break;
            case 'weekly':
                groupBy = {
                    year: { $year: '$invoiceDate' },
                    week: { $week: '$invoiceDate' }
                };
                break;
            case 'monthly':
            default:
                groupBy = {
                    year: { $year: '$invoiceDate' },
                    month: { $month: '$invoiceDate' }
                };
                break;
        }
        
        const salesData = await Invoice.aggregate([
            { $match: matchCondition },
            { $group: {
                _id: groupBy,
                sales: { $sum: '$grandTotal' },
                orders: { $sum: 1 },
                gst: { $sum: { $add: ['$cgst', '$sgst', '$igst'] } }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ]);
        
        res.json(salesData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get daily sales report
exports.getDailySalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const matchCondition = { status: { $ne: 'Cancelled' } };
        if (startDate && endDate) {
            matchCondition.invoiceDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const report = await Invoice.aggregate([
            { $match: matchCondition },
            { $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } }
                },
                orders: { $sum: 1 },
                invoices: { $sum: 1 },
                sales: { $sum: '$grandTotal' },
                gst: { $sum: { $add: ['$cgst', '$sgst', '$igst'] } },
                discount: { $sum: '$totalDiscount' },
                paid: { $sum: '$paidAmount' },
                pending: { $sum: '$pendingAmount' }
            }},
            { $sort: { '_id.date': 1 } }
        ]);
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get monthly sales report
exports.getMonthlySalesReport = async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        
        const report = await Invoice.aggregate([
            { $match: { 
                status: { $ne: 'Cancelled' },
                invoiceDate: {
                    $gte: new Date(currentYear, 0, 1),
                    $lte: new Date(currentYear, 11, 31)
                }
            }},
            { $group: {
                _id: {
                    year: { $year: '$invoiceDate' },
                    month: { $month: '$invoiceDate' }
                },
                totalOrders: { $sum: 1 },
                totalSales: { $sum: '$grandTotal' },
                taxableSales: { $sum: '$taxableAmount' },
                gst: { $sum: { $add: ['$cgst', '$sgst', '$igst'] } },
                discounts: { $sum: '$totalDiscount' }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get customer-wise sales report
exports.getCustomerSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const matchCondition = { status: { $ne: 'Cancelled' } };
        if (startDate && endDate) {
            matchCondition.invoiceDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const report = await Invoice.aggregate([
            { $match: matchCondition },
            { $group: {
                _id: '$customer',
                orders: { $sum: 1 },
                sales: { $sum: '$grandTotal' },
                paid: { $sum: '$paidAmount' },
                pending: { $sum: '$pendingAmount' }
            }},
            { $lookup: {
                from: 'customers',
                localField: '_id',
                foreignField: '_id',
                as: 'customer'
            }},
            { $unwind: '$customer' },
            { $project: {
                customerName: '$customer.name',
                companyName: '$customer.companyName',
                gstNumber: '$customer.gstNumber',
                orders: 1,
                sales: 1,
                paid: 1,
                pending: 1
            }},
            { $sort: { sales: -1 } }
        ]);
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get product-wise sales report
exports.getProductSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const matchCondition = { status: { $ne: 'Cancelled' } };
        if (startDate && endDate) {
            matchCondition.invoiceDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const report = await Invoice.aggregate([
            { $match: matchCondition },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.sparePart',
                partNumber: { $first: '$items.partNumber' },
                partName: { $first: '$items.description' },
                quantitySold: { $sum: '$items.quantity' },
                salesAmount: { $sum: '$items.total' }
            }},
            { $lookup: {
                from: 'spareparts',
                localField: '_id',
                foreignField: '_id',
                as: 'part'
            }},
            { $unwind: '$part' },
            { $project: {
                partNumber: 1,
                partName: '$part.partName',
                quantitySold: 1,
                salesAmount: 1
            }},
            { $sort: { salesAmount: -1 } }
        ]);
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get GST sales report
exports.getGSTSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const matchCondition = { status: { $ne: 'Cancelled' } };
        if (startDate && endDate) {
            matchCondition.invoiceDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const report = await Invoice.aggregate([
            { $match: matchCondition },
            { $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customer'
            }},
            { $unwind: '$customer' },
            { $project: {
                invoiceNumber: 1,
                invoiceDate: 1,
                customerName: '$customer.name',
                companyName: '$customer.companyName',
                gstin: '$customer.gstNumber',
                taxableAmount: 1,
                cgst: 1,
                sgst: 1,
                igst: 1,
                totalGST: { $add: ['$cgst', '$sgst', '$igst'] },
                grandTotal: 1
            }},
            { $sort: { invoiceDate: -1 } }
        ]);
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
