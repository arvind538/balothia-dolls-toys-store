const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        const h = req.headers.authorization || '';
        if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Please login first' });
        const { id } = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
        req.user = await User.findById(id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'User not found' });
        next();
    } catch {
        res.status(401).json({ message: 'Session expired, login again' });
    }
};

// Identifies a signed-in visitor when a valid token is sent, but never blocks guests.
exports.optionalAuth = async (req, res, next) => {
    try {
        const h = req.headers.authorization || '';
        if (h.startsWith('Bearer ')) {
            const { id } = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
            req.user = await User.findById(id).select('-password');
        }
    } catch {
        // An invalid or expired token simply means the visitor is treated as a guest.
    }
    next();
};

exports.adminOnly = (req, res, next) =>
    req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only' });










// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// exports.protect = async (req, res, next) => {
//     try {
//         const h = req.headers.authorization || '';
//         if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Please login first' });
//         const { id } = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
//         req.user = await User.findById(id).select('-password');
//         if (!req.user) return res.status(401).json({ message: 'User not found' });
//         next();
//     } catch {
//         res.status(401).json({ message: 'Session expired, login again' });
//     }
// };

// exports.adminOnly = (req, res, next) =>
//     req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only' });