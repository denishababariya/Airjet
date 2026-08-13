const Payment = require('../model/Payment.model');
const Invoice = require('../model/Invoice.model');
const Customer = require('../model/Customer.model');

// Get all payments
exports.getAllPayments = async (req, res) => {
    try {
        const { customer, invoice, paymentMode, status, search } = req.query;
        const filter = {};
        
        if (customer) filter.customer = customer;
        if (invoice) filter.invoice = invoice;
        if (paymentMode) filter.paymentMode = paymentMode;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { paymentId: { $regex: search, $options: 'i' } },
                { transactionReference: { $regex: search, $options: 'i' } }
            ];
        }
        
        const payments = await Payment.find(filter)
            .populate('customer', 'name companyName')
            .populate('invoice', 'invoiceNumber invoiceNumber')
            .populate('receivedBy', 'name')
            .sort({ paymentDate: -1 });
        
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single payment
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('customer', 'name companyName gstNumber phone email')
            .populate('invoice', 'invoiceNumber invoiceNumber grandTotal paidAmount pendingAmount')
            .populate('receivedBy', 'name');
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create payment
exports.createPayment = async (req, res) => {
    try {
        const { customer, invoice, amount, paymentMode, paymentDate, transactionReference, bank, notes } = req.body;
        
        // Validate invoice
        const invoiceData = await Invoice.findById(invoice);
        if (!invoiceData) {
            return res.status(400).json({ error: 'Invoice not found' });
        }
        
        if (invoiceData.status === 'Cancelled') {
            return res.status(400).json({ error: 'Cannot add payment to cancelled invoice' });
        }
        
        if (amount > invoiceData.pendingAmount) {
            return res.status(400).json({ 
                error: `Payment amount exceeds pending amount. Pending: ₹${invoiceData.pendingAmount}` 
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
            customer,
            invoice,
            paymentDate: paymentDate || new Date(),
            amount,
            paymentMode,
            transactionReference,
            bank,
            notes,
            receivedBy: req.user?.id,
            status: 'Completed'
        });
        
        await payment.save();
        
        // Update invoice payment status
        invoiceData.paidAmount += amount;
        invoiceData.updatedBy = req.user?.id;
        await invoiceData.save();
        
        // Update customer balance
        await Customer.findByIdAndUpdate(customer, {
            $inc: { currentBalance: -amount }
        });
        
        const savedPayment = await Payment.findById(payment._id)
            .populate('customer', 'name companyName')
            .populate('invoice', 'invoiceNumber');
        
        res.status(201).json(savedPayment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update payment
exports.updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        if (payment.status === 'Completed') {
            return res.status(400).json({ error: 'Cannot update completed payment' });
        }
        
        if (req.body.amount) payment.amount = req.body.amount;
        if (req.body.paymentMode) payment.paymentMode = req.body.paymentMode;
        if (req.body.paymentDate) payment.paymentDate = req.body.paymentDate;
        if (req.body.transactionReference) payment.transactionReference = req.body.transactionReference;
        if (req.body.bank) payment.bank = req.body.bank;
        if (req.body.notes) payment.notes = req.body.notes;
        if (req.body.status) payment.status = req.body.status;
        
        await payment.save();
        
        const updatedPayment = await Payment.findById(payment._id)
            .populate('customer', 'name companyName')
            .populate('invoice', 'invoiceNumber');
        
        res.json(updatedPayment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete payment
exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        if (payment.status === 'Completed') {
            return res.status(400).json({ error: 'Cannot delete completed payment' });
        }
        
        await Payment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
