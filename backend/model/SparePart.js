const mongoose = require("mongoose");

const sparePartSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  partNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  brand: {
    type: String
  },
  compatibleModels: [{
    type: String
  }],
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const SparePart = mongoose.model("SparePart", sparePartSchema);
module.exports = SparePart;
