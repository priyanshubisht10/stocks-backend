//userController.js
const db = require('../services/db');
const AppError = require('../utils/Apperror');
const catchasync = require('../utils/catchasync');
const User = db.User;

exports.getUsers = catchasync(async (req, res, next) => {
  const users = await User.findOne({ where: { id: req.user.id } });
  res.status(200).json({
    data: users,
  });
});

exports.getUserProfile = catchasync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: {
      exclude: ['password'], // Exclude password from the response
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getWishlist = catchasync(async (req, res, next) => {
  const userId = req.user.id; // Get authenticated user ID

  const user = await User.findOne({ where: { id: userId } });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  let wishlist = user.wishlist ? user.wishlist.split(',') : [];

  res.status(200).json({
    status: 'success',
    wishlist: wishlist,
  });
});



exports.addToWishlist = catchasync(async (req, res, next) => {
  const userId = req.user.id; // Get authenticated user ID
  const { stockSymbol } = req.body; // Get stock symbol from request body

  if (!stockSymbol || typeof stockSymbol !== 'string') {
    return next(new AppError('Stock symbol is required and must be a string.', 400));
  }

  const user = await User.findOne({ where: { id: userId } });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  let wishlist = user.wishlist ? user.wishlist.split(',') : [];

  // Check if stock is already in the wishlist
  if (wishlist.includes(stockSymbol)) {
    return next(new AppError('Stock is already in the wishlist.', 400));
  }

  // Ensure wishlist does not exceed 10 items
  if (wishlist.length >= 10) {
    return next(new AppError('Wishlist can contain up to 10 stock symbols only.', 400));
  }

  // Add stock to wishlist
  wishlist.push(stockSymbol);
  user.wishlist = wishlist.join(',');

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Stock added to wishlist successfully!',
    wishlist: wishlist,
  });
});

