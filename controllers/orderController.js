const Order = require('../services/db').Order;
const User = require('../services/db').User;
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../utils/catchasync');
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

  //console.log(user)
  const userRecord = await User.findByPk(user);

  if (!userRecord) {
    return next(new AppError('User not found', 404));
  }

  let updatedOwnedStocks = userRecord.owned_stocks || [];

  // If it's a SELL order, check if user owns enough stock and update holdings
  if (order_type === 'sell') {
    const stockIndex = updatedOwnedStocks.findIndex(
      (stock) => stock.symbol === stock_symbol
    );

    if (
      stockIndex === -1 ||
      updatedOwnedStocks[stockIndex].quantity < quantity
    ) {
      return next(new AppError('Insufficient stock quantity to sell', 400));
    }

    // Subtract the sold quantity
    updatedOwnedStocks[stockIndex].quantity -= quantity;

    // Remove stock entry if quantity becomes zero
    if (updatedOwnedStocks[stockIndex].quantity === 0) {
      updatedOwnedStocks.splice(stockIndex, 1);
    }

    // Update the user's owned stocks in the database
    await User.update(
      { owned_stocks: updatedOwnedStocks },
      { where: { id: user } }
    );
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
  } else if (order_mode === 'limit') {
    // Handle limit order
    const redisSetKey = `limit-${order_type}-${stock_symbol}`; // e.g., "limit-buy-AAPL" or "limit-sell-AAPL"
    const orderData = {
      order_id: newOrder.order_id,
      stock_symbol: newOrder.stock_symbol,
      user: newOrder.user,
      price: parseFloat(newOrder.price), // Convert price to a number
      quantity: newOrder.quantity,
      timeStamp: newOrder.created_at.getTime(), // Convert timestamp to milliseconds
    };

    // Calculate the score based on priority: price > timestamp > quantity
    const score =
      orderData.price * 1e12 + orderData.timeStamp * 1e6 + orderData.quantity;

    // Add order to Redis Sorted Set
    await redis.zadd(redisSetKey, score, JSON.stringify(orderData));

    // Publish an event to trigger matching
    await redis.publish('order_added_limit', JSON.stringify({ stock_symbol }));
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
