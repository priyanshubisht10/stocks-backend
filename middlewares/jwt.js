const jwt = require('jsonwebtoken');

exports.signtoken = (id) => {
  console.log(process.env.JWT_EXPIRY);
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

exports.sendtoken = (id) => {
  const token = this.signtoken(id);

  return token;
};
