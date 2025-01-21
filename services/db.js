//db.js
const {Sequelize} = require('sequelize')
const dotenv = require('dotenv')
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'dbconfig.env') });

// console.log(process.env.DB_NAME)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,{
        host : 'localhost',
        port : '5433',
        dialect : 'postgres',
})

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//after creating models in models import them here too
db.User = require('../models/userModel')(sequelize,Sequelize)

module.exports = db;