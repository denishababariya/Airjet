const mongoose = require("mongoose");

const serviceTicketSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  vehicleModel: {
    type: String,
    required: true
  },
  issue: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  }
}, {
  timestamps: true
});

const ServiceTicket = mongoose.model("ServiceTicket", serviceTicketSchema);
module.exports = ServiceTicket;
