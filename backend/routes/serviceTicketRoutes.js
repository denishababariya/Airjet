const express = require('express');
const router = express.Router();
const controller = require('../controller/serviceTicketController');

router.get('/service-tickets', controller.getAllServiceTickets);
router.get('/service-tickets/:id', controller.getServiceTicketById);
router.post('/service-tickets', controller.createServiceTicket);
router.put('/service-tickets/:id', controller.updateServiceTicket);
router.delete('/service-tickets/:id', controller.deleteServiceTicket);

module.exports = router;
