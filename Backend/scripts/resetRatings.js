require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 });
    const result = await Product.updateMany({}, { $set: { rating: 0, numReviews: 0 } });
    console.log(`Ratings cleared on ${result.modifiedCount} product(s). Set the real ratings from the admin panel.`);
    process.exit();
})().catch((e) => {
    console.error(e.message);
    process.exit(1);
});