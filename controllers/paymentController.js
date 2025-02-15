const AppError = require('../utils/Apperror');
const catchasync = require('../utils/catchasync');
const Stripe = require('stripe');

const Payment = require('../services/db').Payment;
const DematAccount = require('../services/db').DematAccount;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchasync(async (req, res, next) => {
  const userId = req.user.id; // Corrected variable name
  const { amount } = req.body;

  if (!amount) {
    return next(new AppError('Please provide the amount', 402));
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: { name: 'Wallet Top-up' },
          unit_amount: amount * 100, // Convert to paisa
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `http://localhost:5137/success`, // This should work fine for frontend redirects
    cancel_url: `http://localhost:5137/cancel`,
    metadata: { userId: userId }, // Corrected `userId`
  });

  // Store the initial payment intent in the database
  const dematAccount = await DematAccount.findOne({
    where: { user_id: userId },
  });

  if (!dematAccount) {
    return next(new AppError('User does not have a linked Demat account', 404));
  }

  await Payment.create({
    user_id: userId,
    demat_account_id: dematAccount.account_id,
    stripe_payment_id: session.id,
    amount: amount,
    status: 'payment_intent.created',
  });

  res.status(200).json({
    status: 'success',
    url: session.url,
  });
});

exports.getBalance = catchasync(async (req, res, next) => {
  const user_id = req.user.id;

  // Find the demat account for the user
  const dematAccount = await DematAccount.findOne({ where: { user_id } });

  if (!dematAccount) {
    return res
      .status(404)
      .json({ success: false, message: 'Demat account not found for user' });
  }

  res.status(200).json({ success: true, balance: dematAccount.balance });
});

exports.getpaymentforuser = catchasync(async (req, res, next) => {
  // Get the authenticated user's ID
  const userId = req.user.id;

  // Retrieve all payment records for the user, ordering them by creation date (newest first)
  const payments = await Payment.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
  });

  // If no payments were found, you can choose to return an empty array or a message
  if (!payments) {
    return res
      .status(404)
      .json({ success: false, message: 'No payments found for this user' });
  }

  // Return the retrieved payment records in the response
  res.status(200).json({
    success: true,
    payments,
  });
});
