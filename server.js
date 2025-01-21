//server.js
const app = require('./app')
const db = require('./services/db')
const dotenv = require('dotenv')
dotenv.config({path : './config.env'})
const port = process.env.PORT

db.sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((err) => {
    console.error('Unable to connect to the database:', err);
});

db.sequelize.sync({force : false}).then(()=>{
    console.log('db is synced')
}).catch(()=>{
    console.error('Error syncing database:', err);
})

const server = app.listen(port,'localhost',()=>{
    console.log(`Server is running at ${port}`)
})