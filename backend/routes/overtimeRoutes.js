const express = require('express');
const router = express.Router();
const controller = require('../controller/overtimeController');

router.get('/overtime', controller.getAllOvertime);
router.get('/overtime/:id', controller.getOvertimeById);
router.post('/overtime', controller.createOvertime);
router.put('/overtime/:id', controller.updateOvertime);
router.delete('/overtime/:id', controller.deleteOvertime);

module.exports = router;
