const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
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
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const Leave = mongoose.model("Leave", leaveSchema);
module.exports = Leave;
