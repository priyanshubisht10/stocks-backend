//app.js
const express = require('express');
const userrouter = require('./routes/userRoutes');
const app = express();
app.use(express.json());

app.use('/api/v1/user', userrouter);

module.exports = app;
