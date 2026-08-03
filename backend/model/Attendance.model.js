const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  recordType: {
    type: String,
    enum: ['attendance', 'leave'],
    default: 'attendance',
  },
  employeeId: { type: mongoose.Types.ObjectId, ref: 'employee' },
  emp: { type: String, required: true },
  empId: { type: String },
  date: { type: String },
  checkIn: { type: String, default: '--' },
  checkOut: { type: String, default: '--' },
  hours: { type: String, default: '--' },
  workingHours: { type: Number, default: 0 },
  status: { type: String, default: 'Present' },
  lateMinutes: { type: Number, default: 0 },
  qrToken: { type: String },
  from: { type: String },
  to: { type: String },
  fromTime: { type: String },
  toTime: { type: String },
  days: { type: Number },
  type: { type: String },
  reason: { type: String },
  rate: { type: String },
  amount: { type: String },
  createdBy: { type: mongoose.Types.ObjectId, ref: 'user' },
  updatedBy: { type: mongoose.Types.ObjectId, ref: 'user' },
  isHoliday: { type: Boolean, default: false },
  isWeekOff: { type: Boolean, default: false },
  earlyCheckout: { type: Boolean, default: false },
  lastScannedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('attendance', attendanceSchema);
