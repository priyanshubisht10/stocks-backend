//app.js
const express = require('express');
const cors = require('cors')
//Routes
const userrouter = require('./routes/userRoutes');
const stockRouter = require('./routes/stockRouter');
const orderRouter = require('./routes/orderRouter');
const webhookRouter = require('./routes/webhookRouter');
const paymentRouter = require('./routes/paymentRouter');

//Utils
const AppError = require('./utils/Apperror');

const app = express();
app.use(cors())

app.use('/api/v1/webhooks', webhookRouter);
//Routes
app.use(express.json());
app.use('/api/v1/user', userrouter);
app.use('/api/v1/stock', stockRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/payment', paymentRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Could not find ${req.originalUrl} on this Server!`, 404));
});

module.exports = app;
