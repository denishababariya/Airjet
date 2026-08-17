const SalesReturn = require('../model/SalesReturn.model');
const Invoice = require('../model/Invoice.model');
const Customer = require('../model/Customer.model');
const SpareParts = require('../model/SpareParts.model');

// Generate unique return number
const generateReturnNumber = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastReturn = await SalesReturn.findOne({
        returnNumber: new RegExp(`^SR-${year}${month}`)
    }).sort({ returnNumber: -1 });
    
    let sequence = 1;
    if (lastReturn) {
        const lastSequence = parseInt(lastReturn.returnNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }
    
    return `SR-${year}${month}-${String(sequence).padStart(4, '0')}`;
};

// Calculate GST based on state
const calculateGST = (taxableAmount, gstRate, isInterState) => {
    const totalGST = (taxableAmount * gstRate) / 100;
    
    if (isInterState) {
        return {
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: totalGST
        };
    } else {
        const halfGST = totalGST / 2;
        return {
            cgstAmount: halfGST,
            sgstAmount: halfGST,
            igstAmount: 0
        };
    }
};

// Get all sales returns
exports.getAllSalesReturns = async (req, res) => {
    try {
        const { customer, invoice, status, search } = req.query;
        const filter = {};
        
        if (customer) filter.customer = customer;
        if (invoice) filter.invoice = invoice;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { returnNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const salesReturns = await SalesReturn.find(filter)
            .populate('customer', 'name companyName')
            .populate('invoice', 'invoiceNumber')
            .populate('items.sparePart', 'partName partNumber')
            .sort({ createdAt: -1 });
        
        res.json(salesReturns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single sales return
exports.getSalesReturnById = async (req, res) => {
    try {
        const salesReturn = await SalesReturn.findById(req.params.id)
            .populate('customer', 'name companyName gstNumber address city state pincode phone email')
            .populate('invoice', 'invoiceNumber invoiceDate grandTotal')
            .populate('items.sparePart', 'partName partNumber')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name')
            .populate('approvedBy', 'name');
        
        if (!salesReturn) {
            return res.status(404).json({ error: 'Sales return not found' });
        }
        
        res.json(salesReturn);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create sales return
exports.createSalesReturn = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.invoice) {
            return res.status(400).json({ error: 'Invoice is required' });
        }
        if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }
        if (!req.body.returnDate) {
            return res.status(400).json({ error: 'Return date is required' });
        }

        const returnNumber = await generateReturnNumber();
        
        // Validate invoice
        const invoice = await Invoice.findById(req.body.invoice);
        if (!invoice) {
            return res.status(400).json({ error: 'Invoice not found' });
        }
        
        if (invoice.status === 'Cancelled') {
            return res.status(400).json({ error: 'Cannot create return for cancelled invoice' });
        }
        
        const customer = await Customer.findById(req.body.customer || invoice.customer);
        
        // Process items and calculate totals
        const items = [];
        let subtotal = 0;
        let totalDiscount = 0;
        let taxableAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        
        for (const item of req.body.items) {
            const sparePart = await SpareParts.findById(item.sparePart);
            if (!sparePart) {
                return res.status(400).json({ error: `Spare part not found: ${item.sparePart}` });
            }
            
            const grossAmount = item.quantity * item.rate;
            const discount = item.discount || 0;
            const itemTaxableAmount = grossAmount - discount;
            
            // Determine if inter-state
            const isInterState = customer.state !== 'Gujarat';
            const gstCalculation = calculateGST(itemTaxableAmount, item.gstRate, isInterState);
            
            const itemTotal = itemTaxableAmount + gstCalculation.cgstAmount + gstCalculation.sgstAmount + gstCalculation.igstAmount;
            
            items.push({
                sparePart: item.sparePart,
                partNumber: sparePart.partNumber,
                description: item.description || sparePart.partName,
                quantity: item.quantity,
                rate: item.rate,
                discount: discount,
                taxableAmount: itemTaxableAmount,
                gstRate: item.gstRate,
                cgstAmount: gstCalculation.cgstAmount,
                sgstAmount: gstCalculation.sgstAmount,
                igstAmount: gstCalculation.igstAmount,
                total: itemTotal,
                returnReason: item.returnReason,
                condition: item.condition || 'Good'
            });
            
            subtotal += grossAmount;
            totalDiscount += discount;
            taxableAmount += itemTaxableAmount;
            totalCGST += gstCalculation.cgstAmount;
            totalSGST += gstCalculation.sgstAmount;
            totalIGST += gstCalculation.igstAmount;
        }
        
        const total = taxableAmount + totalCGST + totalSGST + totalIGST;
        
        const salesReturn = new SalesReturn({
            returnNumber,
            customer: req.body.customer || invoice.customer,
            invoice: req.body.invoice,
            returnDate: req.body.returnDate || new Date(),
            items,
            subtotal,
            totalDiscount,
            taxableAmount,
            cgst: totalCGST,
            sgst: totalSGST,
            igst: totalIGST,
            total,
            refundAmount: req.body.refundAmount || total,
            notes: req.body.notes,
            status: req.body.status || 'Pending',
            createdBy: req.user?._id
        });
        
        await salesReturn.save();
        
        const savedSalesReturn = await SalesReturn.findById(salesReturn._id)
            .populate('customer', 'name companyName')
            .populate('invoice', 'invoiceNumber')
            .populate('items.sparePart', 'partName partNumber');
        
        res.status(201).json(savedSalesReturn);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update sales return
exports.updateSalesReturn = async (req, res) => {
    try {
        const salesReturn = await SalesReturn.findById(req.params.id);
        
        if (!salesReturn) {
            return res.status(404).json({ error: 'Sales return not found' });
        }
        
        if (salesReturn.status === 'Processed') {
            return res.status(400).json({ error: 'Cannot update processed return' });
        }
        
        const customer = await Customer.findById(req.body.customer || salesReturn.customer);
        
        // Recalculate if items are provided
        if (req.body.items && req.body.items.length > 0) {
            const items = [];
            let subtotal = 0;
            let totalDiscount = 0;
            let taxableAmount = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;
            
            for (const item of req.body.items) {
                const sparePart = await SpareParts.findById(item.sparePart);
                if (!sparePart) {
                    return res.status(400).json({ error: `Spare part not found: ${item.sparePart}` });
                }
                
                const grossAmount = item.quantity * item.rate;
                const discount = item.discount || 0;
                const itemTaxableAmount = grossAmount - discount;
                
                const isInterState = customer.state !== 'Gujarat';
                const gstCalculation = calculateGST(itemTaxableAmount, item.gstRate, isInterState);
                
                const itemTotal = itemTaxableAmount + gstCalculation.cgstAmount + gstCalculation.sgstAmount + gstCalculation.igstAmount;
                
                items.push({
                    sparePart: item.sparePart,
                    partNumber: sparePart.partNumber,
                    description: item.description || sparePart.partName,
                    quantity: item.quantity,
                    rate: item.rate,
                    discount: discount,
                    taxableAmount: itemTaxableAmount,
                    gstRate: item.gstRate,
                    cgstAmount: gstCalculation.cgstAmount,
                    sgstAmount: gstCalculation.sgstAmount,
                    igstAmount: gstCalculation.igstAmount,
                    total: itemTotal,
                    returnReason: item.returnReason,
                    condition: item.condition || 'Good'
                });
                
                subtotal += grossAmount;
                totalDiscount += discount;
                taxableAmount += itemTaxableAmount;
                totalCGST += gstCalculation.cgstAmount;
                totalSGST += gstCalculation.sgstAmount;
                totalIGST += gstCalculation.igstAmount;
            }
            
            const total = taxableAmount + totalCGST + totalSGST + totalIGST;
            
            salesReturn.items = items;
            salesReturn.subtotal = subtotal;
            salesReturn.totalDiscount = totalDiscount;
            salesReturn.taxableAmount = taxableAmount;
            salesReturn.cgst = totalCGST;
            salesReturn.sgst = totalSGST;
            salesReturn.igst = totalIGST;
            salesReturn.total = total;
            salesReturn.refundAmount = req.body.refundAmount || total;
        }
        
        if (req.body.customer) salesReturn.customer = req.body.customer;
        if (req.body.returnDate) salesReturn.returnDate = req.body.returnDate;
        if (req.body.notes) salesReturn.notes = req.body.notes;
        if (req.body.status) salesReturn.status = req.body.status;
        salesReturn.updatedBy = req.user?._id;
        
        await salesReturn.save();
        
        const updatedSalesReturn = await SalesReturn.findById(salesReturn._id)
            .populate('customer', 'name companyName')
            .populate('invoice', 'invoiceNumber')
            .populate('items.sparePart', 'partName partNumber');
        
        res.json(updatedSalesReturn);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete sales return
exports.deleteSalesReturn = async (req, res) => {
    try {
        const salesReturn = await SalesReturn.findById(req.params.id);
        
        if (!salesReturn) {
            return res.status(404).json({ error: 'Sales return not found' });
        }
        
        if (salesReturn.status === 'Processed') {
            return res.status(400).json({ error: 'Cannot delete processed return' });
        }
        
        await SalesReturn.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sales return deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Approve sales return
exports.approveSalesReturn = async (req, res) => {
    try {
        const salesReturn = await SalesReturn.findById(req.params.id);
        
        if (!salesReturn) {
            return res.status(404).json({ error: 'Sales return not found' });
        }
        
        if (salesReturn.status !== 'Pending') {
            return res.status(400).json({ error: 'Only pending returns can be approved' });
        }
        
        salesReturn.status = 'Approved';
        salesReturn.approvedBy = req.user?._id;
        salesReturn.approvedDate = new Date();
        salesReturn.updatedBy = req.user?._id;
        await salesReturn.save();
        
        res.json({ message: 'Sales return approved successfully', salesReturn });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Process sales return
exports.processSalesReturn = async (req, res) => {
    try {
        const salesReturn = await SalesReturn.findById(req.params.id);
        
        if (!salesReturn) {
            return res.status(404).json({ error: 'Sales return not found' });
        }
        
        if (salesReturn.status !== 'Approved') {
            return res.status(400).json({ error: 'Only approved returns can be processed' });
        }
        
        // Update inventory based on return condition
        for (const item of salesReturn.items) {
            if (item.condition === 'Good') {
                // Add back to sellable stock
                await SpareParts.findByIdAndUpdate(item.sparePart, {
                    $inc: { quantity: item.quantity }
                });
            } else if (item.condition === 'Damaged' || item.condition === 'Defective') {
                // Could implement separate damaged stock tracking
                // For now, just log it
                console.log(`Item ${item.partNumber} returned as ${item.condition}`);
            }
        }
        
        // Update customer receivable (reduce outstanding)
        await Customer.findByIdAndUpdate(salesReturn.customer, {
            $inc: { currentBalance: -salesReturn.refundAmount }
        });
        
        // Update invoice if needed
        const invoice = await Invoice.findById(salesReturn.invoice);
        if (invoice) {
            // Could reduce invoice total or create credit note
            // For simplicity, we're just updating customer balance
        }
        
        salesReturn.status = 'Processed';
        salesReturn.updatedBy = req.user?._id;
        await salesReturn.save();
        
        res.json({ message: 'Sales return processed successfully', salesReturn });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject sales return
exports.rejectSalesReturn = async (req, res) => {
    try {
        const salesReturn = await SalesReturn.findById(req.params.id);
        
        if (!salesReturn) {
            return res.status(404).json({ error: 'Sales return not found' });
        }
        
        if (salesReturn.status !== 'Pending') {
            return res.status(400).json({ error: 'Only pending returns can be rejected' });
        }
        
        salesReturn.status = 'Rejected';
        salesReturn.updatedBy = req.user?._id;
        await salesReturn.save();
        
        res.json({ message: 'Sales return rejected successfully', salesReturn });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
