const express = require('express');
const router = express.Router();
const controller = require('../controller/leaveController');

router.get('/leaves', controller.getAllLeaves);
router.get('/leaves/:id', controller.getLeaveById);
router.post('/leaves', controller.createLeave);
router.put('/leaves/:id', controller.updateLeave);
router.delete('/leaves/:id', controller.deleteLeave);

module.exports = router;
