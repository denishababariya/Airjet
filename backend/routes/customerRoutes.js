const express = require('express');
const router = express.Router();
const controller = require('../controller/customerController');

router.get('/customers', controller.getAllCustomers);
router.get('/customers/:id', controller.getCustomerById);
router.post('/customers', controller.createCustomer);
router.put('/customers/:id', controller.updateCustomer);
router.delete('/customers/:id', controller.deleteCustomer);

module.exports = router;
