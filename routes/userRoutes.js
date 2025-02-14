//userRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const portfolioController = require('../controllers/portfolioController');
const requireAuth = require('../middlewares/requireAuth');

router.post('/register', authController.signup);
router.post('/login', authController.login);
router.post('/pan-verify', authController.verifypan);

router.get('/profile', requireAuth.protect, userController.getUserProfile);

router.get('/portfolio/summary', requireAuth.protect,portfolioController.getPortfolioSummary);

// Stock Holdings
router.get('/portfolio/holdings', requireAuth.protect,portfolioController.getStockHoldings);

// Trade History
router.get('/portfolio/trade-history', requireAuth.protect,portfolioController.getTradeHistory);
router.post('/wishlist/add', requireAuth.protect, userController.addToWishlist);
router.get('/wishlist', requireAuth.protect, userController.getWishlist);

router.get(
  '/',
  requireAuth.protect,
  requireAuth.restrictTo('admin'),
  userController.getUsers
);

module.exports = router;
