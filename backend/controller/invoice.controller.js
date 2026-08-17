const Invoice = require('../model/Invoice.model');
const SalesOrder = require('../model/SalesOrder.model');
const Customer = require('../model/Customer.model');
const SpareParts = require('../model/SpareParts.model');
const Payment = require('../model/Payment.model');

// Generate unique invoice number
const generateInvoiceNumber = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastInvoice = await Invoice.findOne({
        invoiceNumber: new RegExp(`^INV-${year}${month}`)
    }).sort({ invoiceNumber: -1 });
    
    let sequence = 1;
    if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }
    
    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
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

// Calculate due date based on payment terms
const calculateDueDate = (invoiceDate, paymentTerms) => {
    const date = new Date(invoiceDate);
    const daysMap = {
        'Cash': 0,
        'Immediate': 0,
        '7 Days': 7,
        '15 Days': 15,
        '30 Days': 30,
        '45 Days': 45,
        '60 Days': 60
    };
    const days = daysMap[paymentTerms] || 30;
    date.setDate(date.getDate() + days);
    return date;
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
    try {
        const { status, paymentStatus, customer, search } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (customer) filter.customer = customer;
        if (search) {
            filter.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const invoices = await Invoice.find(filter)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('salesOrder', 'orderNumber')
            .populate('items.sparePart', 'partName partNumber')
            .sort({ createdAt: -1 });
        
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single invoice
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer', 'name companyName gstNumber address city state pincode phone email')
            .populate('salesOrder', 'orderNumber orderDate')
            .populate('items.sparePart', 'partName partNumber')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        // Get payment history
        const payments = await Payment.find({ invoice: invoice._id })
            .sort({ paymentDate: -1 });
        
        res.json({ ...invoice._doc, payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create invoice
exports.createInvoice = async (req, res) => {
    try {
        console.log('Creating invoice with body:', JSON.stringify(req.body, null, 2));
        
        // Validate required fields
        if (!req.body.customer) {
            return res.status(400).json({ error: 'Customer is required' });
        }
        if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }
        if (!req.body.invoiceDate) {
            return res.status(400).json({ error: 'Invoice date is required' });
        }

        const invoiceNumber = await generateInvoiceNumber();
        
        // Validate customer
        const customer = await Customer.findById(req.body.customer);
        if (!customer) {
            return res.status(400).json({ error: 'Customer not found' });
        }
        
        // If created from sales order, load sales order details
        let salesOrderData = null;
        if (req.body.salesOrder) {
            salesOrderData = await SalesOrder.findById(req.body.salesOrder);
            if (!salesOrderData) {
                return res.status(400).json({ error: 'Sales order not found' });
            }
            
            if (salesOrderData.invoiceGenerated) {
                return res.status(400).json({ error: 'Invoice already generated for this sales order' });
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
        
        const itemsToProcess = req.body.items || (salesOrderData ? salesOrderData.items : []);
        
        for (const item of itemsToProcess) {
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
                unit: item.unit || 'Nos',
                rate: item.rate,
                discount: discount,
                taxableAmount: itemTaxableAmount,
                gstRate: item.gstRate,
                cgstAmount: gstCalculation.cgstAmount,
                sgstAmount: gstCalculation.sgstAmount,
                igstAmount: gstCalculation.igstAmount,
                total: itemTotal
            });
            
            subtotal += grossAmount;
            totalDiscount += discount;
            taxableAmount += itemTaxableAmount;
            totalCGST += gstCalculation.cgstAmount;
            totalSGST += gstCalculation.sgstAmount;
            totalIGST += gstCalculation.igstAmount;
        }
        
        const grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;
        
        // Calculate round-off
        const roundOff = Math.round(grandTotal) - grandTotal;
        const finalTotal = Math.round(grandTotal);
        
        // Calculate due date
        const paymentTerms = req.body.paymentTerms || customer.paymentTerms;
        const invoiceDate = req.body.invoiceDate || new Date();
        const dueDate = calculateDueDate(invoiceDate, paymentTerms);
        
        const invoice = new Invoice({
            invoiceNumber,
            customer: req.body.customer,
            salesOrder: req.body.salesOrder,
            invoiceDate,
            dueDate,
            salesPerson: req.body.salesPerson || salesOrderData?.salesPerson,
            billingAddress: req.body.billingAddress || customer.billingAddress || customer.address || '',
            shippingAddress: req.body.shippingAddress || customer.shippingAddress || customer.address || '',
            paymentTerms,
            items,
            subtotal,
            totalDiscount,
            taxableAmount,
            cgst: totalCGST,
            sgst: totalSGST,
            igst: totalIGST,
            roundOff,
            grandTotal: finalTotal,
            paidAmount: 0,
            pendingAmount: finalTotal,
            paymentStatus: 'Unpaid',
            status: req.body.status || 'Draft',
            notes: req.body.notes,
            createdBy: req.user?._id
        });
        
        await invoice.save();
        
        // Update sales order if invoice is generated from it
        if (req.body.salesOrder) {
            await SalesOrder.findByIdAndUpdate(req.body.salesOrder, {
                invoiceGenerated: true,
                invoice: invoice._id
            });
        }
        
        const savedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('salesOrder', 'orderNumber')
            .populate('items.sparePart', 'partName partNumber');
        
        res.status(201).json(savedInvoice);
    } catch (error) {
        console.error('Error creating invoice:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        // Prevent modification if already paid
        if (invoice.paymentStatus === 'Paid') {
            return res.status(400).json({ error: 'Cannot update paid invoice' });
        }
        
        const customer = await Customer.findById(req.body.customer || invoice.customer);
        
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
                    total: itemTotal
                });
                
                subtotal += grossAmount;
                totalDiscount += discount;
                taxableAmount += itemTaxableAmount;
                totalCGST += gstCalculation.cgstAmount;
                totalSGST += gstCalculation.sgstAmount;
                totalIGST += gstCalculation.igstAmount;
            }
            
            const grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;
            const roundOff = Math.round(grandTotal) - grandTotal;
            const finalTotal = Math.round(grandTotal);
            
            invoice.items = items;
            invoice.subtotal = subtotal;
            invoice.totalDiscount = totalDiscount;
            invoice.taxableAmount = taxableAmount;
            invoice.cgst = totalCGST;
            invoice.sgst = totalSGST;
            invoice.igst = totalIGST;
            invoice.roundOff = roundOff;
            invoice.grandTotal = finalTotal;
            invoice.pendingAmount = finalTotal - Number(invoice.paidAmount || 0);
        }
        
        if (req.body.customer) invoice.customer = req.body.customer;
        if (req.body.invoiceDate) {
            invoice.invoiceDate = req.body.invoiceDate;
            const paymentTerms = req.body.paymentTerms || invoice.paymentTerms;
            invoice.dueDate = calculateDueDate(req.body.invoiceDate, paymentTerms);
        }
        if (req.body.salesPerson) invoice.salesPerson = req.body.salesPerson;
        if (req.body.billingAddress) invoice.billingAddress = req.body.billingAddress;
        if (req.body.shippingAddress) invoice.shippingAddress = req.body.shippingAddress;
        if (req.body.paymentTerms) {
            invoice.paymentTerms = req.body.paymentTerms;
            invoice.dueDate = calculateDueDate(invoice.invoiceDate, req.body.paymentTerms);
        }
        if (req.body.notes) invoice.notes = req.body.notes;
        if (req.body.status) invoice.status = req.body.status;
        invoice.updatedBy = req.user?._id;
        
        await invoice.save();
        
        const updatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('salesOrder', 'orderNumber')
            .populate('items.sparePart', 'partName partNumber');
        
        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        if (invoice.paymentStatus === 'Paid') {
            return res.status(400).json({ error: 'Cannot delete paid invoice' });
        }
        
        if (invoice.status === 'Issued') {
            return res.status(400).json({ error: 'Cannot delete issued invoice. Cancel it instead.' });
        }
        
        // Update sales order if invoice was generated from it
        if (invoice.salesOrder) {
            await SalesOrder.findByIdAndUpdate(invoice.salesOrder, {
                invoiceGenerated: false,
                invoice: null
            });
        }
        
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Issue invoice
exports.issueInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        if (invoice.status === 'Issued') {
            return res.status(400).json({ error: 'Invoice already issued' });
        }
        
        invoice.status = 'Issued';
        invoice.updatedBy = req.user?._id;
        await invoice.save();
        
        res.json({ message: 'Invoice issued successfully', invoice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cancel invoice
exports.cancelInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        if (invoice.paymentStatus === 'Paid') {
            return res.status(400).json({ error: 'Cannot cancel paid invoice' });
        }
        
        invoice.status = 'Cancelled';
        invoice.updatedBy = req.user?._id;
        await invoice.save();
        
        res.json({ message: 'Invoice cancelled successfully', invoice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add payment to invoice
exports.addPayment = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        if (invoice.status === 'Cancelled') {
            return res.status(400).json({ error: 'Cannot add payment to cancelled invoice' });
        }
        
        const { amount, paymentMode, transactionReference, bank, notes } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount' });
        }
        
        if (amount > invoice.pendingAmount) {
            return res.status(400).json({ 
                error: `Payment amount exceeds pending amount. Pending: ₹${invoice.pendingAmount}` 
            });
        }
        
        // Generate payment ID
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const lastPayment = await Payment.findOne({
            paymentId: new RegExp(`^PAY-${year}${month}`)
        }).sort({ paymentId: -1 });
        
        let sequence = 1;
        if (lastPayment) {
            const lastSequence = parseInt(lastPayment.paymentId.split('-')[2]);
            sequence = lastSequence + 1;
        }
        
        const paymentId = `PAY-${year}${month}-${String(sequence).padStart(4, '0')}`;
        
        const payment = new Payment({
            paymentId,
            customer: invoice.customer,
            invoice: invoice._id,
            paymentDate: req.body.paymentDate || new Date(),
            amount,
            paymentMode,
            transactionReference,
            bank,
            notes,
            receivedBy: req.user?._id,
            status: 'Completed'
        });
        
        await payment.save();
        
        // Update invoice payment status
        invoice.paidAmount = Number(invoice.paidAmount || 0) + Number(amount);
        invoice.updatedBy = req.user?._id;
        await invoice.save();
        
        // Update customer balance
        await Customer.findByIdAndUpdate(invoice.customer, {
            $inc: { currentBalance: -amount }
        });
        
        const updatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name companyName')
            .populate('salesOrder', 'orderNumber');
        
        res.json({ message: 'Payment added successfully', payment, invoice: updatedInvoice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
