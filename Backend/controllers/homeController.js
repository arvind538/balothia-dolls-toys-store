const mongoose = require('mongoose');
const HomeSection = require('../models/HomeSection');
const Product = require('../models/Product');
const { asyncHandler, httpError } = require('../middleware/error');

const SOURCES = ['category', 'ageGroup', 'bestSeller', 'featured', 'newest', 'offers'];
const AGES = ['0-3', '3-6', '6-9', '9-12', '12+'];

const catId = (s) => (s.category && s.category._id) || s.category;

// Builds the product filter for a section.
const filterFor = (s) => {
    const q = { isActive: true };
    switch (s.source) {
        case 'category':
            if (catId(s)) q.category = catId(s);
            else q._id = { $in: [] }; // the category was deleted, so match nothing
            break;
        case 'ageGroup':
            q.ageGroup = s.ageGroup;
            break;
        case 'bestSeller':
            q.isBestSeller = true;
            break;
        case 'featured':
            q.isFeatured = true;
            break;
        case 'offers':
            q.$expr = { $lt: ['$price', '$mrp'] };
            break;
        default:
            break;
    }
    return q;
};

const sortFor = (s) => (s.source === 'bestSeller' ? { sold: -1, createdAt: -1 } : { createdAt: -1 });

// The "View all" link for a section.
const hrefFor = (s) => {
    switch (s.source) {
        case 'category':
            return s.category?.slug ? `/products?category=${s.category.slug}` : '/products';
        case 'ageGroup':
            return `/products?ageGroup=${encodeURIComponent(s.ageGroup)}`;
        case 'bestSeller':
            return '/products?bestSeller=true&sort=popular';
        case 'featured':
            return '/products?featured=true';
        case 'offers':
            return '/products?offers=true';
        default:
            return '/products?sort=newest';
    }
};

// Validates and cleans the data sent from the admin form.
const clean = (b) => {
    const title = String(b.title || '').trim();
    if (title.length < 2) throw httpError(400, 'The title must be at least 2 characters long');
    if (!SOURCES.includes(b.source)) throw httpError(400, 'Please choose a valid source');

    const data = {
        title,
        source: b.source,
        limit: Math.min(12, Math.max(1, parseInt(b.limit, 10) || 4)),
        category: undefined,
        ageGroup: undefined,
    };
    if (b.source === 'category') {
        if (!mongoose.isValidObjectId(b.category)) throw httpError(400, 'Please choose a category');
        data.category = b.category;
    }
    if (b.source === 'ageGroup') {
        if (!AGES.includes(b.ageGroup)) throw httpError(400, 'Please choose an age group');
        data.ageGroup = b.ageGroup;
    }
    if (b.isActive !== undefined) data.isActive = !!b.isActive;
    return data;
};

/* ---------------- Public: used by the home page ---------------- */
exports.publicSections = asyncHandler(async (req, res) => {
    let sections = await HomeSection.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .populate('category', 'name slug')
        .lean();

    // Fallback so the home page is never empty before the first section is created.
    if (!(await HomeSection.estimatedDocumentCount())) {
        sections = [{ _id: 'default-best', title: 'Best Selling Educational Toys', source: 'bestSeller', limit: 12 }];
    }

    const result = await Promise.all(
        sections.map(async (s) => {
            const products = await Product.find(filterFor(s))
                .sort(sortFor(s))
                .limit(s.limit || 4)
                .populate('category', 'name slug');
            return { _id: s._id, title: s.title, source: s.source, limit: s.limit, href: hrefFor(s), products };
        })
    );

    res.json(result.filter((s) => s.products.length > 0)); // empty sections stay hidden
});

/* ---------------- Admin ---------------- */
exports.adminList = asyncHandler(async (req, res) => {
    const sections = await HomeSection.find().sort({ order: 1, createdAt: 1 }).populate('category', 'name slug').lean();
    const withCount = await Promise.all(
        sections.map(async (s) => ({ ...s, matched: await Product.countDocuments(filterFor(s)) }))
    );
    res.json(withCount);
});

exports.create = asyncHandler(async (req, res) => {
    const data = clean(req.body);
    const last = await HomeSection.findOne().sort({ order: -1 }).select('order');
    const section = await HomeSection.create({ ...data, order: (last?.order || 0) + 1 });
    res.status(201).json(section);
});

exports.update = asyncHandler(async (req, res) => {
    const section = await HomeSection.findById(req.params.id);
    if (!section) throw httpError(404, 'Section not found');
    section.set(clean(req.body));
    await section.save();
    res.json(section);
});

exports.remove = asyncHandler(async (req, res) => {
    await HomeSection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section deleted' });
});

exports.reorder = asyncHandler(async (req, res) => {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.some((id) => !mongoose.isValidObjectId(id))) {
        throw httpError(400, 'Invalid list of sections');
    }
    await HomeSection.bulkWrite(
        ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i + 1 } } } }))
    );
    res.json({ ok: true });
});

exports.createDefaults = asyncHandler(async (req, res) => {
    if (await HomeSection.estimatedDocumentCount()) throw httpError(400, 'Sections already exist');
    await HomeSection.insertMany([
        { title: 'Best Selling Educational Toys', source: 'bestSeller', limit: 12, order: 1 },
        { title: 'New Arrivals', source: 'newest', limit: 4, order: 2 },
    ]);
    res.status(201).json({ ok: true });
});