const express = require('express');
const router = express.Router();

// Employee Routes
const employeeController = require('../controller');
router.get('/employees', employeeController.getAllEmployees);
router.get('/employees/:id', employeeController.getEmployeeById);
router.post('/employees', employeeController.createEmployee);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);

// Department Routes
router.use(require('./departmentRoutes'));

// Designation Routes
router.use(require('./designationRoutes'));

// Attendance Routes
router.use(require('./attendanceRoutes'));

// Leave Routes
router.use(require('./leaveRoutes'));

// Overtime Routes
router.use(require('./overtimeRoutes'));

// Payroll Routes
router.use(require('./payrollRoutes'));

// Supplier Routes
router.use(require('./supplierRoutes'));

// Purchase Order Routes
router.use(require('./purchaseOrderRoutes'));

// Customer Routes
router.use(require('./customerRoutes'));

// Sales Order Routes
router.use(require('./salesOrderRoutes'));

// Spare Part Routes
router.use(require('./sparePartRoutes'));

// Warehouse Routes
router.use(require('./warehouseRoutes'));

// Service Ticket Routes
router.use(require('./serviceTicketRoutes'));

// Account Routes
router.use(require('./accountRoutes'));

// Health Check Route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = router;