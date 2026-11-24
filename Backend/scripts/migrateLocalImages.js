require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadBuffer } = require('../utils/cloudinaryUpload');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 });
    const products = await Product.find({ images: /\/uploads\/products\// });
    let moved = 0;

    for (const p of products) {
        const next = [];
        for (const url of p.images) {
            const m = url.match(/\/uploads\/products\/([^/?#]+)$/);
            if (!m) { next.push(url); continue; }
            const file = path.join(__dirname, '..', 'uploads', 'products', m[1]);
            if (!fs.existsSync(file)) { console.log('file nahi mili, skip:', file); next.push(url); continue; }
            const r = await uploadBuffer(fs.readFileSync(file));
            next.push(r.secure_url);
            moved++;
            console.log('uploaded:', m[1]);
        }
        p.images = next;
        await p.save();
    }
    console.log(`Done. ${moved} image(s) Cloudinary pe shift ho gayi`);
    process.exit();
})().catch((e) => { console.error(e.message); process.exit(1); });