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
  products: [{
    productType: { type: String, enum: ['stock', 'sparePart', 'rawMaterial'], required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, refPath: 'supplierProducts.ref', required: true },
    itemName: String,
    itemCode: String,
    category: String,
    unitPrice: { type: Number, default: 0 },
  }],
  image: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('supplier', supplierSchema);
