const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/requireAuth');
const webhookController = require('../controllers/webhookController');
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.stripeWebhook
);
module.exports = router;
