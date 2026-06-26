const mongoose = require("mongoose");

const overtimeSchema = new mongoose.Schema({
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
  extraHours: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  rate: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Overtime = mongoose.model("Overtime", overtimeSchema);
module.exports = Overtime;
