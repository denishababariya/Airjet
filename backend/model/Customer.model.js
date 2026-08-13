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
        enum: ['Dealer', 'Distributor', 'Retailer', 'Manufacturer', 'Service Customer', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Blocked'],
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
    creditDays: {
        type: Number,
        default: 30
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    paymentTerms: {
        type: String,
        enum: ['Cash', 'Immediate', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days'],
        default: '30 Days'
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    billingAddress: {
        type: String
    },
    shippingAddress: {
        type: String
    },
    notes: {
        type: String
    },
    contactPerson: {
        type: String
    },
    alternatePhone: {
        type: String
    },
    machines: [{
        type: String
    }],
    image: {
        type: String
    }
}, {
    timestamps: true
});

const Customer = mongoose.model('customer', customerSchema);

module.exports = Customer;
