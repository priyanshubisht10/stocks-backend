//db.js
const { Sequelize } = require('sequelize');

// Import models
const UserModel = require('../models/userModel');
const StockModel = require('../models/stockModel');
const DematAccountModel = require('../models/dematModel');
const PaymentModel = require('../models/paymentModel');
const OrderModel = require('../models/orderModel');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: 'localhost',
    port: process.env.DB_HOST,
    dialect: 'postgres',
  }
);

const db = {
  Sequelize,
  sequelize,
};

db.User = UserModel(sequelize, Sequelize);
db.Stock = StockModel(sequelize, Sequelize);
db.DematAccount = DematAccountModel(sequelize, Sequelize);
db.Payment = PaymentModel(sequelize, Sequelize);
db.Order = OrderModel(sequelize, Sequelize);

module.exports = db;
