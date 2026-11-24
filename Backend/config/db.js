const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI missing in .env');
        process.exit(1);
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            family: 4, // IPv4 force
        });
        console.log(`MongoDB  Successfully Connected!`);
    } catch (err) {
        console.error('MongoDB connection failed!');
        process.exit(1);
    }
};

module.exports = connectDB;