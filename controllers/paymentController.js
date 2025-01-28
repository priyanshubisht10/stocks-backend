const AppError = require("../utils/Apperror");
const catchasync = require("../utils/catchasync");

const Payment = require('../services/db').Payment;
const DematAccount = require('../services/db').DematAccount;

exports.getCheckoutSession = catchasync(async (req, res, next) => {
   console.log(req.body);
   console.log("Fake payement sessoion");

   res.status(200).json({
      status: 'success',
      checkout_session: "Fake Checkout Session",
   })
})