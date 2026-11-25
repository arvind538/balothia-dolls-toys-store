const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

connectDB();
// require('./utils/migrate').run().catch((e) => console.error('Migration error:', e.message));
const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
    method: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }, { message: "Server Successfully Run!." }));


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/home', require('./routes/homeRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running On PORT:${PORT}`)
});