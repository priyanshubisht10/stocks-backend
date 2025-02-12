const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/requireAuth');
const paymentController = require('../controllers/paymentController');
router.post(
  '/payment_intent',
  authMiddleware.protect,
  paymentController.getCheckoutSession
);
module.exports = router;
