const express = require('express');
const router = express.Router();

const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/requireAuth');

router.get('/data-points/:stock_symbol',
   // authMiddleware.protect,
   stockController.getStockDataPoints);

router.get('/:stock_symbol/', stockController.getStockDetails);

router.post('/list-new-stock/',
   // authMiddleware.protect,
   // authMiddleware.restrictTo('admin'),
   stockController.listNewStock);


module.exports = router;
