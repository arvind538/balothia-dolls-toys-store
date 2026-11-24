const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler, httpError } = require('../middleware/error');
const { logStock } = require('../utils/stock');
const { deleteImages } = require('../utils/cloudinaryUpload');

const FIELDS = ['name', 'description', 'category', 'ageGroup', 'price', 'mrp', 'images', 'stock', 'rating', 'numReviews', 'tags', 'isFeatured', 'isBestSeller', 'isActive'];
const pick = (b) => Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sorts = {
    newest: { createdAt: -1 },
    popular: { sold: -1 },
    rating: { rating: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
};

// GET /api/products?category=slug1,slug2&ageGroup=3-6,6-9&minPrice&maxPrice&rating&search&sort&page&limit&inStock&offers&bestSeller&featured
exports.getProducts = asyncHandler(async (req, res) => {
    const { category, ageGroup, minPrice, maxPrice, rating, search, sort = 'newest', page = 1, limit = 12, inStock, offers, bestSeller, featured } = req.query;
    const q = { isActive: true };

    if (category) {
        const cats = await Category.find({ slug: { $in: category.split(',') } }).select('_id');
        q.category = { $in: cats.map((c) => c._id) };
    }
    if (ageGroup) q.ageGroup = { $in: ageGroup.split(',') };
    if (minPrice || maxPrice) {
        q.price = {};
        if (minPrice) q.price.$gte = Number(minPrice);
        if (maxPrice) q.price.$lte = Number(maxPrice);
    }
    if (rating) q.rating = { $gte: Number(rating) };
    if (inStock === 'true') q.stock = { $gt: 0 };
    if (offers === 'true') q.$expr = { $lt: ['$price', '$mrp'] };
    if (bestSeller === 'true') q.isBestSeller = true;
    if (featured === 'true') q.isFeatured = true;
    if (search) {
        const r = { $regex: esc(search), $options: 'i' };
        q.$or = [{ name: r }, { tags: r }, { description: r }];
    }

    const lim = Math.min(Number(limit) || 12, 100);
    const pg = Math.max(Number(page) || 1, 1);
    const [items, total] = await Promise.all([
        Product.find(q).populate('category', 'name slug').sort(sorts[sort] || sorts.newest).skip((pg - 1) * lim).limit(lim),
        Product.countDocuments(q),
    ]);
    res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
});

exports.getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('category', 'name slug');
    if (!product) throw httpError(404, 'Product not found');
    const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true }).limit(6);
    res.json({ product, related });
});

exports.createProduct = asyncHandler(async (req, res) => {
    const p = await Product.create(pick(req.body));
    if (p.stock > 0) await logStock(p._id, p.stock, 'restock', req.user._id, 'Initial stock');
    res.status(201).json(p);
});

exports.updateProduct = asyncHandler(async (req, res) => {
    const p = await Product.findById(req.params.id);
    if (!p) throw httpError(404, 'Product not found');

    const oldStock = p.stock;
    const oldImages = [...p.images];

    Object.assign(p, pick(req.body));
    await p.save();

    if (p.stock !== oldStock) {
        await logStock(p._id, p.stock - oldStock, p.stock > oldStock ? 'restock' : 'adjust', req.user._id);
    }

    // jo images form se hata di, wo Cloudinary se bhi delete
    const removed = oldImages.filter((u) => !p.images.includes(u));
    if (removed.length) deleteImages(removed).catch(() => { });

    res.json(p);
});

exports.deleteProduct = asyncHandler(async (req, res) => {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (p?.images?.length) deleteImages(p.images).catch(() => { });
    res.json({ message: 'Deleted' });
});