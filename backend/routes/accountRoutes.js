const express = require('express');
const router = express.Router();
const controller = require('../controller/accountController');

router.get('/accounts', controller.getAllAccounts);
router.get('/accounts/:id', controller.getAccountById);
router.post('/accounts', controller.createAccount);
router.put('/accounts/:id', controller.updateAccount);
router.delete('/accounts/:id', controller.deleteAccount);

module.exports = router;
