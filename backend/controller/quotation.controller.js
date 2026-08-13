const Quotation = require('../model/Quotation.model');
const Customer = require('../model/Customer.model');
const SpareParts = require('../model/SpareParts.model');

// Generate unique quotation number
const generateQuotationNumber = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastQuotation = await Quotation.findOne({
        quotationNumber: new RegExp(`^QT-${year}${month}`)
    }).sort({ quotationNumber: -1 });
    
    let sequence = 1;
    if (lastQuotation) {
        const lastSequence = parseInt(lastQuotation.quotationNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }
    
    return `QT-${year}${month}-${String(sequence).padStart(4, '0')}`;
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

// Get all quotations
exports.getAllQuotations = async (req, res) => {
    try {
        const { status, customer, search } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (customer) filter.customer = customer;
        if (search) {
            filter.$or = [
                { quotationNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const quotations = await Quotation.find(filter)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('items.sparePart', 'partName partNumber')
            .sort({ createdAt: -1 });
        
        res.json(quotations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single quotation
exports.getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('customer', 'name companyName gstNumber address city state pincode phone email')
            .populate('items.sparePart', 'partName partNumber')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        res.json(quotation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create quotation
exports.createQuotation = async (req, res) => {
    try {
        const quotationNumber = await generateQuotationNumber();
        
        // Validate customer
        const customer = await Customer.findById(req.body.customer);
        if (!customer) {
            return res.status(400).json({ error: 'Customer not found' });
        }
        
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
            
            // Determine if inter-state (for now, assume intra-state)
            const isInterState = customer.state !== 'Gujarat'; // Assuming company is in Gujarat
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
        
        const quotation = new Quotation({
            quotationNumber,
            customer: req.body.customer,
            quotationDate: req.body.quotationDate || new Date(),
            validUntil: req.body.validUntil,
            salesPerson: req.body.salesPerson,
            billingAddress: req.body.billingAddress || customer.address,
            shippingAddress: req.body.shippingAddress || customer.address,
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
            terms: req.body.terms,
            status: req.body.status || 'Draft',
            createdBy: req.user?.id
        });
        
        await quotation.save();
        
        const savedQuotation = await Quotation.findById(quotation._id)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('items.sparePart', 'partName partNumber');
        
        res.status(201).json(savedQuotation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update quotation
exports.updateQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        // Prevent modification if already converted to sales order
        if (quotation.status === 'Converted') {
            return res.status(400).json({ error: 'Cannot update converted quotation' });
        }
        
        const customer = await Customer.findById(req.body.customer || quotation.customer);
        
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
            
            quotation.items = items;
            quotation.subtotal = subtotal;
            quotation.totalDiscount = totalDiscount;
            quotation.taxableAmount = taxableAmount;
            quotation.cgst = totalCGST;
            quotation.sgst = totalSGST;
            quotation.igst = totalIGST;
            quotation.grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;
        }
        
        if (req.body.customer) quotation.customer = req.body.customer;
        if (req.body.quotationDate) quotation.quotationDate = req.body.quotationDate;
        if (req.body.validUntil) quotation.validUntil = req.body.validUntil;
        if (req.body.salesPerson) quotation.salesPerson = req.body.salesPerson;
        if (req.body.billingAddress) quotation.billingAddress = req.body.billingAddress;
        if (req.body.shippingAddress) quotation.shippingAddress = req.body.shippingAddress;
        if (req.body.paymentTerms) quotation.paymentTerms = req.body.paymentTerms;
        if (req.body.deliveryTerms) quotation.deliveryTerms = req.body.deliveryTerms;
        if (req.body.notes) quotation.notes = req.body.notes;
        if (req.body.terms) quotation.terms = req.body.terms;
        if (req.body.status) quotation.status = req.body.status;
        quotation.updatedBy = req.user?.id;
        
        await quotation.save();
        
        const updatedQuotation = await Quotation.findById(quotation._id)
            .populate('customer', 'name companyName gstNumber city state')
            .populate('items.sparePart', 'partName partNumber');
        
        res.json(updatedQuotation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete quotation
exports.deleteQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        if (quotation.status === 'Converted') {
            return res.status(400).json({ error: 'Cannot delete converted quotation' });
        }
        
        await Quotation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send quotation
exports.sendQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        quotation.status = 'Sent';
        quotation.updatedBy = req.user?.id;
        await quotation.save();
        
        res.json({ message: 'Quotation sent successfully', quotation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept quotation
exports.acceptQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        quotation.status = 'Accepted';
        quotation.updatedBy = req.user?.id;
        await quotation.save();
        
        res.json({ message: 'Quotation accepted successfully', quotation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject quotation
exports.rejectQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        quotation.status = 'Rejected';
        quotation.updatedBy = req.user?.id;
        await quotation.save();
        
        res.json({ message: 'Quotation rejected successfully', quotation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Convert quotation to sales order
exports.convertToSalesOrder = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        
        if (quotation.status !== 'Accepted') {
            return res.status(400).json({ error: 'Only accepted quotations can be converted' });
        }
        
        if (quotation.status === 'Converted') {
            return res.status(400).json({ error: 'Quotation already converted' });
        }
        
        quotation.status = 'Converted';
        quotation.updatedBy = req.user?.id;
        await quotation.save();
        
        res.json({ 
            message: 'Quotation marked as converted. Create sales order using this quotation.',
            quotation 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
