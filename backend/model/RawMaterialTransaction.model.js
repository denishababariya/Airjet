const mongoose = require('mongoose');

const rawMaterialTransactionSchema = new mongoose.Schema({
  rawMaterialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rawMaterial',
    required: true
  },
  materialCode: String,
  materialName: String,
  type: {
    type: String,
    enum: ['Opening', 'Add', 'Deduct', 'Purchase'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: String,
  unitPrice: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  reason: String,
  referenceId: String,
  transactionDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
}, {
  timestamps: true
});

rawMaterialTransactionSchema.pre('save', function(next) {
  this.totalAmount = (Number(this.quantity) || 0) * (Number(this.unitPrice) || 0);
  next();
});

module.exports = mongoose.model('rawMaterialTransaction', rawMaterialTransactionSchema);
