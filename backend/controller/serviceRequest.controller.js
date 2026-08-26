const ServiceRequest = require('../model/ServiceRequest.model');
const Warranty = require('../model/Warranty.model');
const SalesOrder = require('../model/SalesOrder.model');
const Invoice = require('../model/Invoice.model');
const SpareParts = require('../model/SpareParts.model');

// Generate service request number
const generateRequestNumber = async () => {
    const count = await ServiceRequest.countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(count + 1).padStart(4, '0');
    return `SRQ-${year}${month}-${sequence}`;
};

// Get all service requests
const getAllServiceRequests = async (req, res) => {
    try {
        const { status, customer, serviceType, priority } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (customer) filter.customer = customer;
        if (serviceType) filter.serviceType = serviceType;
        if (priority) filter.priority = priority;
        
        const serviceRequests = await ServiceRequest.find(filter)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('warranty')
            .populate('assignedEngineer')
            .populate('partsUsed.sparePart')
            .sort({ requestDate: -1 });
        
        res.json(serviceRequests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single service request
const getServiceRequestById = async (req, res) => {
    try {
        const serviceRequest = await ServiceRequest.findById(req.params.id)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('warranty')
            .populate('assignedEngineer')
            .populate('partsUsed.sparePart');
        
        if (!serviceRequest) {
            return res.status(404).json({ error: 'Service request not found' });
        }
        
        res.json(serviceRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check warranty and determine service type
const checkWarrantyAndDetermineServiceType = async (salesOrderNumber, sparePartId, machineSerialNumber) => {
    try {
        let warranty = null;
        let serviceType = 'Paid';
        let estimatedCost = 0;
        
        if (salesOrderNumber) {
            const salesOrder = await SalesOrder.findOne({ orderNumber: salesOrderNumber });
            if (salesOrder) {
                // Find active warranty for this sales order
                warranty = await Warranty.findOne({
                    salesOrder: salesOrder._id,
                    warrantyStatus: 'Active'
                }).populate('sparePart');
                
                if (warranty) {
                    const Warranty = require('../model/Warranty.model');
                    const checkWarrantyStatus = (warrantyEndDate) => {
                        if (!warrantyEndDate) return { status: 'N/A', isValid: false };
                        const today = new Date();
                        const expiry = new Date(warrantyEndDate);
                        const isValid = today <= expiry;
                        return { status: isValid ? 'Active' : 'Expired', isValid };
                    };
                    
                    const statusCheck = checkWarrantyStatus(warranty.warrantyEndDate);
                    if (statusCheck.isValid) {
                        serviceType = 'Warranty';
                        estimatedCost = 0;
                    } else {
                        serviceType = 'Paid';
                        warranty = null; // Expired warranty
                    }
                }
            }
        }
        
        return { warranty, serviceType, estimatedCost };
    } catch (error) {
        console.error('Error checking warranty:', error);
        return { warranty: null, serviceType: 'Paid', estimatedCost: 0 };
    }
};

// Create service request
const createServiceRequest = async (req, res) => {
    try {
        const {
            customer,
            salesOrderNumber,
            machine,
            machineSerialNumber,
            complaint,
            priority,
            scheduledDate,
            attachment
        } = req.body;
        
        const requestNumber = await generateRequestNumber();
        
        // Check warranty and determine service type
        let salesOrder = null;
        let invoice = null;
        let warranty = null;
        let serviceType = 'Paid';
        let estimatedCost = 0;
        
        if (salesOrderNumber) {
            salesOrder = await SalesOrder.findOne({ orderNumber: salesOrderNumber });
            if (salesOrder) {
                invoice = await Invoice.findOne({ salesOrder: salesOrder._id });
                
                // Check warranty
                const warrantyCheck = await checkWarrantyAndDetermineServiceType(
                    salesOrderNumber,
                    null,
                    machineSerialNumber
                );
                warranty = warrantyCheck.warranty;
                serviceType = warrantyCheck.serviceType;
                estimatedCost = warrantyCheck.estimatedCost;
            }
        }
        
        const serviceRequest = new ServiceRequest({
            requestNumber,
            customer,
            salesOrder: salesOrder?._id,
            invoice: invoice?._id,
            warranty: warranty?._id,
            machine,
            machineSerialNumber,
            complaint,
            priority: priority || 'Medium',
            status: 'Open',
            serviceType,
            estimatedCost,
            requestDate: new Date(),
            scheduledDate: scheduledDate || null,
            attachment: attachment || '',
            createdBy: req.user?._id
        });
        
        await serviceRequest.save();
        
        // If warranty was used, update its status
        if (warranty && serviceType === 'Warranty') {
            warranty.warrantyStatus = 'Claimed';
            await warranty.save();
        }
        
        const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('warranty')
            .populate('assignedEngineer');
        
        res.status(201).json(populatedRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update service request
const updateServiceRequest = async (req, res) => {
    try {
        const serviceRequest = await ServiceRequest.findById(req.params.id);
        
        if (!serviceRequest) {
            return res.status(404).json({ error: 'Service request not found' });
        }
        
        const {
            status,
            priority,
            scheduledDate,
            assignedEngineer,
            assignedDate,
            resolution,
            customerFeedback,
            rating,
            partsUsed,
            laborHours,
            laborRate,
            completedDate
        } = req.body;
        
        if (status) serviceRequest.status = status;
        if (priority) serviceRequest.priority = priority;
        if (scheduledDate) serviceRequest.scheduledDate = scheduledDate;
        if (assignedEngineer) serviceRequest.assignedEngineer = assignedEngineer;
        if (assignedDate) serviceRequest.assignedDate = assignedDate;
        if (resolution !== undefined) serviceRequest.resolution = resolution;
        if (customerFeedback !== undefined) serviceRequest.customerFeedback = customerFeedback;
        if (rating !== undefined) serviceRequest.rating = rating;
        if (partsUsed) serviceRequest.partsUsed = partsUsed;
        if (laborHours !== undefined) serviceRequest.laborHours = laborHours;
        if (laborRate !== undefined) serviceRequest.laborRate = laborRate;
        if (completedDate) serviceRequest.completedDate = completedDate;
        
        // Update status to completed if completed date is set
        if (completedDate && serviceRequest.status !== 'Completed') {
            serviceRequest.status = 'Completed';
        }
        
        serviceRequest.updatedBy = req.user?._id;
        
        await serviceRequest.save();
        
        // Update inventory for parts used
        if (partsUsed && Array.isArray(partsUsed)) {
            for (const part of partsUsed) {
                if (part.sparePart && part.quantity) {
                    await SpareParts.findByIdAndUpdate(part.sparePart, {
                        $inc: { quantity: -part.quantity }
                    });
                }
            }
        }
        
        const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('warranty')
            .populate('assignedEngineer')
            .populate('partsUsed.sparePart');
        
        res.json(populatedRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete service request
const deleteServiceRequest = async (req, res) => {
    try {
        const serviceRequest = await ServiceRequest.findById(req.params.id);
        
        if (!serviceRequest) {
            return res.status(404).json({ error: 'Service request not found' });
        }
        
        if (serviceRequest.status === 'Completed' || serviceRequest.status === 'In Progress') {
            return res.status(400).json({ error: 'Cannot delete completed or in-progress service request' });
        }
        
        // Restore warranty status if it was claimed
        if (serviceRequest.warranty && serviceRequest.serviceType === 'Warranty') {
            const Warranty = require('../model/Warranty.model');
            await Warranty.findByIdAndUpdate(serviceRequest.warranty, {
                warrantyStatus: 'Active'
            });
        }
        
        await ServiceRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Service request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Assign engineer to service request
const assignEngineer = async (req, res) => {
    try {
        const { engineerId, scheduledDate } = req.body;
        
        if (!req.params.id || req.params.id === 'null' || req.params.id === 'undefined') {
            return res.status(400).json({ error: 'Invalid service request ID' });
        }
        
        const serviceRequest = await ServiceRequest.findById(req.params.id);
        
        if (!serviceRequest) {
            return res.status(404).json({ error: 'Service request not found' });
        }
        
        serviceRequest.assignedEngineer = engineerId;
        serviceRequest.assignedDate = new Date();
        serviceRequest.status = 'Assigned';
        if (scheduledDate) serviceRequest.scheduledDate = scheduledDate;
        serviceRequest.updatedBy = req.user?._id;
        
        await serviceRequest.save();
        
        const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('warranty')
            .populate('assignedEngineer');
        
        res.json(populatedRequest);
    } catch (error) {
        console.error('Error assigning engineer:', error);
        res.status(500).json({ error: error.message });
    }
};

// Complete service request
const completeServiceRequest = async (req, res) => {
    try {
        const { resolution, partsUsed, laborHours, laborRate, customerFeedback, rating } = req.body;
        
        const serviceRequest = await ServiceRequest.findById(req.params.id);
        
        if (!serviceRequest) {
            return res.status(404).json({ error: 'Service request not found' });
        }
        
        serviceRequest.status = 'Completed';
        serviceRequest.completedDate = new Date();
        if (resolution) serviceRequest.resolution = resolution;
        if (partsUsed) serviceRequest.partsUsed = partsUsed;
        if (laborHours !== undefined) serviceRequest.laborHours = laborHours;
        if (laborRate !== undefined) serviceRequest.laborRate = laborRate;
        if (customerFeedback !== undefined) serviceRequest.customerFeedback = customerFeedback;
        if (rating !== undefined) serviceRequest.rating = rating;
        serviceRequest.updatedBy = req.user?._id;
        
        await serviceRequest.save();
        
        // Update inventory for parts used
        if (partsUsed && Array.isArray(partsUsed)) {
            for (const part of partsUsed) {
                if (part.sparePart && part.quantity) {
                    await SpareParts.findByIdAndUpdate(part.sparePart, {
                        $inc: { quantity: -part.quantity }
                    });
                }
            }
        }
        
        const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
            .populate('customer')
            .populate('salesOrder')
            .populate('invoice')
            .populate('warranty')
            .populate('assignedEngineer')
            .populate('partsUsed.sparePart');
        
        res.json(populatedRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllServiceRequests,
    getServiceRequestById,
    checkWarrantyAndDetermineServiceType,
    createServiceRequest,
    updateServiceRequest,
    deleteServiceRequest,
    assignEngineer,
    completeServiceRequest
};
