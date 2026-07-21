const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    pincode: {
        type: String
    },
    companyName: {
        type: String
    },
    gstNumber: {
        type: String
    },
    panNumber: {
        type: String
    },
    customerType: {
        type: String,
        enum: ['Individual', 'Business', 'Government'],
        default: 'Individual'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Blacklisted'],
        default: 'Active'
    },
    totalPurchases: {
        type: Number,
        default: 0
    },
    totalAmountSpent: {
        type: Number,
        default: 0
    },
    lastPurchaseDate: {
        type: Date
    },
    creditLimit: {
        type: Number,
        default: 0
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    contactPerson: {
        type: String
    },
    alternatePhone: {
        type: String
    }
}, {
    timestamps: true
});

const Customer = mongoose.model('customer', customerSchema);

module.exports = Customer;
