const catchAsync = require('../utils/catchasync');
const AppError = require('../utils/Apperror');
const Stock = require('../services/db').Stock;
const getLatestMarketPrice = require('../utils/getMarketpricefromredis');
const redisClient = require('../services/redis')

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

  // ✅ Fetch latest current price from Redis (or fallback to DB)
  const currentPrice = await getLatestMarketPrice(stock_symbol);

  // ✅ Fetch previous day's opening and closing price from Redis
  const redisKey = `dayStats:${stock_symbol}`;
  const stockData = await redisClient.hgetall(redisKey);

  let prevDayOpen = stockData.prev_day_open ? parseFloat(stockData.prev_day_open) : null;
  let prevDayClose = stockData.prev_day_close ? parseFloat(stockData.prev_day_close) : null;

  if (prevDayOpen !== null && prevDayClose !== null) {
    console.log(`Prev day open & close fetched from Redis for ${stock_symbol}`);
  }

  // ✅ Fetch from DB if Redis does not have prev_day_open/close
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
      'opening_price',
      'closing_price',
      'stock_img_url',
      'updated_at',
    ],
  });

  if (!stock) {
    return next(new AppError(`Stock with symbol '${stock_symbol}' not found.`, 404));
  }

  if (!prevDayOpen) {
    prevDayOpen = stock.opening_price;
    console.log(`Prev day open fetched from DB for ${stock_symbol}`);
  }
  if (!prevDayClose) {
    prevDayClose = stock.closing_price;
    console.log(`Prev day close fetched from DB for ${stock_symbol}`);
  }

  // ✅ Calculate price change percentage
  const priceChange = currentPrice - prevDayClose;
  const priceChangePercentage = ((priceChange / prevDayClose) * 100).toFixed(2);

  res.status(200).json({
    status: 'success',
    data: {
      stock: {
        stock_symbol: stock.stock_symbol,
        company_name: stock.company_name,
        company_description: stock.company_description,
        market_cap: stock.market_cap,
        volume: stock.volume,
        sector: stock.sector,
        exchange: stock.exchange,
        stock_img_url:stock.stock_img_url,
        current_price: currentPrice,
        prev_day_open: prevDayOpen, // ✅ Corrected opening price
        prev_day_close: prevDayClose, // ✅ Corrected closing price
        updated_at: stock.updated_at,
        price_change: priceChange.toFixed(2),
        price_change_percentage: `${priceChangePercentage}%`,
      },
    },
  });
});

exports.getStockDataPoints = catchAsync(async (req, res, next) => {
  const stockSymbol = req.params.stock_symbol;
  console.log(stockSymbol);


  if (!stockSymbol) {
    return res.status(400).json({
      status: 'error',
      message: 'Stock symbol is required',
    });
  }
  const historyKey = `history:${stockSymbol}`;

  const last30DataPoints = await redisClient.zrange(historyKey, -30, -1, 'WITHSCORES');

  if (!last30DataPoints || last30DataPoints.length === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'No data found for the specified stock symbol',
    });
  }

  const parsedData = [];
  for (let i = 0; i < last30DataPoints.length; i += 2) {
    const priceData = JSON.parse(last30DataPoints[i]); // Parse the stock update object
    const timestamp = last30DataPoints[i + 1]; // Get the timestamp (score)
    parsedData.push({
      timestamp: new Date(parseInt(timestamp)).toLocaleString(), // Convert timestamp to a readable format
      price: priceData.price, // Extract the price
      day_high: priceData.day_high,
      day_low: priceData.day_low,
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      stockSymbol,
      history: parsedData,
    },
  });
});

exports.getAllstocks = catchAsync(async (req, res, next) => {
  // Retrieve stocks with only the required attributes
  const stocks = await Stock.findAll({
    attributes: ['stock_symbol','stock_img_url' ,'company_name', 'current_price', 'closing_price']
  });

  // Map over the retrieved stocks to calculate price change percentage
  const stocksData = stocks.map(stock => {
    const { stock_symbol,stock_img_url, company_name, current_price, closing_price } = stock;
    // Calculate the price change percentage. If prev_day_closing is zero, set change to 0.
    let price_change_percentage = 0;
    if (closing_price !== 0) {
      price_change_percentage = ((current_price - closing_price) / closing_price) * 100;
    }

    return {
      stock_img_url,
      stock_symbol,
      company_name,
      current_price,
      price_change_percentage: Number(price_change_percentage.toFixed(2)) // rounding to 2 decimals
    };
  });

  // Send the processed data as a JSON response
  res.status(200).json({
    status: "success",
    data: stocksData
  });
});

