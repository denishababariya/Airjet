const mongoose = require('mongoose');

const salesReturnItemSchema = new mongoose.Schema({
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
    returnReason: {
        type: String,
        enum: ['Damaged Part', 'Wrong Part', 'Defective Part', 'Customer Rejection', 'Excess Quantity', 'Other'],
        required: true
    },
    condition: {
        type: String,
        enum: ['Good', 'Damaged', 'Defective'],
        default: 'Good'
    }
});

const salesReturnSchema = new mongoose.Schema({
    returnNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'invoice',
        required: true
    },
    returnDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    items: [salesReturnItemSchema],
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
    total: {
        type: Number,
        default: 0
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Processed'],
        default: 'Pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    approvedDate: {
        type: Date
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
salesReturnSchema.index({ returnNumber: 1 });
salesReturnSchema.index({ customer: 1 });
salesReturnSchema.index({ invoice: 1 });
salesReturnSchema.index({ status: 1 });
salesReturnSchema.index({ returnDate: 1 });

const SalesReturn = mongoose.model('salesReturn', salesReturnSchema);

module.exports = SalesReturn;
