const mongoose = require('mongoose');

const sparePartsSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    partName: {
        type: String,
        required: true
    },
    partNumber: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    brand: {
        type: String
    },
    model: {
        type: String
    },
    compatibility: [{
        type: String
    }],
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    unitPrice: {
        type: Number,
        required: true
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    supplier: {
        type: String
    },
    location: {
        type: String
    },
    minimumStock: {
        type: Number,
        default: 5
    },
    status: {
        type: String,
        enum: ['Available', 'Low Stock', 'Out of Stock', 'Discontinued'],
        default: 'Available'
    },
    warrantyPeriod: {
        type: Number
    },
    warrantyUnit: {
        type: String,
        enum: ['Days', 'Months', 'Years'],
        default: 'Months'
    },
    images: [{
        type: String
    }],
    specifications: {
        type: String
    },
    lastRestockDate: {
        type: Date
    },
    description: {
        type: String
    }
}, {
    timestamps: true
});

// Update status based on quantity
sparePartsSchema.pre('save', function(next) {
    if (this.quantity === 0) {
        this.status = 'Out of Stock';
    } else if (this.quantity <= this.minimumStock) {
        this.status = 'Low Stock';
    } else {
        this.status = 'Available';
    }
    next();
});

const SpareParts = mongoose.model('spareParts', sparePartsSchema);

module.exports = SpareParts;
