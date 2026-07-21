const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    incomeType: {
        type: String,
        required: true,
        enum: ['Sales', 'Services', 'Repairs', 'Consultation', 'Purchase', 'Other']
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String
    },
    customerId: {
        type: mongoose.Types.ObjectId,
        ref: 'customer'
    },
    invoiceNumber: {
        type: String,
        unique: true
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Cheque'],
        default: 'Cash'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Partial'],
        default: 'Pending'
    },
    receivedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    category: {
        type: String
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const Income = mongoose.model('income', incomeSchema);

module.exports = Income;
