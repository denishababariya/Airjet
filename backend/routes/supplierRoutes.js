const express = require('express');
const router = express.Router();
const controller = require('../controller/supplierController');

router.get('/suppliers', controller.getAllSuppliers);
router.get('/suppliers/:id', controller.getSupplierById);
router.post('/suppliers', controller.createSupplier);
router.put('/suppliers/:id', controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);

module.exports = router;
