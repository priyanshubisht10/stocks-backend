const { Worker, Queue } = require('bullmq');
const Redis = require('ioredis');
const redisConnection = require('../services/redis'); // Import existing Redis connection

// Initialize Redis clients
const redisPublisher = new Redis();
const redisClient = new Redis(); // Redis client for storing historical data

// Queue for final transaction processing
const finalTransactionQueue = new Queue('finalTransactionQueue', {
  connection: redisConnection,
});

// Store latest market prices
const marketPrices = {};
const highMarketPrices = {};
const lowMarketPrices = {};

// Function to fetch and initialize high/low prices from Redis based on trade history
const loadLatestPrices = async () => {
  console.log('🔄 Fetching latest stock prices and high/low from Redis history...');

  const stockSymbols = ['JAE', 'PB']; // Add all stock symbols here
  for (const symbol of stockSymbols) {
    const historyKey = `history:${symbol}`;
    const highLowKey = `dayStats:${symbol}`;

    // Fetch latest market price
    const latestEntry = await redisClient.zrevrange(historyKey, 0, 0);
    if (latestEntry.length > 0) {
      const latestData = JSON.parse(latestEntry[0]);
      marketPrices[symbol] = latestData.price;
      console.log(`✅ Loaded latest price for ${symbol}: ${latestData.price}`);
    } else {
      console.log(`⚠️ No history found for ${symbol}, using default price.`);
      marketPrices[symbol] = 100.0; // Default fallback price
    }

    // Fetch existing high/low/open/close values from Redis
    const storedStats = await redisClient.hgetall(highLowKey);
    highMarketPrices[symbol] = storedStats.day_high ? parseFloat(storedStats.day_high) : marketPrices[symbol];
    lowMarketPrices[symbol] = storedStats.day_low ? parseFloat(storedStats.day_low) : marketPrices[symbol];

    console.log(`📊 Initial High/Low for ${symbol}: High=${highMarketPrices[symbol]}, Low=${lowMarketPrices[symbol]}`);
  }
};

// **Run this before starting the worker**
loadLatestPrices().then(() => {
  console.log('🚀 Stock prices and history-based high/low loaded. Starting Worker...');
});

// Transaction Worker
const transactionWorker = new Worker(
  'transactionQueue',
  async (job) => {
    const transaction = job.data;
    const stockSymbol = transaction.stock_symbol;
    const transactionPrice = transaction.price;
    const historyKey = `history:${stockSymbol}`;
    const highLowKey = `dayStats:${stockSymbol}`;
    const timestamp = Date.now();

    // 📌 Get today's date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];

    // Fetch existing stats from Redis
    let storedStats = await redisClient.hgetall(highLowKey);
    let lastUpdated = storedStats.last_updated || ''; // Last updated date
    let openingPrice = storedStats.day_open ? parseFloat(storedStats.day_open) : null;
    let closingPrice = storedStats.day_close ? parseFloat(storedStats.day_close) : null;
    let prevDayOpen = storedStats.prev_day_open ? parseFloat(storedStats.prev_day_open) : null;
    let prevDayClose = storedStats.prev_day_close ? parseFloat(storedStats.prev_day_close) : null;

    // 📌 Reset stats at midnight and save yesterday's values
    if (lastUpdated !== currentDate) {
      console.log(`🔄 Resetting daily stats for ${stockSymbol}, new day detected.`);

      // Save yesterday’s opening and closing before resetting
      prevDayOpen = openingPrice;
      prevDayClose = closingPrice;

      openingPrice = null; // Reset opening price for today
      closingPrice = null; // Reset closing price for today
      highMarketPrices[stockSymbol] = transactionPrice;
      lowMarketPrices[stockSymbol] = transactionPrice;
    }

    // 📌 Update only if order is a LIMIT order
    if (transaction.type === 'limit') {
      // Validate price band for limit orders
      const currentMarketPrice = marketPrices[stockSymbol];
      const priceBand = 0.5; // 3% price band
      const upperLimit = currentMarketPrice * (1 + priceBand);
      const lowerLimit = currentMarketPrice * (1 - priceBand);

      if (transactionPrice > upperLimit || transactionPrice < lowerLimit) {
        console.log(`❌ Limit order price (${transactionPrice}) is outside the 3% price band for ${stockSymbol}. Rejecting order.`);
        transaction.status = 'rejected';
        await finalTransactionQueue.add('finalTransaction', transaction);
        return; // Reject the order
      }

      // Set the opening price only for the first limit order of the day
      if (openingPrice === null) {
        openingPrice = transactionPrice;
        console.log(`🌅 Opening price set for ${stockSymbol}: ${openingPrice}`);
      }

      // Update closing price on every limit trade
      closingPrice = transactionPrice;
      console.log(`🌇 Closing price updated for ${stockSymbol}: ${closingPrice}`);
    }

    if (transaction.type === 'market') {
      transaction.price = marketPrices[stockSymbol];
      transaction.status = 'passed';
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('📈 Updated Transaction:', transaction);
    } 
    else if (transaction.type === 'limit') {

      console.log("hit");
      // Update market price
      marketPrices[stockSymbol] = transactionPrice;
      transaction.status = 'passed';
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('📈 Updated Transaction:', transaction);

      // Determine updated high/low prices
      const newHigh = Math.max(highMarketPrices[stockSymbol] || transactionPrice, transactionPrice);
      const newLow = Math.min(lowMarketPrices[stockSymbol] || transactionPrice, transactionPrice);

      let highChanged = newHigh !== highMarketPrices[stockSymbol];
      let lowChanged = newLow !== lowMarketPrices[stockSymbol];

      // Update local storage
      highMarketPrices[stockSymbol] = newHigh;
      lowMarketPrices[stockSymbol] = newLow;

      // Store updated data in Redis history
      const stockUpdate = JSON.stringify({
        price: transactionPrice,
        timestamp,
        day_high: newHigh,
        day_low: newLow,
        day_open: openingPrice,
        day_close: closingPrice,
        prev_day_open: prevDayOpen,
        prev_day_close: prevDayClose,
      });

      await redisClient.zadd(historyKey, timestamp, stockUpdate);
      console.log(`📊 Stored in history:${stockSymbol} -> ${transactionPrice} at ${timestamp}`);

      // Update Redis if high/low changed or it's the first trade of the day
      if (highChanged || lowChanged || lastUpdated !== currentDate) {
        await redisClient.hset(
          highLowKey,
          'day_high', newHigh,
          'day_low', newLow,
          'day_open', openingPrice,
          'day_close', closingPrice,
          'prev_day_open', prevDayOpen,
          'prev_day_close', prevDayClose,
          'last_updated', currentDate
        );
        console.log(`📈 Updated Opening/Closing/High/Low in Redis for ${stockSymbol}: Open=${openingPrice}, Close=${closingPrice}, High=${newHigh}, Low=${newLow}`);
      }

      // Publish price update to stock channel
      const stockChannel = `stock:${stockSymbol}`;
      await redisPublisher.publish(stockChannel, stockUpdate);
      console.log(`📡 Published price update to ${stockChannel}:`, stockUpdate);
    } else {
      transaction.status = 'rejected';
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('❌ Error processing transaction at the exchange.');
    }
  },
  {
    connection: redisConnection,
  }
);