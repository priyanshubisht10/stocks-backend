//app.js
const express = require('express');

//Routes
const userrouter = require('./routes/userRoutes');
const stockRouter = require('./routes/stockRouter');
const orderRouter = require('./routes/orderRouter');

//Utils
const AppError = require('./utils/Apperror');

const app = express();
app.use(express.json());

//Routes
app.use('/api/v1/user', userrouter);
app.use('/api/v1/stock', stockRouter);
app.use('/api/v1/order', orderRouter);

app.all('*', (req, res, next) => {
   next(new AppError(`Could not find ${req.originalUrl} on this Server!`, 404));
});

module.exports = app;
