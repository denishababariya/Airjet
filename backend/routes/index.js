const express = require('express');
const router = express.Router();
const controller = require('../controller');
const { authenticate, authorize, authorizeHR, authorizeByLevel } = require('../middleware/auth');

// Health Check Route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ──────────────────────────────────────────────────────────────
// Department Routes
// ──────────────────────────────────────────────────────────────
router.post('/departments', authenticate, authorize('Admin'), controller.createDepart);
router.get('/departments', authenticate, controller.getAllDepartments);
router.put('/departments/:id', authenticate, authorize('Admin'), controller.updateDepartment);
router.delete('/departments/:id', authenticate, authorize('Admin'), controller.deleteDepartment);

// ──────────────────────────────────────────────────────────────
// Designation Routes
// ──────────────────────────────────────────────────────────────
router.post('/designations', authenticate, authorize('Admin'), controller.createDesignation);
router.get('/designations', authenticate, controller.getAllDesignations);
router.put('/designations/:id', authenticate, authorize('Admin'), controller.updateDesignation);
router.delete('/designations/:id', authenticate, authorize('Admin'), controller.deleteDesignation);

// ──────────────────────────────────────────────────────────────
// Employee Routes
// ──────────────────────────────────────────────────────────────
router.post('/employees', authenticate, authorize('Admin', 'HR'), controller.createEmployee);
router.get('/employees', authenticate, controller.getAllEmployees);
router.get('/employees/:id', authenticate, controller.getEmployeeById);
router.get('/employees/:id/modules', authenticate, controller.getEmployeeModuleData);
router.put('/employees/:id', authenticate, authorize('Admin', 'HR'), controller.updateEmployee);
router.delete('/employees/:id', authenticate, authorize('Admin'), controller.deleteEmployee);

