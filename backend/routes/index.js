const express = require('express');
const router = express.Router();
const controller = require('../controller');


// user route
router.get

// Health Check Route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = router;