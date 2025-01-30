const { Order } = require('../models');
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../utils/catchasync');
const AppError = require('../utils/Apperror');
const orderQueues = require('../services/orderQueue');

exports.placeOrder = catchAsync(async (req, res, next) => {
  const { stock_symbol, price, quantity, order_type, order_mode } = req.body;
  const user = req.user.id;

  if (!stock_symbol || !quantity || !order_type || !order_mode) {
    return next(new AppError('Missing required fields', 400));
  }

  if (
    !['buy', 'sell'].includes(order_type) ||
    !['market', 'limit'].includes(order_mode)
  ) {
    return next(new AppError('Invalid order_type or order_mode', 400));
  }

  if (order_mode === 'limit' && !price) {
    return next(new AppError('Price is required for limit orders', 400));
  }

  const newOrder = await Order.create({
    order_id: uuidv4(),
    stock_symbol,
    user,
    price: order_mode === 'market' ? null : price,
    quantity,
    order_type,
    order_mode,
    total_value: order_mode === 'market' ? null : price * quantity,
  });

  const orderData = {
    order_id: newOrder.order_id,
    stock_symbol: newOrder.stock_symbol,
    user: newOrder.user,
    price: newOrder.price,
    quantity: newOrder.quantity,
  };

  if (order_type === 'buy') {
    if (order_mode === 'market') {
      await orderQueues.addMarketBuyOrder(orderData);
      console.log('Adding to BUY MARKET queue:', orderData);
    } else {
      console.log('Adding to BUY LIMIT queue:', orderData);
    }
  } else if (order_type === 'sell') {
    if (order_mode === 'market') {
      await orderQueues.addMarketSellOrder(orderData);
      console.log('Adding to SELL MARKET queue:', orderData);
    } else {
      console.log('Adding to SELL LIMIT queue:', orderData);
    }
  }

  res
    .status(201)
    .json({ message: 'Order placed successfully', order: newOrder });
});
