const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  po: { type: String, required: true },
  poId: { type: mongoose.Types.ObjectId, ref: 'purchaseOrder' },
  supplier: { type: String, required: true },
  supplierId: { type: mongoose.Types.ObjectId, ref: 'supplier' },
  date: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected', 'Processed'] },
  items: [{
    itemCode: String,
    itemName: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    stockId: { type: mongoose.Types.ObjectId, ref: 'stock' },
    sparePartId: { type: mongoose.Types.ObjectId, ref: 'spareParts' }
  }],
  totalAmount: { type: Number, default: 0 },
  notes: String,
  createdBy: { type: mongoose.Types.ObjectId, ref: 'user' },
  updatedBy: { type: mongoose.Types.ObjectId, ref: 'user' }
}, { timestamps: true });

const PurchaseReturn = mongoose.model('purchaseReturn', purchaseReturnSchema);
module.exports = PurchaseReturn;
