const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler, httpError } = require('../middleware/error');
const { deleteImages } = require('../utils/cloudinaryUpload');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const validImage = (v) => v === '' || /^https?:\/\//i.test(v);

// har category ke saath products ka count bhi
exports.list = asyncHandler(async (req, res) => {
    const [cats, counts] = await Promise.all([
        Category.find().sort({ createdAt: 1 }).lean(),
        Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json(cats.map((c) => ({ ...c, productCount: map[String(c._id)] || 0 })));
});

exports.create = asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const image = String(req.body.image || '').trim();
    if (name.length < 2) throw httpError(400, 'Category name kam se kam 2 letters ka ho');
    if (!validImage(image)) throw httpError(400, 'Image URL http ya https se shuru hona chahiye');
    if (await Category.exists({ name: new RegExp(`^${esc(name)}$`, 'i') })) throw httpError(409, 'Is naam ki category pehle se hai');

    const data = { name, image };
    if (req.body.icon) data.icon = req.body.icon;
    res.status(201).json(await Category.create(data));
});

exports.update = asyncHandler(async (req, res) => {
    const c = await Category.findById(req.params.id);
    if (!c) throw httpError(404, 'Category not found');

    const oldImage = c.image;
    if (req.body.name !== undefined) {
        const name = String(req.body.name).trim();
        if (name.length < 2) throw httpError(400, 'Category name kam se kam 2 letters ka ho');
        if (await Category.exists({ _id: { $ne: c._id }, name: new RegExp(`^${esc(name)}$`, 'i') })) {
            throw httpError(409, 'Is naam ki category pehle se hai');
        }
        c.name = name;
    }
    if (req.body.image !== undefined) {
        const image = String(req.body.image).trim();
        if (!validImage(image)) throw httpError(400, 'Image URL http ya https se shuru hona chahiye');
        c.image = image;
    }
    if (req.body.icon !== undefined && req.body.icon) c.icon = req.body.icon;

    await c.save();
    if (oldImage && oldImage !== c.image) deleteImages([oldImage]).catch(() => { }); // purani image Cloudinary se hatao
    res.json(c);
});

exports.remove = asyncHandler(async (req, res) => {
    const c = await Category.findById(req.params.id);
    if (!c) throw httpError(404, 'Category not found');
    const n = await Product.countDocuments({ category: c._id });
    if (n > 0) throw httpError(400, `Is category me ${n} products hain. Pehle unhe dusri category me move ya delete karo.`);
    await c.deleteOne();
    if (c.image) deleteImages([c.image]).catch(() => { });
    res.json({ message: 'Deleted' });
});