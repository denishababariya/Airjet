const mongoose = require('mongoose');

const allowanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String }
}, { _id: false });

const payrollSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Types.ObjectId, 
    ref: 'employee',
    required: true 
  },
  employeeId: { type: String },
  employeeName: { type: String, required: true },
  department: { 
    type: mongoose.Types.ObjectId, 
    ref: 'department' 
  },
  departmentName: { type: String },
  designation: { 
    type: mongoose.Types.ObjectId, 
    ref: 'designation' 
  },
  designationName: { type: String },
  
  // Month/Year
  month: { type: String, required: true }, // e.g., "Jun 2026"
  year: { type: Number, required: true },
  
  // Salary Components
  basicSalary: { type: Number, required: true, default: 0 },
  
  // Attendance Data
  workingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  paidLeave: { type: Number, default: 0 },
  unpaidLeave: { type: Number, default: 0 },
  lateEntries: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  
  // Overtime
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 },
  overtimeAmount: { type: Number, default: 0 },
  
  // Allowances
  allowances: [allowanceSchema],
  totalAllowance: { type: Number, default: 0 },
  
  // Deductions
  deductions: [deductionSchema],
  totalDeduction: { type: Number, default: 0 },
  leaveDeduction: { type: Number, default: 0 },
  
  // Calculated Fields
  grossSalary: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  
  // Status Workflow
  status: { 
    type: String, 
    enum: ['Draft', 'Generated', 'Approved', 'Paid', 'Cancelled'],
    default: 'Draft' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending' 
  },
  
  // Payment Details
  paymentDate: { type: Date },
  paymentMode: { 
    type: String, 
    enum: ['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'Other'] 
  },
  transactionReference: { type: String },
  paymentNotes: { type: String },
  
  // Audit Fields
  notes: { type: String },
  createdBy: { type: mongoose.Types.ObjectId, ref: 'user' },
  approvedBy: { type: mongoose.Types.ObjectId, ref: 'user' },
  approvedAt: { type: Date },
  
  // Joining date for reference
  joiningDate: { type: Date }
}, { 
  timestamps: true,
  indexes: [
    { employee: 1, month: 1, year: 1 }, // Unique constraint for employee per month/year
    { status: 1 },
    { paymentStatus: 1 },
    { department: 1 },
    { year: 1, month: 1 }
  ]
});

// Ensure no duplicate payroll for same employee in same month/year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('payroll', payrollSchema);
