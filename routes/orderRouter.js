const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/requireAuth');

//router.get('/:order_id', orderController.getOrderDetails);
router.post(
  '/place-order/',
  authMiddleware.protect,
  //authMiddleware.restrictTo('user'),
  orderController.placeOrder
);

module.exports = router;
