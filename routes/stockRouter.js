const express = require('express');
const router = express.Router();

const stockController = require('../controllers/stockController');


router.get('/:stock_symbol', stockController.getStockDetails);

router.get('/:stock_symbol', stockController.getStockDetails);

module.exports = router;
