const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
    warrantyNumber: {
        type: String,
        required: true,
        unique: true
    },
    salesOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'salesOrder',
        required: true
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'invoice',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true
    },
    sparePart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'spareParts',
        required: true
    },
    partNumber: {
        type: String,
        required: true
    },
    partName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    warrantyPeriod: {
        type: Number,
        required: true
    },
    warrantyUnit: {
        type: String,
        enum: ['Days', 'Months', 'Years'],
        required: true,
        default: 'Months'
    },
    warrantyStartDate: {
        type: Date,
        required: true
    },
    warrantyEndDate: {
        type: Date,
        required: true
    },
    warrantyStatus: {
        type: String,
        enum: ['Active', 'Expired', 'Claimed', 'Void'],
        default: 'Active'
    },
    machineSerialNumber: {
        type: String
    },
    installationDate: {
        type: Date
    },
    terms: {
        type: String
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
warrantySchema.index({ warrantyNumber: 1 });
warrantySchema.index({ salesOrder: 1 });
warrantySchema.index({ invoice: 1 });
warrantySchema.index({ customer: 1 });
warrantySchema.index({ sparePart: 1 });
warrantySchema.index({ warrantyStatus: 1 });
warrantySchema.index({ warrantyEndDate: 1 });

// Pre-save hook to update warranty status based on expiry date
warrantySchema.pre('save', function(next) {
    const today = new Date();
    if (this.warrantyEndDate < today && this.warrantyStatus === 'Active') {
        this.warrantyStatus = 'Expired';
    }
    next();
});

const Warranty = mongoose.model('warranty', warrantySchema);

module.exports = Warranty;
