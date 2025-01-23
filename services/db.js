//db.js
const { Sequelize } = require('sequelize');

console.log(process.env.DB_NAME);
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

// Import models
const UserModel = require('../models/userModel');
db.User = UserModel(sequelize, Sequelize);

console.log(UserModel);

module.exports = db;
