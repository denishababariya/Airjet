const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    requestNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true
    },
    salesOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'salesOrder'
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'invoice'
    },
    warranty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'warranty'
    },
    machine: {
        type: String,
        required: true
    },
    machineSerialNumber: {
        type: String
    },
    complaint: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Open', 'Verified', 'Assigned', 'In Progress', 'Waiting Parts', 'Completed', 'Closed', 'Cancelled'],
        default: 'Open'
    },
    serviceType: {
        type: String,
        enum: ['Warranty', 'Paid', 'AMC'],
        default: 'Paid'
    },
    estimatedCost: {
        type: Number,
        default: 0
    },
    actualCost: {
        type: Number,
        default: 0
    },
    requestDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    scheduledDate: {
        type: Date
    },
    completedDate: {
        type: Date
    },
    assignedEngineer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    assignedDate: {
        type: Date
    },
    attachment: {
        type: String
    },
    resolution: {
        type: String
    },
    customerFeedback: {
        type: String
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    partsUsed: [{
        sparePart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'spareParts'
        },
        partNumber: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number
    }],
    laborHours: {
        type: Number,
        default: 0
    },
    laborRate: {
        type: Number,
        default: 0
    },
    laborCost: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true
});

// Index for faster queries
serviceRequestSchema.index({ requestNumber: 1 });
serviceRequestSchema.index({ customer: 1 });
serviceRequestSchema.index({ salesOrder: 1 });
serviceRequestSchema.index({ warranty: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ priority: 1 });
serviceRequestSchema.index({ requestDate: 1 });
serviceRequestSchema.index({ assignedEngineer: 1 });

// Pre-save hook to calculate total cost
serviceRequestSchema.pre('save', function(next) {
    let partsTotal = 0;
    if (this.partsUsed && Array.isArray(this.partsUsed)) {
        partsTotal = this.partsUsed.reduce((sum, part) => sum + (part.totalPrice || 0), 0);
    }
    this.laborCost = this.laborHours * this.laborRate;
    this.actualCost = partsTotal + this.laborCost;
    
    if (this.serviceType === 'Warranty') {
        this.actualCost = 0;
    }
    next();
});

const ServiceRequest = mongoose.model('serviceRequest', serviceRequestSchema);

module.exports = ServiceRequest;
