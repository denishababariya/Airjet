const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
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

const quotationSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true
    },
    quotationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    salesPerson: {
        type: String,
        required: true
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
    deliveryTerms: {
        type: String
    },
    items: [quotationItemSchema],
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
    grandTotal: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    terms: {
        type: String
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'],
        default: 'Draft'
    },
    convertedToSalesOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'salesOrder'
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
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ customer: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ quotationDate: 1 });

const Quotation = mongoose.model('quotation', quotationSchema);

module.exports = Quotation;
