const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
   const Stock = sequelize.define('Stock', {
      stock_symbol: {
         type: DataTypes.STRING, // Unique ticker symbol for the stock (e.g., AAPL, TSLA)
         allowNull: false,
         unique: true,
      },
      company_name: {
         type: DataTypes.STRING, // Full name of the company (e.g., Apple Inc.)
         allowNull: false,
      },
      company_description: {
         type: DataTypes.STRING, // Full name of the company (e.g., Apple Inc.)
         allowNull: false,
      },
      current_price: {
         type: DataTypes.DECIMAL(15, 2), // Current stock price
         allowNull: false,
      },
      day_high: {
         type: DataTypes.DECIMAL(15, 2), // Highest price of the day
         allowNull: false,
         defaultValue: 0.00,
      },
      day_low: {
         type: DataTypes.DECIMAL(15, 2), // Lowest price of the day
         allowNull: false,
         defaultValue: 0.00,
      },
      opening_price: {
         type: DataTypes.DECIMAL(15, 2), // Opening price of the day
         allowNull: false,
      },
      closing_price: {
         type: DataTypes.DECIMAL(15, 2), // Closing price of the previous day
         allowNull: false,
      },
      market_cap: {
         type: DataTypes.BIGINT, // Market capitalization of the company
         allowNull: true,
      },
      volume: {
         type: DataTypes.BIGINT, // Number of shares traded during the day
         allowNull: false,
         defaultValue: 0,
      },
      sector: {
         type: DataTypes.STRING, // Industry sector of the company (e.g., Technology, Healthcare)
         allowNull: true,
      },
      exchange: {
         type: DataTypes.STRING, // Stock exchange (e.g., NASDAQ, NYSE)
         allowNull: false,
      },
      updated_at: {
         type: DataTypes.DATE, // Last time the stock information was updated
         allowNull: false,
         defaultValue: DataTypes.NOW,
      },
   });

   return Stock;
};
