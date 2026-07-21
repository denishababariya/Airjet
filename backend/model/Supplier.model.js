const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact: { type: String },
  phone: { type: String },
  city: { type: String },
  gst: { type: String },
  email: { type: String },
  address: { type: String },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
}, { timestamps: true });

module.exports = mongoose.model('supplier', supplierSchema);
