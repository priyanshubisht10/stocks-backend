const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../services/db').Payment;
const DematAccount = require('../services/db').DematAccount;
const catchAsync = require('../utils/catchasync');

exports.stripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;

  if (type === 'checkout.session.completed') {
    const session = data.object;
    const paymentIntentId = session.payment_intent; // This is available in the session object

    // Find the payment using the payment_intent.id
    const payment = await Payment.findOne({
      where: { stripe_payment_id: session.id },
    });

    if (!payment) {
      console.error('Payment record not found for:', session.id);
      return res.status(404).send('Payment  not found.');
    }

    // Update payment status to 'succeeded' after payment confirmation
    await payment.update({ status: 'payment_intent.succeeded' });

    // Find the user's wallet and update the balance
    const wallet = await DematAccount.findOne({
      where: { user_id: payment.user_id },
    });

    if (wallet) {
      // Update wallet balance
      await wallet.update({ balance: wallet.balance + payment.amount });
    }

    res.status(200).json({ received: true });
  } else {
    res.status(200).json({ received: true });
  }
});
