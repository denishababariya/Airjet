const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  recordType: {
    type: String,
    enum: ['attendance', 'leave', 'overtime'],
    default: 'attendance',
  },
  employeeId: { type: mongoose.Types.ObjectId, ref: 'employee' },
  emp: { type: String, required: true },
  empId: { type: String },
  date: { type: String },
  checkIn: { type: String, default: '--' },
  checkOut: { type: String, default: '--' },
  hours: { type: String, default: '--' },
  status: { type: String, default: 'Present' },
  from: { type: String },
  to: { type: String },
  days: { type: Number },
  type: { type: String },
  reason: { type: String },
  extraHours: { type: String },
  rate: { type: String },
  amount: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('attendance', attendanceSchema);
