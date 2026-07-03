const express = require('express');
const router = express.Router();
const controller = require('../controller');

// Health Check Route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Department Routes
router.post('/departments', controller.createDepart);
router.get('/departments', async (req, res) => {
  const Department = require('../model/Depart.model');
  try {
    const departments = await Department.find().populate('head');
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Designation Routes
router.post('/designations', async (req, res) => {
  const Designation = require('../model/Designation.model');
  try {
    const designation = await Designation.create(req.body);
    res.status(201).json(designation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/designations', async (req, res) => {
  const Designation = require('../model/Designation.model');
  try {
    const designations = await Designation.find().populate('department');
    res.status(200).json(designations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee Routes
router.post('/employees', controller.createEmployee);
router.get('/employees', controller.getAllEmployees);
router.get('/employees/:id', controller.getEmployeeById);

// User Routes
router.post('/users', controller.createUser);
router.post('/users/login', controller.loginUser);
router.post('/users/check-role', controller.checkRoleForReset);
router.post('/users/verify-otp', controller.verifyOtp);
router.get('/users', async (req, res) => {
  const User = require('../model/User.model');
  try {
    const users = await User.find().populate('employeeId');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;