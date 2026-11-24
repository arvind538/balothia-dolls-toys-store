const StockLog = require('../models/StockLog');

exports.logStock = (product, change, reason, by, note) =>
    StockLog.create({ product, change, reason, by, note });