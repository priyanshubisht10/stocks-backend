
const db = require('../services/db'); // Import your database models
const redisClient = require('../services/redis')
const getLatestMarketPrice = async (stockSymbol) => {
  const historyKey = `history:${stockSymbol}`;
  const latestEntry = await redisClient.zrevrange(historyKey, 0, 0);

  if (latestEntry.length) {
    const latestPriceData = JSON.parse(latestEntry[0]);
    return latestPriceData.price;
  }

  // If no price is in Redis, get the initial price from the Stock model
  console.warn(`⚠️ No market price found in Redis for ${stockSymbol}, checking DB...`);
  const stock = await db.Stock.findOne({
    where: { stock_symbol: stockSymbol },
    attributes: ['current_price'], // Assuming you have a column for this
  });

  if (!stock || !stock.current_price) {
    throw new AppError(`Market price unavailable for ${stockSymbol}. The stock might not be listed yet.`, 500);
  }

  return stock.current_price;
};

module.exports = getLatestMarketPrice;
