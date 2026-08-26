const mongoose = require('mongoose');

const salesOrderItemSchema = new mongoose.Schema({
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
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'warehouse'
    },
    reservedQuantity: {
        type: Number,
        default: 0
    },
    dispatchedQuantity: {
        type: Number,
        default: 0
    },
    // Warranty information per item
    warrantyPeriod: {
        type: Number
    },
    warrantyUnit: {
        type: String,
        enum: ['Days', 'Months', 'Years'],
        default: 'Months'
    },
    warrantyStartDate: {
        type: Date
    },
    warrantyEndDate: {
        type: Date
    }
});

const salesOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true
    },
    quotation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'quotation'
    },
    orderDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    expectedDeliveryDate: {
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
    items: [salesOrderItemSchema],
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
    status: {
        type: String,
        enum: ['Draft', 'Confirmed', 'Stock Reserved', 'Processing', 'Ready for Dispatch', 'Dispatched', 'Completed', 'On Hold', 'Cancelled'],
        default: 'Draft'
    },
    invoiceGenerated: {
        type: Boolean,
        default: false
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'invoice'
    },
    creditLimitChecked: {
        type: Boolean,
        default: false
    },
    creditLimitExceeded: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    confirmedBy: {
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
salesOrderSchema.index({ orderNumber: 1 });
salesOrderSchema.index({ customer: 1 });
salesOrderSchema.index({ status: 1 });
salesOrderSchema.index({ orderDate: 1 });
salesOrderSchema.index({ quotation: 1 });

const SalesOrder = mongoose.model('salesOrder', salesOrderSchema);

module.exports = SalesOrder;
