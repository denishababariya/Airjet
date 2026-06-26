const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  head: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  employees: {
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

const Department = mongoose.model("Department", departmentSchema);
module.exports = Department;
