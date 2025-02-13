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
