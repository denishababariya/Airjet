const express = require('express');
const router = express.Router();
const controller = require('../controller');

// User Routes
router.get('/users', controller.getAllUsers);
router.get('/users/:id', controller.getUserById);
router.post('/users', controller.createUser);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

// Health Check Route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = router;