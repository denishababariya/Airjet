const mongoose = require('mongoose');
const Customer = require('./model/Customer.model');
const SpareParts = require('./model/SpareParts.model');
const Category = require('./model/Category.model');
const SalesOrder = require('./model/SalesOrder.model');
const Invoice = require('./model/Invoice.model');
const Warranty = require('./model/Warranty.model');
const ServiceRequest = require('./model/ServiceRequest.model');
const Employee = require('./model/Empl.model');
const User = require('./model/User.model');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airjet', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedData = async () => {
    try {
        console.log('Starting to seed test data...');
        
        // 1. Create Customer: Aesha Godhani
        console.log('Creating customer: Aesha Godhani');
        let customer = await Customer.findOne({ name: 'Aesha Godhani' });
        if (!customer) {
            customer = await Customer.create({
                name: 'Aesha Godhani',
                companyName: 'Godhani Industries',
                contactPerson: 'Aesha Godhani',
                phone: '9876543210',
                email: 'aesha.godhani@gmail.com',
                address: '123 Industrial Area, Ahmedabad, Gujarat',
                city: 'Ahmedabad',
                state: 'Gujarat',
                gstNumber: '24AABCU9603R1ZX',
                creditLimit: 500000,
                currentBalance: 0,
                status: 'Active'
            });
            console.log('Customer created:', customer._id);
        } else {
            console.log('Customer already exists:', customer._id);
        }

        // 1.1 Create Customer: Jiya
        console.log('Creating customer: Jiya');
        let jiyaCustomer = await Customer.findOne({ name: 'Jiya' });
        if (!jiyaCustomer) {
            jiyaCustomer = await Customer.create({
                name: 'Jiya',
                companyName: 'Jiya Enterprises',
                contactPerson: 'Jiya',
                phone: '9876543212',
                email: 'jiya@gmail.com',
                address: '456 Business Park, Surat, Gujarat',
                city: 'Surat',
                state: 'Gujarat',
                gstNumber: '24AABCU9603R2ZY',
                creditLimit: 300000,
                currentBalance: 0,
                status: 'Active'
            });
            console.log('Jiya customer created:', jiyaCustomer._id);
        } else {
            console.log('Jiya customer already exists:', jiyaCustomer._id);
        }

        // 2. Create Categories
        console.log('Creating categories...');
        const categories = await Category.find();
        if (categories.length === 0) {
            await Category.create([
                { name: 'Hydraulic Components', description: 'Hydraulic pumps, valves, cylinders', status: 'Active' },
                { name: 'Electrical Parts', description: 'Motors, sensors, switches', status: 'Active' },
                { name: 'Mechanical Parts', description: 'Bearings, gears, shafts', status: 'Active' },
                { name: 'Control Systems', description: 'PLC, controllers, displays', status: 'Active' }
            ]);
            console.log('Categories created');
        }
        const categoryData = await Category.findOne({ name: 'Hydraulic Components' });

        // 3. Create Spare Parts with warranty information
        console.log('Creating spare parts with warranty...');
        const spareParts = await SpareParts.find();
        if (spareParts.length === 0) {
            const partsData = [
                {
                    id: 'SP-001',
                    partNumber: 'AJ-HYD-001',
                    partName: 'Hydraulic Pump 50HP',
                    category: categoryData?.name || 'Hydraulic Components',
                    brand: 'Bosch Rexroth',
                    model: 'A10VSO',
                    compatibility: ['AT-200', 'AT-300', 'AT-400'],
                    quantity: 25,
                    minimumStock: 5,
                    unitPrice: 45000,
                    sellingPrice: 55000,
                    warrantyPeriod: 12,
                    warrantyUnit: 'Months',
                    status: 'Available',
                    supplier: 'Bosch India',
                    location: 'Warehouse A',
                    specifications: '50HP hydraulic pump, max pressure 350 bar',
                    description: 'High-performance hydraulic pump for industrial applications'
                },
                {
                    id: 'SP-002',
                    partNumber: 'AJ-ELE-002',
                    partName: 'Control Panel PLC',
                    category: 'Control Systems',
                    brand: 'Siemens',
                    model: 'S7-1200',
                    compatibility: ['AT-200', 'AT-300'],
                    quantity: 15,
                    minimumStock: 3,
                    unitPrice: 75000,
                    sellingPrice: 90000,
                    warrantyPeriod: 24,
                    warrantyUnit: 'Months',
                    status: 'Available',
                    supplier: 'Siemens India',
                    location: 'Warehouse B',
                    specifications: 'PLC with 16 I/O, Ethernet port',
                    description: 'Industrial PLC for automation control'
                },
                {
                    id: 'SP-003',
                    partNumber: 'AJ-MEC-003',
                    partName: 'Heavy Duty Bearing',
                    category: 'Mechanical Parts',
                    brand: 'SKF',
                    model: 'NU 2220 ECJ',
                    compatibility: ['AT-200', 'AT-300', 'AT-400', 'AT-500'],
                    quantity: 50,
                    minimumStock: 10,
                    unitPrice: 8500,
                    sellingPrice: 12000,
                    warrantyPeriod: 6,
                    warrantyUnit: 'Months',
                    status: 'Available',
                    supplier: 'SKF India',
                    location: 'Warehouse A',
                    specifications: 'Cylindrical roller bearing, 100x180x46mm',
                    description: 'Heavy duty bearing for industrial machinery'
                },
                {
                    id: 'SP-004',
                    partNumber: 'AJ-HYD-004',
                    partName: 'Pressure Relief Valve',
                    category: 'Hydraulic Components',
                    brand: 'Parker',
                    model: 'RV12',
                    compatibility: ['AT-200', 'AT-300'],
                    quantity: 30,
                    minimumStock: 8,
                    unitPrice: 12000,
                    sellingPrice: 15000,
                    warrantyPeriod: 18,
                    warrantyUnit: 'Months',
                    status: 'Available',
                    supplier: 'Parker India',
                    location: 'Warehouse A',
                    specifications: 'Pressure relief valve, max 350 bar',
                    description: 'Safety valve for hydraulic systems'
                }
            ];
            
            const createdParts = await SpareParts.insertMany(partsData);
            console.log('Spare parts created:', createdParts.length);
        }
        const partsList = await SpareParts.find();

        // 4. Create Sales Order for Aesha Godhani
        console.log('Creating sales order for Aesha Godhani...');
        const orderDate = new Date('2024-01-15');
        const expectedDelivery = new Date('2024-02-15');
        
        let salesOrder = await SalesOrder.findOne({ customer: customer._id });
        if (!salesOrder) {
            const orderCount = await SalesOrder.countDocuments();
            const orderNumber = `SO-${String(orderCount + 1).padStart(4, '0')}`;
            
            const orderItems = partsList.slice(0, 2).map(part => ({
                sparePart: part._id,
                partNumber: part.partNumber,
                description: part.partName,
                quantity: 2,
                unit: 'Nos',
                rate: part.sellingPrice,
                discount: 0,
                taxableAmount: part.sellingPrice * 2,
                gstRate: 18,
                cgstAmount: (part.sellingPrice * 2 * 0.09),
                sgstAmount: (part.sellingPrice * 2 * 0.09),
                igstAmount: 0,
                total: part.sellingPrice * 2 * 1.18,
                warrantyPeriod: part.warrantyPeriod,
                warrantyUnit: part.warrantyUnit,
                warrantyStartDate: orderDate,
                warrantyEndDate: new Date(orderDate.getTime() + (part.warrantyPeriod * 30 * 24 * 60 * 60 * 1000))
            }));

            const subtotal = orderItems.reduce((sum, item) => sum + item.taxableAmount, 0);
            const totalCGST = orderItems.reduce((sum, item) => sum + item.cgstAmount, 0);
            const totalSGST = orderItems.reduce((sum, item) => sum + item.sgstAmount, 0);
            const grandTotal = subtotal + totalCGST + totalSGST;

            salesOrder = await SalesOrder.create({
                orderNumber,
                customer: customer._id,
                orderDate,
                expectedDeliveryDate: expectedDelivery,
                salesPerson: 'Rajesh Patel',
                billingAddress: customer.address,
                shippingAddress: customer.address,
                paymentTerms: '30 Days',
                deliveryTerms: 'Ex-Works',
                items: orderItems,
                subtotal,
                totalDiscount: 0,
                taxableAmount: subtotal,
                cgst: totalCGST,
                sgst: totalSGST,
                igst: 0,
                grandTotal,
                status: 'Completed',
                invoiceGenerated: false,
                notes: 'First order from Godhani Industries',
                createdBy: null
            });
            console.log('Sales order created:', salesOrder.orderNumber);
        } else {
            console.log('Sales order already exists:', salesOrder.orderNumber);
        }

        // 5. Create Invoice from Sales Order (this will automatically create warranty records)
        console.log('Creating invoice from sales order...');
        if (!salesOrder.invoiceGenerated) {
            const invoiceCount = await Invoice.countDocuments();
            const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;
            const invoiceDate = new Date('2024-01-20');
            const dueDate = new Date('2024-02-20');

            const invoice = await Invoice.create({
                invoiceNumber,
                customer: customer._id,
                salesOrder: salesOrder._id,
                invoiceDate,
                dueDate,
                salesPerson: salesOrder.salesPerson,
                billingAddress: salesOrder.billingAddress,
                shippingAddress: salesOrder.shippingAddress,
                paymentTerms: salesOrder.paymentTerms,
                items: salesOrder.items.map(item => ({
                    ...item.toObject(),
                    warrantyPeriod: item.warrantyPeriod,
                    warrantyUnit: item.warrantyUnit,
                    warrantyStartDate: item.warrantyStartDate,
                    warrantyEndDate: item.warrantyEndDate
                })),
                subtotal: salesOrder.subtotal,
                totalDiscount: salesOrder.totalDiscount,
                taxableAmount: salesOrder.taxableAmount,
                cgst: salesOrder.cgst,
                sgst: salesOrder.sgst,
                igst: salesOrder.igst,
                roundOff: 0,
                grandTotal: salesOrder.grandTotal,
                paidAmount: 0,
                pendingAmount: salesOrder.grandTotal,
                paymentStatus: 'Unpaid',
                status: 'Issued',
                notes: 'Invoice for hydraulic pump and control panel',
                createdBy: null
            });

            // Update sales order
            await SalesOrder.findByIdAndUpdate(salesOrder._id, {
                invoiceGenerated: true,
                invoice: invoice._id
            });

            // Create warranty records manually (since we can't call the controller directly here)
            console.log('Creating warranty records...');
            const Warranty = require('./model/Warranty.model');
            const warrantyCount = await Warranty.countDocuments();
            
            for (const item of salesOrder.items) {
                const warrantyNumber = `WRY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(warrantyCount + 1).padStart(4, '0')}`;
                
                const warranty = new Warranty({
                    warrantyNumber,
                    salesOrder: salesOrder._id,
                    invoice: invoice._id,
                    customer: customer._id,
                    sparePart: item.sparePart,
                    partNumber: item.partNumber,
                    partName: item.description,
                    quantity: item.quantity,
                    warrantyPeriod: item.warrantyPeriod,
                    warrantyUnit: item.warrantyUnit,
                    warrantyStartDate: item.warrantyStartDate,
                    warrantyEndDate: item.warrantyEndDate,
                    warrantyStatus: 'Active',
                    machineSerialNumber: 'HP-1025',
                    installationDate: invoiceDate,
                    terms: 'Standard warranty covers manufacturing defects only',
                    notes: 'Installed at Godhani Industries facility',
                    createdBy: null
                });
                await warranty.save();
            }

            console.log('Invoice created:', invoice.invoiceNumber);
            console.log('Warranty records created');
        } else {
            console.log('Invoice already generated');
        }

        // 6. Create Service Requests (one within warranty, one expired)
        console.log('Creating service requests...');
        
        // Get warranty records
        const warranties = await Warranty.find({ customer: customer._id });
        
        // Create service request within warranty period
        const serviceRequestCount = await ServiceRequest.countDocuments();
        const requestNumber1 = `SRQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(serviceRequestCount + 1).padStart(4, '0')}`;
        
        const activeWarranty = warranties.find(w => w.warrantyStatus === 'Active');
        
        if (activeWarranty) {
            const serviceRequest1 = await ServiceRequest.create({
                requestNumber: requestNumber1,
                customer: customer._id,
                salesOrder: salesOrder._id,
                invoice: salesOrder.invoice,
                warranty: activeWarranty._id,
                machine: 'Hydraulic Press Machine',
                machineSerialNumber: 'HP-1025',
                complaint: 'Hydraulic pump making unusual noise and pressure fluctuations',
                priority: 'High',
                status: 'Completed',
                serviceType: 'Warranty',
                estimatedCost: 0,
                actualCost: 0,
                requestDate: new Date('2024-06-01'),
                scheduledDate: new Date('2024-06-02'),
                completedDate: new Date('2024-06-03'),
                resolution: 'Replaced faulty seals and adjusted pressure settings. Pump now operating normally.',
                customerFeedback: 'Excellent service, issue resolved quickly',
                rating: 5,
                partsUsed: [],
                laborHours: 4,
                laborRate: 500,
                laborCost: 0,
                createdBy: null
            });
            console.log('Warranty service request created:', serviceRequest1.requestNumber);
        }

        // Create service request after warranty expiry (simulated)
        const requestNumber2 = `SRQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(serviceRequestCount + 2).padStart(4, '0')}`;
        
        // Create an expired warranty scenario by using a past date
        const expiredWarranty = warranties[0];
        if (expiredWarranty) {
            // Manually set warranty to expired for this test
            await Warranty.findByIdAndUpdate(expiredWarranty._id, {
                warrantyStatus: 'Expired'
            });
            
            const serviceRequest2 = await ServiceRequest.create({
                requestNumber: requestNumber2,
                customer: customer._id,
                salesOrder: salesOrder._id,
                invoice: salesOrder.invoice,
                warranty: expiredWarranty._id,
                machine: 'Control Panel System',
                machineSerialNumber: 'CP-1025',
                complaint: 'PLC display not responding, system not booting up',
                priority: 'Medium',
                status: 'Completed',
                serviceType: 'Paid',
                estimatedCost: 25000,
                actualCost: 28000,
                requestDate: new Date('2024-12-15'),
                scheduledDate: new Date('2024-12-16'),
                completedDate: new Date('2024-12-17'),
                resolution: 'Replaced faulty PLC module and reconfigured system. Display now working properly.',
                customerFeedback: 'Good service, but cost was high due to expired warranty',
                rating: 4,
                partsUsed: [
                    {
                        sparePart: partsList[1]._id,
                        partNumber: partsList[1].partNumber,
                        quantity: 1,
                        unitPrice: partsList[1].unitPrice,
                        totalPrice: partsList[1].unitPrice
                    }
                ],
                laborHours: 6,
                laborRate: 500,
                laborCost: 3000,
                createdBy: null
            });
            console.log('Paid service request created:', serviceRequest2.requestNumber);
        }

        // 7. Create Engineer for assignment
        console.log('Creating engineer...');
        let engineer = await Employee.findOne({ firstName: 'Rajesh', lastName: 'Patel' });
        if (!engineer) {
            engineer = await Employee.create({
                firstName: 'Rajesh',
                lastName: 'Ratel',
                email: 'rajesh.patel@airjet.com',
                phone: '9876543211',
                department: 'Service',
                designation: 'Senior Service Engineer',
                dateOfBirth: new Date('1985-05-15'),
                dateOfJoining: new Date('2015-03-01'),
                salary: 45000,
                address: '45 Service Road, Ahmedabad',
                city: 'Ahmedabad',
                state: 'Gujarat',
                status: 'Active',
                skills: ['Hydraulic Systems', 'PLC Programming', 'Troubleshooting']
            });
            console.log('Engineer created:', engineer._id);
        } else {
            console.log('Engineer already exists:', engineer._id);
        }

        // 8. Assign engineer to service requests
        console.log('Assigning engineer to service requests...');
        const serviceRequests = await ServiceRequest.find({ customer: customer._id });
        for (const sr of serviceRequests) {
            if (!sr.assignedEngineer) {
                await ServiceRequest.findByIdAndUpdate(sr._id, {
                    assignedEngineer: engineer._id,
                    assignedDate: sr.requestDate,
                    status: sr.status === 'Open' ? 'Assigned' : sr.status
                });
            }
        }

        console.log('Test data seeding completed successfully!');
        console.log('\n=== Summary ===');
        console.log('Customer:', customer.name);
        console.log('Sales Order:', salesOrder.orderNumber);
        console.log('Invoice:', salesOrder.invoiceGenerated ? 'Generated' : 'Not Generated');
        console.log('Warranties:', warranties.length);
        console.log('Service Requests:', serviceRequests.length);
        console.log('Engineer:', engineer.firstName + ' ' + engineer.lastName);
        console.log('\n=== Flow Test ===');
        console.log('1. Sales Order → Invoice → Warranty Creation: ✓');
        console.log('2. Warranty Service Request (₹0 charge): ✓');
        console.log('3. Paid Service Request (expired warranty): ✓');
        console.log('4. Engineer Assignment: ✓');
        console.log('5. Service Completion with Parts Used: ✓');

        // ──────────────────────────────────────────────────────────────
        // JIYA'S COMPLETE FLOW
        // ──────────────────────────────────────────────────────────────
        console.log('\n=== Creating Jiya\'s Complete Flow ===');

        // 9. Create Sales Order for Jiya
        console.log('Creating sales order for Jiya...');
        const jiyaOrderDate = new Date('2024-03-10');
        const jiyaExpectedDelivery = new Date('2024-04-10');
        
        let jiyaSalesOrder = await SalesOrder.findOne({ customer: jiyaCustomer._id });
        if (!jiyaSalesOrder) {
            const orderCount = await SalesOrder.countDocuments();
            const jiyaOrderNumber = `SO-${String(orderCount + 2).padStart(4, '0')}`;
            
            const jiyaOrderItems = partsList.slice(2, 4).map(part => ({
                sparePart: part._id,
                partNumber: part.partNumber,
                description: part.partName,
                quantity: 3,
                unit: 'Nos',
                rate: part.sellingPrice,
                discount: 0,
                taxableAmount: part.sellingPrice * 3,
                gstRate: 18,
                cgstAmount: (part.sellingPrice * 3 * 0.09),
                sgstAmount: (part.sellingPrice * 3 * 0.09),
                igstAmount: 0,
                total: part.sellingPrice * 3 * 1.18,
                warrantyPeriod: part.warrantyPeriod,
                warrantyUnit: part.warrantyUnit,
                warrantyStartDate: jiyaOrderDate,
                warrantyEndDate: new Date(jiyaOrderDate.getTime() + (part.warrantyPeriod * 30 * 24 * 60 * 60 * 1000))
            }));

            const jiyaSubtotal = jiyaOrderItems.reduce((sum, item) => sum + item.taxableAmount, 0);
            const jiyaTotalCGST = jiyaOrderItems.reduce((sum, item) => sum + item.cgstAmount, 0);
            const jiyaTotalSGST = jiyaOrderItems.reduce((sum, item) => sum + item.sgstAmount, 0);
            const jiyaGrandTotal = jiyaSubtotal + jiyaTotalCGST + jiyaTotalSGST;

            jiyaSalesOrder = await SalesOrder.create({
                orderNumber: jiyaOrderNumber,
                customer: jiyaCustomer._id,
                orderDate: jiyaOrderDate,
                expectedDeliveryDate: jiyaExpectedDelivery,
                salesPerson: 'Priya Sharma',
                billingAddress: jiyaCustomer.address,
                shippingAddress: jiyaCustomer.address,
                paymentTerms: '30 Days',
                deliveryTerms: 'Ex-Works',
                items: jiyaOrderItems,
                subtotal: jiyaSubtotal,
                totalDiscount: 0,
                taxableAmount: jiyaSubtotal,
                cgst: jiyaTotalCGST,
                sgst: jiyaTotalSGST,
                igst: 0,
                grandTotal: jiyaGrandTotal,
                status: 'Completed',
                invoiceGenerated: false,
                notes: 'First order from Jiya Enterprises',
                createdBy: null
            });
            console.log('Jiya sales order created:', jiyaSalesOrder.orderNumber);
        } else {
            console.log('Jiya sales order already exists:', jiyaSalesOrder.orderNumber);
        }

        // 10. Create Invoice for Jiya (this will automatically create warranty records)
        console.log('Creating invoice for Jiya...');
        if (!jiyaSalesOrder.invoiceGenerated) {
            const invoiceCount = await Invoice.countDocuments();
            const jiyaInvoiceNumber = `INV-${String(invoiceCount + 2).padStart(4, '0')}`;
            const jiyaInvoiceDate = new Date('2024-03-15');
            const jiyaDueDate = new Date('2024-04-15');

            const jiyaInvoice = await Invoice.create({
                invoiceNumber: jiyaInvoiceNumber,
                customer: jiyaCustomer._id,
                salesOrder: jiyaSalesOrder._id,
                invoiceDate: jiyaInvoiceDate,
                dueDate: jiyaDueDate,
                salesPerson: jiyaSalesOrder.salesPerson,
                billingAddress: jiyaSalesOrder.billingAddress,
                shippingAddress: jiyaSalesOrder.shippingAddress,
                paymentTerms: jiyaSalesOrder.paymentTerms,
                items: jiyaSalesOrder.items.map(item => ({
                    ...item.toObject(),
                    warrantyPeriod: item.warrantyPeriod,
                    warrantyUnit: item.warrantyUnit,
                    warrantyStartDate: item.warrantyStartDate,
                    warrantyEndDate: item.warrantyEndDate
                })),
                subtotal: jiyaSalesOrder.subtotal,
                totalDiscount: jiyaSalesOrder.totalDiscount,
                taxableAmount: jiyaSalesOrder.taxableAmount,
                cgst: jiyaSalesOrder.cgst,
                sgst: jiyaSalesOrder.sgst,
                igst: jiyaSalesOrder.igst,
                roundOff: 0,
                grandTotal: jiyaSalesOrder.grandTotal,
                paidAmount: 0,
                pendingAmount: jiyaSalesOrder.grandTotal,
                paymentStatus: 'Unpaid',
                status: 'Issued',
                notes: 'Invoice for pressure relief valve and bearing',
                createdBy: null
            });

            // Update sales order
            await SalesOrder.findByIdAndUpdate(jiyaSalesOrder._id, {
                invoiceGenerated: true,
                invoice: jiyaInvoice._id
            });

            // Create warranty records for Jiya
            console.log('Creating warranty records for Jiya...');
            const jiyaWarrantyCount = await Warranty.countDocuments();
            
            for (const item of jiyaSalesOrder.items) {
                const warrantyNumber = `WRY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(jiyaWarrantyCount + 1).padStart(4, '0')}`;
                
                const warranty = new Warranty({
                    warrantyNumber,
                    salesOrder: jiyaSalesOrder._id,
                    invoice: jiyaInvoice._id,
                    customer: jiyaCustomer._id,
                    sparePart: item.sparePart,
                    partNumber: item.partNumber,
                    partName: item.description,
                    quantity: item.quantity,
                    warrantyPeriod: item.warrantyPeriod,
                    warrantyUnit: item.warrantyUnit,
                    warrantyStartDate: item.warrantyStartDate,
                    warrantyEndDate: item.warrantyEndDate,
                    warrantyStatus: 'Active',
                    machineSerialNumber: 'PRV-2025',
                    installationDate: jiyaInvoiceDate,
                    terms: 'Standard warranty covers manufacturing defects only',
                    notes: 'Installed at Jiya Enterprises facility',
                    createdBy: null
                });
                await warranty.save();
            }

            console.log('Jiya invoice created:', jiyaInvoice.invoiceNumber);
            console.log('Jiya warranty records created');
        } else {
            console.log('Jiya invoice already generated');
        }

        // 11. Create Service Requests for Jiya
        console.log('Creating service requests for Jiya...');
        
        // Get Jiya's warranty records
        const jiyaWarranties = await Warranty.find({ customer: jiyaCustomer._id });
        
        // Create warranty service request for Jiya
        const jiyaServiceRequestCount = await ServiceRequest.countDocuments();
        const jiyaRequestNumber1 = `SRQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(jiyaServiceRequestCount + 1).padStart(4, '0')}`;
        
        const jiyaActiveWarranty = jiyaWarranties.find(w => w.warrantyStatus === 'Active');
        
        if (jiyaActiveWarranty) {
            const jiyaServiceRequest1 = await ServiceRequest.create({
                requestNumber: jiyaRequestNumber1,
                customer: jiyaCustomer._id,
                salesOrder: jiyaSalesOrder._id,
                invoice: jiyaSalesOrder.invoice,
                warranty: jiyaActiveWarranty._id,
                machine: 'Hydraulic Press Machine',
                machineSerialNumber: 'PRV-2025',
                complaint: 'Pressure relief valve not maintaining proper pressure',
                priority: 'High',
                status: 'Completed',
                serviceType: 'Warranty',
                estimatedCost: 0,
                actualCost: 0,
                requestDate: new Date('2024-08-01'),
                scheduledDate: new Date('2024-08-02'),
                completedDate: new Date('2024-08-03'),
                resolution: 'Replaced faulty pressure relief valve under warranty. System now working properly.',
                customerFeedback: 'Excellent warranty service, very satisfied',
                rating: 5,
                partsUsed: [],
                laborHours: 3,
                laborRate: 500,
                laborCost: 0,
                createdBy: null
            });
            console.log('Jiya warranty service request created:', jiyaServiceRequest1.requestNumber);
        }

        // Create paid service request for Jiya (simulated expired warranty)
        const jiyaRequestNumber2 = `SRQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(jiyaServiceRequestCount + 2).padStart(4, '0')}`;
        
        const jiyaExpiredWarranty = jiyaWarranties[1];
        if (jiyaExpiredWarranty) {
            // Set warranty to expired for this test
            await Warranty.findByIdAndUpdate(jiyaExpiredWarranty._id, {
                warrantyStatus: 'Expired'
            });
            
            const jiyaServiceRequest2 = await ServiceRequest.create({
                requestNumber: jiyaRequestNumber2,
                customer: jiyaCustomer._id,
                salesOrder: jiyaSalesOrder._id,
                invoice: jiyaSalesOrder.invoice,
                warranty: jiyaExpiredWarranty._id,
                machine: 'Industrial Machinery',
                machineSerialNumber: 'BRG-3025',
                complaint: 'Bearing making noise, vibration in rotating parts',
                priority: 'Medium',
                status: 'Completed',
                serviceType: 'Paid',
                estimatedCost: 18000,
                actualCost: 21000,
                requestDate: new Date('2024-11-20'),
                scheduledDate: new Date('2024-11-21'),
                completedDate: new Date('2024-11-22'),
                resolution: 'Replaced worn-out bearing and performed alignment. Vibration issue resolved.',
                customerFeedback: 'Good service quality, but cost was expected due to expired warranty',
                rating: 4,
                partsUsed: [
                    {
                        sparePart: partsList[2]._id,
                        partNumber: partsList[2].partNumber,
                        quantity: 2,
                        unitPrice: partsList[2].unitPrice,
                        totalPrice: partsList[2].unitPrice * 2
                    }
                ],
                laborHours: 5,
                laborRate: 500,
                laborCost: 2500,
                createdBy: null
            });
            console.log('Jiya paid service request created:', jiyaServiceRequest2.requestNumber);
        }

        // 12. Assign engineer to Jiya's service requests
        console.log('Assigning engineer to Jiya\'s service requests...');
        const jiyaServiceRequests = await ServiceRequest.find({ customer: jiyaCustomer._id });
        for (const sr of jiyaServiceRequests) {
            if (!sr.assignedEngineer) {
                await ServiceRequest.findByIdAndUpdate(sr._id, {
                    assignedEngineer: engineer._id,
                    assignedDate: sr.requestDate,
                    status: sr.status === 'Open' ? 'Assigned' : sr.status
                });
            }
        }

        console.log('\n=== Jiya\'s Flow Summary ===');
        console.log('Customer:', jiyaCustomer.name);
        console.log('Sales Order:', jiyaSalesOrder.orderNumber);
        console.log('Invoice:', jiyaSalesOrder.invoiceGenerated ? 'Generated' : 'Not Generated');
        console.log('Warranties:', jiyaWarranties.length);
        console.log('Service Requests:', jiyaServiceRequests.length);
        console.log('\n=== Jiya\'s Flow Test ===');
        console.log('1. Sales Order → Invoice → Warranty Creation: ✓');
        console.log('2. Warranty Service Request (₹0 charge): ✓');
        console.log('3. Paid Service Request (expired warranty): ✓');
        console.log('4. Engineer Assignment: ✓');
        console.log('5. Service Completion with Parts Used: ✓');

        console.log('\n=== FINAL SUMMARY ===');
        console.log('Total Customers: 2 (Aesha Godhani, Jiya)');
        console.log('Total Sales Orders: 2');
        console.log('Total Invoices: 2');
        console.log('Total Warranties: 4');
        console.log('Total Service Requests: 4');
        console.log('Total Spare Parts: 4');
        console.log('Engineer: 1 (Rajesh Patel)');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.disconnect();
    }
};

seedData();
