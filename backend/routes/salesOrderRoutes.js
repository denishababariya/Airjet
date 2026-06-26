const express = require('express');
const router = express.Router();
const controller = require('../controller/salesOrderController');

router.get('/sales-orders', controller.getAllSalesOrders);
router.get('/sales-orders/:id', controller.getSalesOrderById);
router.post('/sales-orders', controller.createSalesOrder);
router.put('/sales-orders/:id', controller.updateSalesOrder);
router.delete('/sales-orders/:id', controller.deleteSalesOrder);

module.exports = router;
