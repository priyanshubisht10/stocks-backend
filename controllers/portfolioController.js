const db = require('../services/db');
const { Op } = require('sequelize');
const Order = db.Order;
const User = db.User;
const DematAccount = db.DematAccount;
const Transaction = db.Transaction;
// const Stock = db.Stock

const catchAsync = require('../utils/catchasync');
const getLatestMarketPrice = require('../utils/getMarketpricefromredis');
const AppError = require('../utils/Apperror');

exports.getPortfolioSummary = catchAsync(async (req, res, next) => {
  const userId = req.user.id; // Get the user ID from the authenticated user
  const user = await User.findOne({
    where: { id: userId },
    attributes: ['owned_stocks'],
  });

  if (!user) return next(new AppError('User not found', 404));

  let totalInvestment = 0;
  let totalPortfolioValue = 0;

  for (const stock of user.owned_stocks) {
    const marketPrice = await getLatestMarketPrice(stock.symbol);

    const buyOrder = await Order.findOne({
      where: { stock_symbol: stock.symbol, user: userId, order_type: 'buy' },
      attributes: ['price'],
    });

    const purchasePrice = buyOrder ? buyOrder.price : 0;
    const stockValue = stock.quantity * marketPrice;

    totalInvestment += stock.quantity * purchasePrice;
    totalPortfolioValue += stockValue;

    console.log(
      `for ${stock.symbol} with total investment as ${totalInvestment} and total portfolio (his hold ) as ${totalPortfolioValue}`
    );
  }

  const unrealizedPL = totalPortfolioValue - totalInvestment;
  const unrealizedPLPercent =
    totalInvestment === 0 ? 0 : (unrealizedPL / totalInvestment) * 100;

  res.status(200).json({
    totalPortfolioValue,
    totalInvestment,
    unrealizedPL,
    unrealizedPLPercent: unrealizedPLPercent.toFixed(2) + '%',
  });
});

exports.getStockHoldings = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findOne({
    where: { id: userId },
    attributes: ['owned_stocks'],
  });

  if (!user) throw new AppError('User not found', 404);

  let stockHoldings = [];

  for (const stock of user.owned_stocks) {
    const marketPrice = await getLatestMarketPrice(stock.symbol);

    const buyOrder = await Order.findOne({
      where: { stock_symbol: stock.symbol, user: userId, order_type: 'buy' },
      attributes: ['price'],
    });

    const purchasePrice = buyOrder ? buyOrder.price : 0;
    const totalValue = stock.quantity * marketPrice;
    const unrealizedPL = (marketPrice - purchasePrice) * stock.quantity;

    stockHoldings.push({
      stockSymbol: stock.symbol,
      quantity: stock.quantity,
      currentPrice: marketPrice,
      purchasePrice: purchasePrice,
      totalValue: totalValue,
      unrealizedPL: unrealizedPL,
    });
  }

  res.status(200).json(stockHoldings);
});

exports.getTradeHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const transactions = await Transaction.findAll({
    where: {
      [Op.or]: [{ buy_user_id: userId }, { sell_user_id: userId }],
    },
    order: [['created_at', 'DESC']],
    limit: 30,
  });

  let tradeHistory = transactions.map((transaction) => ({
    transactionId: transaction.transaction_id,
    transactionDate: transaction.created_at,
    stockSymbol: transaction.stock_symbol, // ✅ No need for Order model
    transactionType: transaction.type,
    quantity: transaction.quantity,
    price: transaction.price,
    fees: transaction.fees,
    totalValue: transaction.total_value,
  }));

  res.status(200).json(tradeHistory);
});
