const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  empId: {
    type: String,
    required: true
  },
  empName: {
    type: String,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processed', 'Paid'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const Payroll = mongoose.model("Payroll", payrollSchema);
module.exports = Payroll;
