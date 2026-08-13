const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    sparePart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'spareParts',
        required: true
    },
    partNumber: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unit: {
        type: String,
        default: 'Nos'
    },
    rate: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    taxableAmount: {
        type: Number,
        required: true
    },
    gstRate: {
        type: Number,
        required: true,
        default: 18
    },
    cgstAmount: {
        type: Number,
        default: 0
    },
    sgstAmount: {
        type: Number,
        default: 0
    },
    igstAmount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true
    },
    salesOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'salesOrder'
    },
    invoiceDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    salesPerson: {
        type: String
    },
    billingAddress: {
        type: String
    },
    shippingAddress: {
        type: String
    },
    paymentTerms: {
        type: String,
        enum: ['Cash', 'Immediate', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days'],
        default: '30 Days'
    },
    items: [invoiceItemSchema],
    subtotal: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    taxableAmount: {
        type: Number,
        default: 0
    },
    cgst: {
        type: Number,
        default: 0
    },
    sgst: {
        type: Number,
        default: 0
    },
    igst: {
        type: Number,
        default: 0
    },
    roundOff: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    pendingAmount: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Partially Paid', 'Paid'],
        default: 'Unpaid'
    },
    status: {
        type: String,
        enum: ['Draft', 'Issued', 'Partially Paid', 'Paid', 'Cancelled', 'Overdue'],
        default: 'Draft'
    },
    notes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true
});

// Index for faster queries
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ salesOrder: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ invoiceDate: 1 });
invoiceSchema.index({ dueDate: 1 });

// Update payment status based on paid amount
invoiceSchema.pre('save', function(next) {
    if (this.paidAmount >= this.grandTotal) {
        this.paymentStatus = 'Paid';
        this.pendingAmount = 0;
        this.status = 'Paid';
    } else if (this.paidAmount > 0) {
        this.paymentStatus = 'Partially Paid';
        this.pendingAmount = this.grandTotal - this.paidAmount;
        this.status = 'Partially Paid';
    } else {
        this.paymentStatus = 'Unpaid';
        this.pendingAmount = this.grandTotal;
    }
    next();
});

const Invoice = mongoose.model('invoice', invoiceSchema);

module.exports = Invoice;
