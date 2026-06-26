const express = require('express');
const router = express.Router();
const controller = require('../controller/warehouseController');

router.get('/warehouses', controller.getAllWarehouses);
router.get('/warehouses/:id', controller.getWarehouseById);
router.post('/warehouses', controller.createWarehouse);
router.put('/warehouses/:id', controller.updateWarehouse);
router.delete('/warehouses/:id', controller.deleteWarehouse);

module.exports = router;
