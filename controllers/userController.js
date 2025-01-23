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
