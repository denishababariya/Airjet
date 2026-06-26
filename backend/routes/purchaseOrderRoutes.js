const express = require('express');
const router = express.Router();
const controller = require('../controller/purchaseOrderController');

router.get('/purchase-orders', controller.getAllPurchaseOrders);
router.get('/purchase-orders/:id', controller.getPurchaseOrderById);
router.post('/purchase-orders', controller.createPurchaseOrder);
router.put('/purchase-orders/:id', controller.updatePurchaseOrder);
router.delete('/purchase-orders/:id', controller.deletePurchaseOrder);

module.exports = router;
