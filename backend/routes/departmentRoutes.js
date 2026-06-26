const express = require('express');
const router = express.Router();
const controller = require('../controller/departmentController');

router.get('/departments', controller.getAllDepartments);
router.get('/departments/:id', controller.getDepartmentById);
router.post('/departments', controller.createDepartment);
router.put('/departments/:id', controller.updateDepartment);
router.delete('/departments/:id', controller.deleteDepartment);

module.exports = router;
