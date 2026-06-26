const express = require('express');
const router = express.Router();
const controller = require('../controller/payrollController');

router.get('/payroll', controller.getAllPayroll);
router.get('/payroll/:id', controller.getPayrollById);
router.post('/payroll', controller.createPayroll);
router.put('/payroll/:id', controller.updatePayroll);
router.delete('/payroll/:id', controller.deletePayroll);

module.exports = router;
