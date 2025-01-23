const db = require('../services/db');
const bcrypt = require('bcrypt');
const catchasync = require('../utils/catchasync');
const User = db.User;
const jwt = require('../middlewares/jwt');
const panverify = require('../services/panVerification');

const cookieopt = {
  //2d
  maxAge: 2 * 24 * 60 * 60 * 10000,
  httpOnly: true,
};

exports.login = catchasync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  const passwordcheck = await bcrypt.compare(password, user.password);
  if (!passwordcheck) {
    return next(new AppError('Invalid email or password', 401));
  }

  const authtoken = jwt.sendtoken(user.id);
  res.cookie('jwt', authtoken, cookieopt);

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      token: authtoken,
      email: user.email,
      username: user.username,
    },
  });
});

exports.signup = catchasync(async (req, res, next) => {
  const userdata = {
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    full_name: req.body.full_name,
    phone_number: req.body.phone_number,
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    streetName: req.body.streetName,
    zip: req.body.zip,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    pan_number: req.body.pan_number,
  };

  if (!email || !username || !password || !full_name) {
    return next(
      new AppError('Email, username, password, and full name are required', 400)
    );
  }

  const existingUser = await User.findOne({ where: { email: userdata.email } });
  if (existingUser) {
    return next(new AppError('An account with this email already exists', 400));
  }

  const newUser = await User.create(userdata);

  const authtoken = jwt.sendtoken(newUser.id);
  res.cookie('jwt', authtoken, cookieopt);

  //add mail queue here

  res.status(201).json({
    message: 'signup successfull',
    data: {
      user: newUser.username,
      token: authtoken,
      email: newUser.email,
      id: newUser.id,
    },
  });
});

exports.verifypan = catchasync(async (req, res, next) => {
  const pan_number = req.body.pan_number;
  //const pandetails = await panverify('COZPJ0074E');

  if (!pan_number) {
    return next(new AppError('PAN number is required', 400));
  }

  const pandetails = await panverify(pan_number);

  res.status(200).json({
    status: 'success',
    data: pandetails,
  });
});
