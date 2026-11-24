const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const StockLog = require('./models/StockLog');

const cats = [
    ['Learning Tablets', '📱'], ['STEM Toys', '🧩'], ['Educational Robots', '🤖'], ['Science Kits', '🔬'],
    ['Math Learning', '🔢'], ['Electronic Puzzles', '🧠'], ['Coding Toys', '💻'], ['Musical Toys', '🎹'], ['Interactive Books', '📚'],
];

// [name, category, price, mrp, ageGroup, rating, reviews, bestSeller, stock]
const prods = [
    ['Electronic Circuit Learning Kit (120+ Projects)', 'STEM Toys', 1599, 1999, '9-12', 4.5, 128, true, 40],
    ['Smart Learning Tablet for Kids (Preloaded)', 'Learning Tablets', 2199, 2599, '3-6', 4.4, 96, true, 25],
    ['Solar Power Science Kit for Kids', 'Science Kits', 1799, 2199, '9-12', 4.3, 74, true, 30],
    ['Robot Building Set (200+ Parts)', 'Educational Robots', 1499, 1799, '9-12', 4.6, 103, true, 35],
    ['Coding & Programming Robot', 'Coding Toys', 3299, 3999, '12+', 4.5, 65, true, 15],
    ['Kids Microscope Science Kit', 'Science Kits', 1199, 1499, '9-12', 4.4, 82, true, 50],
    ['Abacus Math Learning Board', 'Math Learning', 499, 699, '3-6', 4.2, 51, false, 60],
    ['Electronic Quiz Puzzle Board', 'Electronic Puzzles', 799, 999, '6-9', 4.1, 33, false, 45],
    ['Kids Electronic Piano Keyboard', 'Musical Toys', 1299, 1599, '3-6', 4.3, 60, false, 20],
    ['Talking Interactive Alphabet Book', 'Interactive Books', 649, 799, '0-3', 4.5, 88, false, 70],
    ['Baby Light & Sound Activity Tablet', 'Learning Tablets', 899, 1199, '0-3', 4.2, 40, false, 3],
    ['Magnetic STEM Building Blocks (100 pcs)', 'STEM Toys', 999, 1299, '3-6', 4.4, 70, false, 55],
    ['Voice Control Smart Robot', 'Educational Robots', 2499, 2999, '6-9', 4.3, 45, false, 18],
    ['Kids Coding Cards Game', 'Coding Toys', 699, 899, '6-9', 4.0, 29, false, 4],
];

const force = process.argv.includes('--force');

(async () => {
    // Lock 1: production mein kabhi nahi chalega
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ Production mein seed allowed nahi hai.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 });
    console.log(`Connected DB: ${mongoose.connection.name} (${mongoose.connection.host})`);

    // Lock 2: data pehle se hai to rok do (jab tak --force na ho)
    const [pCount, oCount, cCount] = await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        Category.countDocuments(),
    ]);

    if ((pCount > 0 || oCount > 0 || cCount > 0) && !force) {
        console.error(`❌ Database mein already data hai: ${cCount} categories, ${pCount} products, ${oCount} orders.`);
        console.error('Seed roka gaya. Sab delete karke dobara seed karna hai to: node seed.js --force');
        await mongoose.disconnect();
        process.exit(1);
    }

    if (force) console.warn('⚠️  --force diya gaya: categories, products, orders aur stock logs delete honge.');

    // Note: Users ko haath nahi lagaya jaata (admin aur customers safe rehte hain)
    await Promise.all([Category.deleteMany(), Product.deleteMany(), Order.deleteMany(), StockLog.deleteMany()]);

    const created = {};
    for (const [name, icon] of cats) created[name] = await Category.create({ name, icon });

    const img = (t) => `https://placehold.co/600x600/dbeafe/1e3a8a/png?text=${encodeURIComponent(t)}`;

    for (const [name, cat, price, mrp, ageGroup, rating, numReviews, isBestSeller, stock] of prods) {
        const p = await Product.create({
            name, category: created[cat]._id, price, mrp, ageGroup, rating, numReviews, isBestSeller, stock,
            isFeatured: isBestSeller,
            images: [img(name), img(cat)],
            tags: [cat.toLowerCase(), 'kids', 'educational'],
            description: `${name} — safe, non-toxic and age appropriate. Helps children learn through play and builds creativity, focus and problem solving skills.`,
        });
        await StockLog.create({ product: p._id, change: stock, reason: 'restock', note: 'Seed' });
    }

    console.log(`Seeded ✅  ${cats.length} categories, ${prods.length} products`);
    await mongoose.disconnect();
    process.exit(0);
})().catch(async (e) => {
    console.error('Seed fail:', e.message);
    await mongoose.disconnect().catch(() => { });
    process.exit(1);
});