// ──────────────────────────────────────────────────────────────
// User Routes
// ──────────────────────────────────────────────────────────────
router.post('/users', authenticate, authorize('Admin'), controller.createUser);
router.post('/users/login', controller.loginUser);
router.post('/users/check-role', controller.checkRoleForReset);
router.post('/users/verify-otp', controller.verifyOtp);
router.post('/users/reset-password', controller.resetPasswordWithToken);
router.get('/users/me', authenticate, controller.getMe);
router.post('/users/change-password', authenticate, controller.changePassword);
router.get('/users', authenticate, authorize('Admin', 'HR'), async (req, res) => {
  const User = require('../model/User.model');
  try {
    const users = await User.find().populate({
      path: 'employeeId',
      populate: [{ path: 'department' }, { path: 'designation' }],
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put('/users/:id', authenticate, authorize('Admin'), controller.updateUser);

// ──────────────────────────────────────────────────────────────
// Attendance Routes
// ──────────────────────────────────────────────────────────────
router.post('/attendance', authenticate, authorize('Admin', 'Head', 'Manager'), controller.createAttendanceRecord);
router.get('/attendance', authenticate, controller.getAllAttendanceRecords);
router.put('/attendance/:id', authenticate, authorize('Admin', 'Head', 'Manager'), controller.updateAttendanceRecord);
router.delete('/attendance/:id', authenticate, authorize('Admin', 'Head', 'Manager'), controller.deleteAttendanceRecord);
router.post('/attendance/check-in', authenticate, authorize('Admin', 'Head', 'Manager'), controller.checkIn);
router.post('/attendance/check-out', authenticate, authorize('Admin', 'Head', 'Manager'), controller.checkOut);
router.get('/attendance/my', authenticate, controller.getMyAttendance);
router.post('/attendance/scan', authenticate, controller.scanAttendance);
router.get('/attendance/today', authenticate, controller.getTodayAttendance);
router.get('/attendance/report', authenticate, controller.getAttendanceReport);
router.post('/employees/:employeeId/generate-qr', authenticate, authorize('Admin', 'HR', 'Manager'), controller.generateQrToken);

// ──────────────────────────────────────────────────────────────
// Overtime Routes
// ──────────────────────────────────────────────────────────────
router.get('/attendance/overtime', authenticate, authorize('Admin', 'HR', 'Manager', 'Head'), controller.getOvertimeRecords);
router.post('/attendance/overtime', authenticate, authorize('Admin', 'HR', 'Manager'), controller.createAttendanceRecord);
router.put('/attendance/overtime/:id', authenticate, authorize('Admin', 'HR', 'Manager'), controller.updateAttendanceRecord);
router.delete('/attendance/overtime/:id', authenticate, authorize('Admin', 'Head'), controller.deleteAttendanceRecord);

// ──────────────────────────────────────────────────────────────
// Leave Tracking Routes
// ──────────────────────────────────────────────────────────────
router.get('/attendance/leave', authenticate, authorize('Admin', 'HR', 'Manager', 'Head'), controller.getLeaveRecords);
router.post('/attendance/leave', authenticate, authorize('Admin', 'HR', 'Manager'), controller.applyLeave);
router.put('/attendance/leave/:id', authenticate, authorize('Admin', 'HR', 'Manager'), controller.updateLeaveRecord);
router.delete('/attendance/leave/:id', authenticate, authorize('Admin', 'Head'), controller.deleteAttendanceRecord);

// ──────────────────────────────────────────────────────────────
// Late Entry Report Routes
// ──────────────────────────────────────────────────────────────
router.get('/attendance/late-entries', authenticate, authorize('Admin', 'HR', 'Manager', 'Head'), controller.getLateEntryReport);
router.post('/attendance/initialize-daily', authenticate, authorize('Admin', 'HR'), controller.initializeDailyAttendance);

// ──────────────────────────────────────────────────────────────
// ERP Records (Payroll, Sales docs, GRN, Service, Accounts, etc.)
// ──────────────────────────────────────────────────────────────
router.post('/erp', authenticate, authorizeByLevel(1), controller.createRecord);
router.get('/erp', authenticate, controller.getAllRecords);
router.get('/erp/:id', authenticate, controller.getRecordById);
router.put('/erp/:id', authenticate, authorizeByLevel(1), controller.updateRecord);
router.delete('/erp/:id', authenticate, authorize('Admin', 'Manager', 'HR'), controller.deleteRecord);

// ──────────────────────────────────────────────────────────────
// Suppliers
// ──────────────────────────────────────────────────────────────
router.post('/suppliers', authenticate, authorizeByLevel(2), controller.createSupplier);
router.get('/suppliers', authenticate, controller.getAllSuppliers);
router.get('/suppliers/:id/modules', authenticate, controller.getSupplierModuleData);
router.put('/suppliers/:id', authenticate, authorizeByLevel(2), controller.updateSupplier);
router.delete('/suppliers/:id', authenticate, authorize('Admin'), controller.deleteSupplier);

// ──────────────────────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────────────────────
router.get('/reports/sales', authenticate, controller.getSalesReport);
router.get('/reports/purchase', authenticate, controller.getPurchaseReport);
router.get('/reports/inventory', authenticate, controller.getInventoryReport);
router.get('/reports/payroll', authenticate, controller.getPayrollReport);

// ──────────────────────────────────────────────────────────────
// Stock Routes
// ──────────────────────────────────────────────────────────────
router.post('/stock', authenticate, authorizeByLevel(2), controller.createStock);
router.get('/stock', authenticate, controller.getAllStock);
router.get('/stock/low-stock', authenticate, controller.getLowStockItems);
router.get('/stock/:id', authenticate, controller.getStockById);
router.get('/stock/:id/modules', authenticate, controller.getStockModuleData);
router.put('/stock/:id', authenticate, authorizeByLevel(2), controller.updateStock);
router.delete('/stock/:id', authenticate, authorize('Admin'), controller.deleteStock);
router.patch('/stock/:id/quantity', authenticate, authorizeByLevel(2), controller.updateStockQuantity);

// ──────────────────────────────────────────────────────────────
// Income Routes
// ──────────────────────────────────────────────────────────────
router.post('/income', authenticate, authorizeByLevel(2), controller.createIncome);
router.get('/income', authenticate, controller.getAllIncome);
router.get('/income/total', authenticate, controller.getTotalIncome);
router.get('/income/by-type', authenticate, controller.getIncomeByType);
router.get('/income/:id', authenticate, controller.getIncomeById);
router.put('/income/:id', authenticate, authorize('Admin', 'Manager'), controller.updateIncome);
router.delete('/income/:id', authenticate, authorize('Admin'), controller.deleteIncome);

// ──────────────────────────────────────────────────────────────
// Spare Parts Routes
// ──────────────────────────────────────────────────────────────
router.post('/spare-parts', authenticate, authorizeByLevel(2), controller.createSparePart);
router.get('/spare-parts', authenticate, controller.getAllSpareParts);
router.get('/spare-parts/search', authenticate, controller.searchSpareParts);
router.get('/spare-parts/low-stock', authenticate, controller.getLowStockSpareParts);
router.get('/spare-parts/:id', authenticate, controller.getSparePartById);
router.get('/spare-parts/:id/modules', authenticate, controller.getSparePartModuleData);
router.put('/spare-parts/:id', authenticate, authorizeByLevel(2), controller.updateSparePart);
router.delete('/spare-parts/:id', authenticate, authorize('Admin'), controller.deleteSparePart);
router.patch('/spare-parts/:id/quantity', authenticate, authorizeByLevel(2), controller.updateSparePartQuantity);

// ──────────────────────────────────────────────────────────────
// Customer Routes
// ──────────────────────────────────────────────────────────────
router.post('/customers', authenticate, authorizeByLevel(2), controller.createCustomer);
router.get('/customers', authenticate, controller.getAllCustomers);
router.get('/customers/search', authenticate, controller.searchCustomers);
router.get('/customers/:id', authenticate, controller.getCustomerById);
router.get('/customers/:id/modules', authenticate, controller.getCustomerModuleData);
router.put('/customers/:id', authenticate, authorizeByLevel(2), controller.updateCustomer);
router.delete('/customers/:id', authenticate, authorize('Admin'), controller.deleteCustomer);
router.patch('/customers/:id/purchase', authenticate, controller.updateCustomerPurchase);

// ──────────────────────────────────────────────────────────────
// Dashboard Routes
// ──────────────────────────────────────────────────────────────
router.get('/dashboard/stats', authenticate, controller.getDashboardStats);
router.get('/dashboard/activity', authenticate, controller.getRecentActivity);
router.get('/dashboard/all-modules', authenticate, controller.getAllModuleData);
router.get('/search', authenticate, controller.globalSearch);

// ──────────────────────────────────────────────────────────────
// HR & Password Management Routes
// ──────────────────────────────────────────────────────────────
router.post('/hr/users/create', authenticate, authorize('Admin'), controller.createUserWithRole);
router.post('/hr/employees/:employeeId/generate-password', authenticate, authorizeHR, controller.generateEmployeePassword);
router.post('/hr/users/:userId/reset-password', authenticate, authorizeHR, controller.resetUserPassword);

// ──────────────────────────────────────────────────────────────
// RBAC - Role Management Routes
// ──────────────────────────────────────────────────────────────
// Roles
router.post('/roles', authenticate, authorize('Admin'), controller.createRole);
router.get('/roles', authenticate, controller.getAllRoles);
router.get('/roles/:id', authenticate, controller.getRoleById);
router.put('/roles/:id', authenticate, authorize('Admin'), controller.updateRole);
router.delete('/roles/:id', authenticate, authorize('Admin'), controller.deleteRole);

// Permissions
router.post('/permissions', authenticate, authorize('Admin'), controller.createPermission);
router.get('/permissions', authenticate, controller.getAllPermissions);
router.get('/permissions/module/:module', authenticate, controller.getPermissionsByModule);
router.put('/permissions/:id', authenticate, authorize('Admin'), controller.updatePermission);
router.delete('/permissions/:id', authenticate, authorize('Admin'), controller.deletePermission);

// Role-Permissions
router.post('/role-permissions', authenticate, authorize('Admin'), controller.assignPermissionToRole);
router.get('/role-permissions/:roleId', authenticate, controller.getRolePermissions);
router.get('/role-permissions/role/:roleId', authenticate, controller.getRoleWithPermissions);
router.delete('/role-permissions/:roleId/:permissionId', authenticate, authorize('Admin'), controller.removePermissionFromRole);
router.post('/role-permissions/bulk', authenticate, authorize('Admin'), controller.bulkAssignPermissions);

// My Permissions
router.get('/my-permissions', authenticate, controller.getMyPermissions);

module.exports = router;
