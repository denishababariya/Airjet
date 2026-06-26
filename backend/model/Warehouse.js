const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  currentStock: {
    type: Number,
    default: 0
  },
  manager: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
module.exports = Warehouse;
