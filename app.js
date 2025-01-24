//app.js
const express = require('express');

const userrouter = require('./routes/userRoutes');
const stockRouter = require('./routes/stockRouter');

const app = express();
app.use(express.json());

app.use('/api/v1/user', userrouter);
app.use('/api/v1/stock', stockRouter);

module.exports = app;
