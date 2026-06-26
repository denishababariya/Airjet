const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  emp: {
    type: String,
    required: true
  },
  empId: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  checkIn: {
    type: String,
    default: '--'
  },
  checkOut: {
    type: String,
    default: '--'
  },
  hours: {
    type: String,
    default: '--'
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Leave'],
    default: 'Present'
  }
}, {
  timestamps: true
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
