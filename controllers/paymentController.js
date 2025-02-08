const AppError = require('../utils/Apperror');
const catchasync = require('../utils/catchasync');

const Payment = require('../services/db').Payment;
const DematAccount = require('../services/db').DematAccount;

exports.getCheckoutSession = catchasync(async (req, res, next) => {
 
  const user = req.user.id
  const { amount } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Wallet Top-up' },
                        unit_amount: amount * 100, // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:3000/cancel`,
            metadata: { userId },
        });


  res.status(200).json({
    status: 'success',
    url :  session.url,
  });
});
