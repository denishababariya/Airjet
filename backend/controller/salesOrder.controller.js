const SalesOrder = require('../model/SalesOrder.model');
const Quotation = require('../model/Quotation.model');
const Customer = require('../model/Customer.model');
const SpareParts = require('../model/SpareParts.model');

// Generate unique sales order number
const generateOrderNumber = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastOrder = await SalesOrder.findOne({
        orderNumber: new RegExp(`^SO-${year}${month}`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }
    
    return `SO-${year}${month}-${String(sequence).padStart(4, '0')}`;
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

// Check credit limit
const checkCreditLimit = async (customer, orderAmount) => {
    const outstanding = customer.currentBalance || 0;
    const creditLimit = customer.creditLimit || 0;
    const newOutstanding = outstanding + orderAmount;
    
    return {
        canProceed: newOutstanding <= creditLimit || creditLimit === 0,
        currentOutstanding: outstanding,
        creditLimit: creditLimit,
        newOutstanding: newOutstanding,
        exceeded: newOutstanding > creditLimit && creditLimit > 0
    };
};

// Get all sales orders
exports.getAllSalesOrders = async (req, res) => {
    try {
        const { status, customer, search } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (customer) filter.customer = customer;
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const salesOrders = await SalesOrder.find(filter)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('quotation', 'quotationNumber')
            .populate('items.sparePart', 'partName partNumber')
            .sort({ createdAt: -1 });
        
        res.json(salesOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single sales order
exports.getSalesOrderById = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findById(req.params.id)
            .populate('customer', 'name companyName gstNumber address city state pincode phone email creditLimit currentBalance')
            .populate('quotation', 'quotationNumber quotationDate')
            .populate('items.sparePart', 'partName partNumber quantity')
            .populate('items.warehouse', 'name')
            .populate('createdBy', 'name')
            .populate('confirmedBy', 'name')
            .populate('updatedBy', 'name');
        
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        res.json(salesOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create sales order
exports.createSalesOrder = async (req, res) => {
    try {
        const orderNumber = await generateOrderNumber();
        
        // Validate customer
        const customer = await Customer.findById(req.body.customer);
        if (!customer) {
            return res.status(400).json({ error: 'Customer not found' });
        }
        
        // If created from quotation, load quotation details
        let quotationData = null;
        if (req.body.quotation) {
            quotationData = await Quotation.findById(req.body.quotation);
            if (!quotationData) {
                return res.status(400).json({ error: 'Quotation not found' });
            }
        }
        
        // Process items and calculate totals
        const items = [];
        let subtotal = 0;
        let totalDiscount = 0;
        let taxableAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        
        const itemsToProcess = req.body.items || (quotationData ? quotationData.items : []);
        
        for (const item of itemsToProcess) {
            const sparePart = await SpareParts.findById(item.sparePart);
            if (!sparePart) {
                return res.status(400).json({ error: `Spare part not found: ${item.sparePart}` });
            }
            
            // Check stock availability
            if (sparePart.quantity < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${sparePart.partName}. Available: ${sparePart.quantity}, Required: ${item.quantity}` 
                });
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
                unit: item.unit || 'Nos',
                rate: item.rate,
                discount: discount,
                taxableAmount: itemTaxableAmount,
                gstRate: item.gstRate,
                cgstAmount: gstCalculation.cgstAmount,
                sgstAmount: gstCalculation.sgstAmount,
                igstAmount: gstCalculation.igstAmount,
                total: itemTotal,
                warehouse: item.warehouse || null,
                reservedQuantity: 0,
                dispatchedQuantity: 0
            });
            
            subtotal += grossAmount;
            totalDiscount += discount;
            taxableAmount += itemTaxableAmount;
            totalCGST += gstCalculation.cgstAmount;
            totalSGST += gstCalculation.sgstAmount;
            totalIGST += gstCalculation.igstAmount;
        }
        
        const grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;
        
        // Check credit limit
        const creditCheck = await checkCreditLimit(customer, grandTotal);
        
        const salesOrder = new SalesOrder({
            orderNumber,
            customer: req.body.customer,
            quotation: req.body.quotation,
            orderDate: req.body.orderDate || new Date(),
            expectedDeliveryDate: req.body.expectedDeliveryDate,
            salesPerson: req.body.salesPerson || quotationData?.salesPerson,
            billingAddress: req.body.billingAddress || customer.billingAddress || customer.address,
            shippingAddress: req.body.shippingAddress || customer.shippingAddress || customer.address,
            paymentTerms: req.body.paymentTerms || customer.paymentTerms,
            deliveryTerms: req.body.deliveryTerms,
            items,
            subtotal,
            totalDiscount,
            taxableAmount,
            cgst: totalCGST,
            sgst: totalSGST,
            igst: totalIGST,
            grandTotal,
            notes: req.body.notes,
            status: req.body.status || 'Draft',
            creditLimitChecked: true,
            creditLimitExceeded: creditCheck.exceeded,
            createdBy: req.user?.id
        });
        
        await salesOrder.save();
        
        const savedSalesOrder = await SalesOrder.findById(salesOrder._id)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('quotation', 'quotationNumber')
            .populate('items.sparePart', 'partName partNumber');
        
        res.status(201).json({
            ...savedSalesOrder._doc,
            creditCheck
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update sales order
exports.updateSalesOrder = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findById(req.params.id);
        
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        // Prevent modification if already completed or cancelled
        if (['Completed', 'Cancelled'].includes(salesOrder.status)) {
            return res.status(400).json({ error: 'Cannot update completed or cancelled order' });
        }
        
        const customer = await Customer.findById(req.body.customer || salesOrder.customer);
        
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
                    unit: item.unit || 'Nos',
                    rate: item.rate,
                    discount: discount,
                    taxableAmount: itemTaxableAmount,
                    gstRate: item.gstRate,
                    cgstAmount: gstCalculation.cgstAmount,
                    sgstAmount: gstCalculation.sgstAmount,
                    igstAmount: gstCalculation.igstAmount,
                    total: itemTotal,
                    warehouse: item.warehouse || salesOrder.items.find(i => i.sparePart.toString() === item.sparePart)?.warehouse,
                    reservedQuantity: salesOrder.items.find(i => i.sparePart.toString() === item.sparePart)?.reservedQuantity || 0,
                    dispatchedQuantity: salesOrder.items.find(i => i.sparePart.toString() === item.sparePart)?.dispatchedQuantity || 0
                });
                
                subtotal += grossAmount;
                totalDiscount += discount;
                taxableAmount += itemTaxableAmount;
                totalCGST += gstCalculation.cgstAmount;
                totalSGST += gstCalculation.sgstAmount;
                totalIGST += gstCalculation.igstAmount;
            }
            
            salesOrder.items = items;
            salesOrder.subtotal = subtotal;
            salesOrder.totalDiscount = totalDiscount;
            salesOrder.taxableAmount = taxableAmount;
            salesOrder.cgst = totalCGST;
            salesOrder.sgst = totalSGST;
            salesOrder.igst = totalIGST;
            salesOrder.grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;
        }
        
        if (req.body.customer) salesOrder.customer = req.body.customer;
        if (req.body.orderDate) salesOrder.orderDate = req.body.orderDate;
        if (req.body.expectedDeliveryDate) salesOrder.expectedDeliveryDate = req.body.expectedDeliveryDate;
        if (req.body.salesPerson) salesOrder.salesPerson = req.body.salesPerson;
        if (req.body.billingAddress) salesOrder.billingAddress = req.body.billingAddress;
        if (req.body.shippingAddress) salesOrder.shippingAddress = req.body.shippingAddress;
        if (req.body.paymentTerms) salesOrder.paymentTerms = req.body.paymentTerms;
        if (req.body.deliveryTerms) salesOrder.deliveryTerms = req.body.deliveryTerms;
        if (req.body.notes) salesOrder.notes = req.body.notes;
        if (req.body.status) salesOrder.status = req.body.status;
        salesOrder.updatedBy = req.user?.id;
        
        await salesOrder.save();
        
        const updatedSalesOrder = await SalesOrder.findById(salesOrder._id)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('quotation', 'quotationNumber')
            .populate('items.sparePart', 'partName partNumber');
        
        res.json(updatedSalesOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete sales order
exports.deleteSalesOrder = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findById(req.params.id);
        
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        if (['Confirmed', 'Stock Reserved', 'Processing', 'Ready for Dispatch', 'Dispatched', 'Completed'].includes(salesOrder.status)) {
            return res.status(400).json({ error: 'Cannot delete confirmed order. Cancel it instead.' });
        }
        
        await SalesOrder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sales order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Confirm sales order
exports.confirmSalesOrder = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findById(req.params.id);
        
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        if (salesOrder.status !== 'Draft') {
            return res.status(400).json({ error: 'Only draft orders can be confirmed' });
        }
        
        salesOrder.status = 'Confirmed';
        salesOrder.confirmedBy = req.user?.id;
        salesOrder.updatedBy = req.user?.id;
        await salesOrder.save();
        
        res.json({ message: 'Sales order confirmed successfully', salesOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cancel sales order
exports.cancelSalesOrder = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findById(req.params.id);
        
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        if (salesOrder.status === 'Completed') {
            return res.status(400).json({ error: 'Cannot cancel completed order' });
        }
        
        // Release reserved stock if any
        if (salesOrder.status === 'Stock Reserved' || salesOrder.status === 'Processing') {
            for (const item of salesOrder.items) {
                if (item.reservedQuantity > 0) {
                    await SpareParts.findByIdAndUpdate(item.sparePart, {
                        $inc: { quantity: item.reservedQuantity }
                    });
                }
            }
        }
        
        salesOrder.status = 'Cancelled';
        salesOrder.updatedBy = req.user?.id;
        await salesOrder.save();
        
        res.json({ message: 'Sales order cancelled successfully', salesOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reserve stock
exports.reserveStock = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findById(req.params.id);
        
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        if (salesOrder.status !== 'Confirmed') {
            return res.status(400).json({ error: 'Only confirmed orders can reserve stock' });
        }
        
        // Reserve stock for each item
        for (const item of salesOrder.items) {
            const sparePart = await SpareParts.findById(item.sparePart);
            
            if (sparePart.quantity < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${sparePart.partName}. Available: ${sparePart.quantity}, Required: ${item.quantity}` 
                });
            }
            
            // Reserve quantity
            await SpareParts.findByIdAndUpdate(item.sparePart, {
                $inc: { quantity: -item.quantity }
            });
            
            item.reservedQuantity = item.quantity;
        }
        
        salesOrder.status = 'Stock Reserved';
        salesOrder.updatedBy = req.user?.id;
        await salesOrder.save();
        
        res.json({ message: 'Stock reserved successfully', salesOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
