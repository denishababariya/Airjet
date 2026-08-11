const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Metal', 'Plastic', 'Chemical', 'Fabric', 'Electronics', 'Packaging', 'Other']
  },
  description: {
    type: String
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'litre', 'ml', 'meter', 'cm', 'piece', 'box', 'roll', 'bag']
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  minimumStock: {
    type: Number,
    default: 10
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  supplierName: {
    type: String
  },
  location: {
    type: String
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'warehouse'
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  lastPurchaseDate: {
    type: Date
  },
  lastPurchasePrice: {
    type: Number
  },
  specifications: {
    grade: String,
    color: String,
    size: String,
    weight: String,
    dimensions: String,
    other: mongoose.Schema.Types.Mixed
  },
  qualityCheck: {
    required: { type: Boolean, default: false },
    lastCheckDate: Date,
    nextCheckDate: Date,
    status: { type: String, enum: ['Pending', 'Passed', 'Failed'], default: 'Pending' }
  }
}, {
  timestamps: true
});

// Calculate total price before saving
rawMaterialSchema.pre('save', function(next) {
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

const RawMaterial = mongoose.model('rawMaterial', rawMaterialSchema);

module.exports = RawMaterial;
