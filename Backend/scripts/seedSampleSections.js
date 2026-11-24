require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const HomeSection = require('../models/HomeSection');

const placeholder = (text) =>
    `https://placehold.co/600x600/fee2e2/991b1b/png?text=${encodeURIComponent(text)}`;

// [product name, selling price, MRP]
const DATA = [
    {
        name: 'Baby Gears & Nursery',
        icon: '🍼',
        products: [
            ['Kids Portable Folding Chair', 837, 1299],
            ['Kids Storage Organizer Pod', 2565, 3330],
            ['Baby Comforter Blanket (Safari)', 1261, 1593],
            ['3-in-1 Multi-Functional Kids Chair', 998, 1395],
        ],
    },
    {
        name: 'Baby Care & Essentials',
        icon: '🧴',
        products: [
            ['Soft Baby Diapers (Size M)', 799, 899],
            ['Baby Towel Set with Hood (Pack of 3)', 649, 799],
            ['Baby Face & Body Wash Foam', 981, 1090],
            ['Water-Filled Baby Teether', 129, 130],
        ],
    },
];

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 });

    for (const group of DATA) {
        let category = await Category.findOne({ name: group.name });
        if (!category) category = await Category.create({ name: group.name, icon: group.icon });

        let added = 0;
        for (const [name, price, mrp] of group.products) {
            if (await Product.exists({ name, category: category._id })) continue;
            await Product.create({
                name,
                category: category._id,
                price,
                mrp,
                ageGroup: '0-3',
                stock: 25,
                rating: 4.3,
                numReviews: 0,
                images: [placeholder(name)],
                description: `${name}. Sample product: please replace the details and image from the admin panel.`,
            });
            added++;
        }

        if (!(await HomeSection.exists({ source: 'category', category: category._id }))) {
            const last = await HomeSection.findOne().sort({ order: -1 }).select('order');
            await HomeSection.create({
                title: group.name,
                source: 'category',
                category: category._id,
                limit: 4,
                order: (last?.order || 0) + 1,
            });
        }
        console.log(`${group.name}: ${added} product(s) added`);
    }

    console.log('Done. Open the home page to see the new sections.');
    process.exit();
})().catch((e) => {
    console.error(e.message);
    process.exit(1);
});