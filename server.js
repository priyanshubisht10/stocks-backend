//server.js
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const db = require('./services/db');
const port = process.env.PORT;

db.sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

db.sequelize
  .sync({ force: false, alter: true })
  .then(() => {
    console.log('db is synced');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

const server = app.listen(port, 'localhost', () => {
  console.log(`Server running at`, port);
});
