const catchAsync = require('../utils/catchasync');
const AppError = require('../utils/Apperror');
const Stock = require('../services/db').Stock;

exports.listNewStock = catchAsync(async (req, res, next) => {
  // console.log(req.body);

  const stockData = {
    stock_symbol: req.body.stock_symbol,
    company_name: req.body.company_name,
    company_description: req.body.company_description,
    current_price: req.body.current_price,
    opening_price: req.body.opening_price,
    closing_price: req.body.closing_price,
    day_high: req.body.day_high,
    day_low: req.body.day_low,
    market_cap: req.body.market_cap,
    volume: req.body.volume,
    sector: req.body.sector,
    exchange: req.body.exchange,
  };

  if (
    !stock_symbol ||
    !company_name ||
    !company_description ||
    !current_price ||
    !opening_price ||
    !closing_price ||
    !exchange
  ) {
    return next(new AppError('Please provide all required fields.', 400));
  }

  const newStock = await Stock.create(stockData);

  res.status(201).json({
    status: 'success',
    message: 'New stock created successfully.',
    data: {
      stock: newStock,
    },
  });
});

exports.getStockDetails = catchAsync(async (req, res, next) => {
  const { stock_symbol } = req.params;

  if (!stock_symbol) {
    return next(
      new AppError('Please provide a stock symbol to fetch stock details.')
    );
  }
  console.log(stock_symbol);
  const stock = await Stock.findOne({
    where: { stock_symbol },
    attributes: [
      'stock_symbol',
      'company_name',
      'company_description',
      'market_cap',
      'volume',
      'sector',
      'exchange',
    ],
  });

  if (!stock) {
    return next(`Stock with symbol '${stock_symbol}' not found.`, 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      stock,
    },
  });
});
