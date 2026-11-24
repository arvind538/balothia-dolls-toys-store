const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        console.error('.env mein ADMIN_EMAIL aur ADMIN_PASSWORD daalo');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 });

    // Pehle se jo admin hai usse dhoondo (email badalne par bhi wahi admin update hoga)
    let admin = await User.findOne({ role: 'admin' }).select('+password');

    if (admin) {
        admin.email = email;
        admin.password = password; // pre-save hook hash karega
        await admin.save();
        console.log('Admin update ho gaya:', email);
    } else {
        await User.create({ name: 'Admin', email, password, role: 'admin' });
        console.log('Admin ban gaya:', email);
    }
    process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });