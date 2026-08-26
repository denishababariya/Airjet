const Warranty = require('../model/Warranty.model');
const SalesOrder = require('../model/SalesOrder.model');
const Invoice = require('../model/Invoice.model');
const SpareParts = require('../model/SpareParts.model');

// Generate warranty number
const generateWarrantyNumber = async () => {
    const count = await Warranty.countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(count + 1).padStart(4, '0');
    return `WRY-${year}${month}-${sequence}`;
};

// Calculate warranty expiry date
const calculateWarrantyExpiry = (startDate, period, unit) => {
    if (!startDate || !period) return null;
    const date = new Date(startDate);
    
    switch (unit) {
        case 'Days':
            date.setDate(date.getDate() + parseInt(period));
            break;
        case 'Months':
            date.setMonth(date.getMonth() + parseInt(period));
            break;
        case 'Years':
            date.setFullYear(date.getFullYear() + parseInt(period));
            break;
        default:
            date.setMonth(date.getMonth() + parseInt(period));
    }
    
    return date;
};

// Check warranty status
const checkWarrantyStatus = (warrantyEndDate) => {
    if (!warrantyEndDate) return { status: 'N/A', isValid: false, isExpired: false };
    const today = new Date();
    const expiry = new Date(warrantyEndDate);
    const isValid = today <= expiry;
    const isExpired = today > expiry;
    return { status: isValid ? 'Active' : 'Expired', isValid, isExpired };
};

// Create warranty records for sales order
const createWarrantyForSalesOrder = async (salesOrderId, invoiceId) => {
    try {
        const salesOrder = await SalesOrder.findById(salesOrderId)
            .populate('customer')
            .populate('items.sparePart');
        
        if (!salesOrder) {
            throw new Error('Sales order not found');
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const warrantyRecords = [];
        const invoiceDate = invoice.invoiceDate || new Date();

        for (const item of salesOrder.items) {
            const sparePart = await SpareParts.findById(item.sparePart);
            
            // Use warranty info from spare part if not specified in item
            const warrantyPeriod = item.warrantyPeriod || sparePart?.warrantyPeriod || 12;
            const warrantyUnit = item.warrantyUnit || sparePart?.warrantyUnit || 'Months';
            
            // If warranty period is 0, skip creating warranty record
            if (warrantyPeriod === 0) continue;

            const warrantyStartDate = item.warrantyStartDate || invoiceDate;
            const warrantyEndDate = item.warrantyEndDate || calculateWarrantyExpiry(warrantyStartDate, warrantyPeriod, warrantyUnit);
            
            const warrantyNumber = await generateWarrantyNumber();
            
            const warrantyRecord = new Warranty({
                warrantyNumber,
                salesOrder: salesOrderId,
                invoice: invoiceId,
                customer: salesOrder.customer._id,
                sparePart: item.sparePart,
                partNumber: item.partNumber,
                partName: sparePart?.partName || item.description || item.partNumber,
                quantity: item.quantity,
                warrantyPeriod,
                warrantyUnit,
                warrantyStartDate,
                warrantyEndDate,
                warrantyStatus: checkWarrantyStatus(warrantyEndDate).status,
                createdBy: salesOrder.createdBy
            });

            await warrantyRecord.save();
            warrantyRecords.push(warrantyRecord);
        }

        return warrantyRecords;
    } catch (error) {
        console.error('Error creating warranty records:', error);
        throw error;
    }
};

// Get all warranties
const getAllWarranties = async (req, res) => {
    try {
        const { status, customer, sparePart } = req.query;
        const filter = {};
        
        if (status) filter.warrantyStatus = status;
        if (customer) filter.customer = customer;
        if (sparePart) filter.sparePart = sparePart;
        
        const warranties = await Warranty.find(filter)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('sparePart')
            .sort({ createdAt: -1 });
        
        res.json(warranties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single warranty
const getWarrantyById = async (req, res) => {
    try {
        const warranty = await Warranty.findById(req.params.id)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('sparePart');
        
        if (!warranty) {
            return res.status(404).json({ error: 'Warranty not found' });
        }
        
        // Check current warranty status
        const statusCheck = checkWarrantyStatus(warranty.warrantyEndDate);
        warranty.warrantyStatus = statusCheck.status;
        await warranty.save();
        
        res.json(warranty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check warranty for service request
const checkWarrantyForService = async (req, res) => {
    try {
        const { salesOrderNumber, sparePartId, machineSerialNumber } = req.query;
        
        let warranties = [];
        
        if (salesOrderNumber) {
            const salesOrder = await SalesOrder.findOne({ orderNumber: salesOrderNumber });
            if (!salesOrder) {
                return res.json({
                    hasWarranty: false,
                    warranties: [],
                    message: 'Sales order not found'
                });
            }
            warranties = await Warranty.find({
                salesOrder: salesOrder._id,
                warrantyStatus: 'Active'
            }).populate('sparePart');
        } else if (sparePartId) {
            warranties = await Warranty.find({
                sparePart: sparePartId,
                warrantyStatus: 'Active'
            }).populate('sparePart');
        }
        
        const validWarranties = warranties.filter(w => {
            const statusCheck = checkWarrantyStatus(w.warrantyEndDate);
            return statusCheck.isValid;
        });
        
        res.json({
            hasWarranty: validWarranties.length > 0,
            warranties: validWarranties,
            message: validWarranties.length > 0 ? 'Valid warranty found' : 'No valid warranty'
        });
    } catch (error) {
        console.error('Error checking warranty:', error);
        res.status(500).json({ error: error.message });
    }
};

// Create warranty manually
const createWarranty = async (req, res) => {
    try {
        const {
            salesOrder,
            invoice,
            customer,
            sparePart,
            quantity,
            warrantyPeriod,
            warrantyUnit,
            warrantyStartDate,
            machineSerialNumber,
            terms,
            notes
        } = req.body;
        
        const warrantyNumber = await generateWarrantyNumber();
        const warrantyEndDate = calculateWarrantyExpiry(warrantyStartDate, warrantyPeriod, warrantyUnit);
        const warrantyStatus = checkWarrantyStatus(warrantyEndDate).status;
        
        const sparePartData = await SpareParts.findById(sparePart);
        
        const warranty = new Warranty({
            warrantyNumber,
            salesOrder,
            invoice,
            customer,
            sparePart,
            partNumber: sparePartData?.partNumber,
            partName: sparePartData?.partName,
            quantity,
            warrantyPeriod,
            warrantyUnit,
            warrantyStartDate,
            warrantyEndDate,
            warrantyStatus,
            machineSerialNumber,
            terms,
            notes,
            createdBy: req.user?._id
        });
        
        await warranty.save();
        res.status(201).json(warranty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update warranty
const updateWarranty = async (req, res) => {
    try {
        const warranty = await Warranty.findById(req.params.id);
        
        if (!warranty) {
            return res.status(404).json({ error: 'Warranty not found' });
        }
        
        const { warrantyPeriod, warrantyUnit, warrantyStartDate, machineSerialNumber, terms, notes } = req.body;
        
        if (warrantyPeriod || warrantyUnit || warrantyStartDate) {
            const newWarrantyEndDate = calculateWarrantyExpiry(
                warrantyStartDate || warranty.warrantyStartDate,
                warrantyPeriod || warranty.warrantyPeriod,
                warrantyUnit || warranty.warrantyUnit
            );
            warranty.warrantyEndDate = newWarrantyEndDate;
            warranty.warrantyStatus = checkWarrantyStatus(newWarrantyEndDate).status;
        }
        
        if (warrantyPeriod) warranty.warrantyPeriod = warrantyPeriod;
        if (warrantyUnit) warranty.warrantyUnit = warrantyUnit;
        if (warrantyStartDate) warranty.warrantyStartDate = warrantyStartDate;
        if (machineSerialNumber) warranty.machineSerialNumber = machineSerialNumber;
        if (terms !== undefined) warranty.terms = terms;
        if (notes !== undefined) warranty.notes = notes;
        warranty.updatedBy = req.user?._id;
        
        await warranty.save();
        res.json(warranty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete warranty
const deleteWarranty = async (req, res) => {
    try {
        const warranty = await Warranty.findById(req.params.id);
        
        if (!warranty) {
            return res.status(404).json({ error: 'Warranty not found' });
        }
        
        if (warranty.warrantyStatus === 'Claimed') {
            return res.status(400).json({ error: 'Cannot delete claimed warranty' });
        }
        
        await Warranty.findByIdAndDelete(req.params.id);
        res.json({ message: 'Warranty deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createWarrantyForSalesOrder,
    getAllWarranties,
    getWarrantyById,
    checkWarrantyForService,
    createWarranty,
    updateWarranty,
    deleteWarranty,
    calculateWarrantyExpiry,
    checkWarrantyStatus
};
