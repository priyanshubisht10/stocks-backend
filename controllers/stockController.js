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
    stock_img_url: req.body.stock_img_url,
    exchange: req.body.exchange,
  };

  console.log(stockData)

  if (
    !stockData.stock_symbol ||
    !stockData.company_name ||
    !stockData.company_description ||
    !stockData.current_price ||
    !stockData.opening_price ||
    !stockData.closing_price ||
    !stockData.exchange
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
    return next(new AppError('Please provide a stock symbol to fetch stock details.', 400));
  }

  console.log(`Fetching details for stock: ${stock_symbol}`);

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
      'current_price',
      'day_high',
      'day_low',
      'opening_price',
      'closing_price',
      'updated_at',
    ],
  });

  if (!stock) {
    return next(new AppError(`Stock with symbol '${stock_symbol}' not found.`, 404));
  }

  // Calculate price change percentage
  const priceChange = stock.current_price - stock.closing_price;
  const priceChangePercentage = ((priceChange / stock.closing_price) * 100).toFixed(2);

  res.status(200).json({
    status: 'success',
    data: {
      stock: {
        ...stock.toJSON(),
        price_change: priceChange.toFixed(2),
        price_change_percentage: `${priceChangePercentage}%`,
      },
    },
  });
});
