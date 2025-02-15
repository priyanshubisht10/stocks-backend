const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/requireAuth');
const paymentController = require('../controllers/paymentController');


router.post(
  '/payment_intent',
  authMiddleware.protect,
  paymentController.getCheckoutSession
);

router.get('/history',authMiddleware.protect,paymentController.getpaymentforuser)
router.get('/',authMiddleware.protect,paymentController.getBalance)
module.exports = router;
