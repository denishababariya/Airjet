const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  supplier: { type: String, required: true },
  supplierId: { type: mongoose.Types.ObjectId, ref: 'supplier' },
  date: { type: String, required: true },
  delivery: { type: String },
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Transit', 'Received', 'Cancelled', 'Partial'] },
  items: [{
    itemCode: String,
    itemName: String,
    category: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    stockId: { type: mongoose.Types.ObjectId, ref: 'stock' },
    sparePartId: { type: mongoose.Types.ObjectId, ref: 'spareParts' }
  }],
  totalAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes: String,
  createdBy: { type: mongoose.Types.ObjectId, ref: 'user' },
  updatedBy: { type: mongoose.Types.ObjectId, ref: 'user' }
}, { timestamps: true });

const PurchaseOrder = mongoose.model('purchaseOrder', purchaseOrderSchema);
module.exports = PurchaseOrder;
