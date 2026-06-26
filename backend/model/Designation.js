const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  dept: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const Designation = mongoose.model("Designation", designationSchema);
module.exports = Designation;
