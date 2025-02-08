//requireAuth.js
const db = require('../services/db');
const catchasync = require('../utils/catchasync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/Apperror');
const { promisify } = require('util');
const User = db.User;

exports.protect = catchasync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in!'), 401);
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //All attributes are selected since we may have to handle schema changes
  const currentuser = await User.findOne({
    where: { id: decoded.id },
    // attributes: [
    //   'id',
    //   'email',
    //   'role',
    //   'username',
    //   'full_name',
    //   'wishlist',
    // ],
  });

  if (!currentuser) {
    return next(
      new AppError('User may have been deleted or do not exist', 401)
    );
  }
  req.user = currentuser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('U dont have access to this route', 403));
    }
    next();
  };
};
