const stockModel = require('../models/stockModel');
const catchAsync = require('../utils/catchasync');
const AppError = require('../utils/Apperror');

exports.listNewStock = catchAsync(async (req, res, next) => {

   const {
      stock_symbol,
      company_name,
      company_description,
      current_price,
      opening_price,
      closing_price,
      day_high,
      day_low,
      market_cap,
      volume,
      sector,
      exchange,
   } = req.body;

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

   const newStock = await Stock.create({
      stock_symbol,
      company_name,
      company_description,
      current_price,
      opening_price,
      closing_price,
      day_high: day_high || current_price,
      day_low: day_low || current_price,
      market_cap: market_cap || null,
      volume: volume || 0,
      sector: sector || 'unspecified',
      exchange,
   });

   res.status(201).json({
      status: 'success',
      message: 'New stock created successfully.',
      data: {
         stock: newStock,
      },
   });
});


exports.getStockDetails = catchAsync(async (req, res, next) => {
   
})
