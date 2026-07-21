const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    itemName: {
        type: String,
        required: true
    },
    itemCode: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    unit: {
        type: String,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    location: {
        type: String
    },
    supplier: {
        type: String
    },
    minimumStock: {
        type: Number,
        default: 10
    },
    status: {
        type: String,
        enum: ['In Stock', 'Low Stock', 'Out of Stock'],
        default: 'In Stock'
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

// Calculate total price before saving
stockSchema.pre('save', function(next) {
    this.totalPrice = this.quantity * this.unitPrice;
    
    // Update status based on quantity
    if (this.quantity === 0) {
        this.status = 'Out of Stock';
    } else if (this.quantity <= this.minimumStock) {
        this.status = 'Low Stock';
    } else {
        this.status = 'In Stock';
    }
    
    next();
});

const Stock = mongoose.model('stock', stockSchema);

module.exports = Stock;
