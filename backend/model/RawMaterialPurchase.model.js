const mongoose = require('mongoose');

const rawMaterialPurchaseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: String,
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier',
    required: true
  },
  purchaseDate: {
    type: String,
    required: true
  },
  expectedDelivery: {
    type: String
  },
  actualDelivery: {
    type: String
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Confirmed', 'In Transit', 'Delivered', 'Partial', 'Cancelled']
  },
  items: [{
    rawMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'rawMaterial'
    },
    name: {
      type: String,
      required: true
    },
    materialCode: String,
    materialName: String,
    category: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: String,
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    receivedQuantity: {
      type: Number,
      default: 0
    },
    qualityCheck: {
      required: { type: Boolean, default: true },
      status: { type: String, enum: ['Pending', 'Passed', 'Failed'], default: 'Pending' },
      checkedBy: String,
      checkDate: Date,
      notes: String
    }
  }],
  totalAmount: {
    type: Number,
    default: 0
  },
  gstRate: {
    type: Number,
    default: 18
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String
  },
  paymentStatus: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Partial', 'Paid', 'Overdue']
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  invoiceNumber: String,
  invoiceDate: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  receivedBy: String,
  receivedDate: Date
}, {
  timestamps: true
});

// Calculate totals before saving
rawMaterialPurchaseSchema.pre('save', function(next) {
  let totalAmount = 0;
  this.items.forEach(item => {
    totalAmount += item.totalPrice;
  });
  this.totalAmount = totalAmount;
  this.gstAmount = totalAmount * (this.gstRate / 100);
  this.grandTotal = totalAmount + this.gstAmount;
  
  next();
});

const RawMaterialPurchase = mongoose.model('rawMaterialPurchase', rawMaterialPurchaseSchema);

module.exports = RawMaterialPurchase;
