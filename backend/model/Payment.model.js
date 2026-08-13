const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: {
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
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Other'],
        required: true
    },
    transactionReference: {
        type: String
    },
    bank: {
        type: String
    },
    chequeNumber: {
        type: String
    },
    chequeDate: {
        type: Date
    },
    upiId: {
        type: String
    },
    cardLastFour: {
        type: String
    },
    notes: {
        type: String
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled', 'Failed'],
        default: 'Completed'
    }
}, {
    timestamps: true
});

// Index for faster queries
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('payment', paymentSchema);

module.exports = Payment;
