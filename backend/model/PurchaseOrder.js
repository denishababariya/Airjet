const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  supplierId: {
    type: String,
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  orderDate: {
    type: String,
    required: true
  },
  expectedDate: {
    type: String
  },
  items: [{
    partId: String,
    partName: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Ordered', 'Received', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = PurchaseOrder;
