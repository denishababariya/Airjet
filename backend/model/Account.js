const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['Receivable', 'Payable'],
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
