const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

router.get('/:order_id', orderController.getOrderDetails);

module.exports = router;
