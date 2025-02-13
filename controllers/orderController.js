const Order = require('../services/db').Order;
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../utils/catchasync');
const addJobToQueue = require('../services/queue');
const redis = require('../services/redis');
const AppError = require('../utils/Apperror');

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

  if (order_mode === 'market') {
    const redisListKey = `market-${order_type}-${stock_symbol}`;
    const orderData = {
      order_id: newOrder.order_id,
      stock_symbol: newOrder.stock_symbol,
      user: newOrder.user,
      price: newOrder.price,
      quantity: newOrder.quantity,
    };

    await redis.rpush(redisListKey, JSON.stringify(orderData)); // Push order to Redis list

    await redis.publish('order_added', JSON.stringify({ stock_symbol }));
    // console.log(`Published event for new order: ${stock_symbol}`);
  }

  res.status(201).json({
    message: 'Order placed successfully',
    order: newOrder,
  });
});

exports.getOrderofUser = catchAsync(async (req, res, next) => {
  const userid = req.user.id;
  const status = req.params.status;
  const orders = await Order.findAll({
    where: {
      user: userid,
      status: status,
    },
  });

  res.status(200).json({
    success: true,
    data: orders,
  });
});
