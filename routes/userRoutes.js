//userRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const requireAuth = require('../middlewares/requireAuth');

router.post('/register', authController.signup);
router.post('/login', authController.login);
router.post('/pan-verify', authController.verifypan);
router.get(
  '/',
  requireAuth.protect,
  requireAuth.restrictTo('admin'),
  userController.getUsers
);

module.exports = router;
