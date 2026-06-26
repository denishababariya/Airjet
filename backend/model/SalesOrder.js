const mongoose = require("mongoose");

const salesOrderSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  orderDate: {
    type: String,
    required: true
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
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const SalesOrder = mongoose.model("SalesOrder", salesOrderSchema);
module.exports = SalesOrder;
