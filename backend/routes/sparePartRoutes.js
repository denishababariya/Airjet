const express = require('express');
const router = express.Router();
const controller = require('../controller/sparePartController');

router.get('/spare-parts', controller.getAllSpareParts);
router.get('/spare-parts/:id', controller.getSparePartById);
router.post('/spare-parts', controller.createSparePart);
router.put('/spare-parts/:id', controller.updateSparePart);
router.delete('/spare-parts/:id', controller.deleteSparePart);

module.exports = router;