// const dns = require('dns');
// dns.setServers(['8.8.8.8', '8.8.4.4']);

// require('dotenv').config();
// const mongoose = require('mongoose');
// const User = require('./models/User');
// const Category = require('./models/Category');
// const Product = require('./models/Product');
// const Order = require('./models/Order');
// const StockLog = require('./models/StockLog');

// const cats = [
//     ['Learning Tablets', '📱'], ['STEM Toys', '🧩'], ['Educational Robots', '🤖'], ['Science Kits', '🔬'],
//     ['Math Learning', '🔢'], ['Electronic Puzzles', '🧠'], ['Coding Toys', '💻'], ['Musical Toys', '🎹'], ['Interactive Books', '📚'],
// ];

// // [name, category, price, mrp, ageGroup, rating, reviews, bestSeller, stock]
// const prods = [
//     ['Electronic Circuit Learning Kit (120+ Projects)', 'STEM Toys', 1599, 1999, '9-12', 4.5, 128, true, 40],
//     ['Smart Learning Tablet for Kids (Preloaded)', 'Learning Tablets', 2199, 2599, '3-6', 4.4, 96, true, 25],
//     ['Solar Power Science Kit for Kids', 'Science Kits', 1799, 2199, '9-12', 4.3, 74, true, 30],
//     ['Robot Building Set (200+ Parts)', 'Educational Robots', 1499, 1799, '9-12', 4.6, 103, true, 35],
//     ['Coding & Programming Robot', 'Coding Toys', 3299, 3999, '12+', 4.5, 65, true, 15],
//     ['Kids Microscope Science Kit', 'Science Kits', 1199, 1499, '9-12', 4.4, 82, true, 50],
//     ['Abacus Math Learning Board', 'Math Learning', 499, 699, '3-6', 4.2, 51, false, 60],
//     ['Electronic Quiz Puzzle Board', 'Electronic Puzzles', 799, 999, '6-9', 4.1, 33, false, 45],
//     ['Kids Electronic Piano Keyboard', 'Musical Toys', 1299, 1599, '3-6', 4.3, 60, false, 20],
//     ['Talking Interactive Alphabet Book', 'Interactive Books', 649, 799, '0-3', 4.5, 88, false, 70],
//     ['Baby Light & Sound Activity Tablet', 'Learning Tablets', 899, 1199, '0-3', 4.2, 40, false, 3],
//     ['Magnetic STEM Building Blocks (100 pcs)', 'STEM Toys', 999, 1299, '3-6', 4.4, 70, false, 55],
//     ['Voice Control Smart Robot', 'Educational Robots', 2499, 2999, '6-9', 4.3, 45, false, 18],
//     ['Kids Coding Cards Game', 'Coding Toys', 699, 899, '6-9', 4.0, 29, false, 4],
// ];

// (async () => {
//     await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 });
//     await Promise.all([Category.deleteMany(), Product.deleteMany(), Order.deleteMany(), StockLog.deleteMany()]);

//     const created = {};
//     for (const [name, icon] of cats) created[name] = await Category.create({ name, icon });

//     for (const [name, cat, price, mrp, ageGroup, rating, numReviews, isBestSeller, stock] of prods) {
//         const img = (t) => `https://placehold.co/600x600/dbeafe/1e3a8a/png?text=${encodeURIComponent(t)}`;
//         const p = await Product.create({
//             name, category: created[cat]._id, price, mrp, ageGroup, rating, numReviews, isBestSeller, stock,
//             isFeatured: isBestSeller,
//             images: [img(name), img(cat)],
//             tags: [cat.toLowerCase(), 'kids', 'educational'],
//             description: `${name} — safe, non-toxic and age appropriate. Helps children learn through play and builds creativity, focus and problem solving skills.`,
//         });
//         await StockLog.create({ product: p._id, change: stock, reason: 'restock', note: 'Seed' });
//     }

//     await User.deleteOne({ email: 'admin@balothia.com' });
//     await User.create({ name: 'Admin', email: 'admin@balothia.com', password: 'Admin@123', role: 'admin' });
//     console.log('Seeded ✅  Admin → admin@balothia.com / Admin@123');
//     process.exit();
// })();