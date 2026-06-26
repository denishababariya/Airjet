const express = require('express');
const router = express.Router();
const controller = require('../controller/designationController');

router.get('/designations', controller.getAllDesignations);
router.get('/designations/:id', controller.getDesignationById);
router.post('/designations', controller.createDesignation);
router.put('/designations/:id', controller.updateDesignation);
router.delete('/designations/:id', controller.deleteDesignation);

module.exports = router;
