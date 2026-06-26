const express = require('express');
const router = express.Router();
const controller = require('../controller/attendanceController');

router.get('/attendance', controller.getAllAttendance);
router.get('/attendance/:id', controller.getAttendanceById);
router.post('/attendance', controller.createAttendance);
router.put('/attendance/:id', controller.updateAttendance);
router.delete('/attendance/:id', controller.deleteAttendance);

module.exports = router;
