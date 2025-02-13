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
    success_url: `http://localhost:5137/success?session_id={CHECKOUT_SESSION_ID}`, // This should work fine for frontend redirects
    cancel_url: `http://localhost:5137/cancel`,
    metadata: { userId: userId}, // Corrected `userId`
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
