const multer = require('multer');
const { httpError } = require('./error');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
    fileFilter: (req, file, cb) =>
        ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(httpError(400, 'Sirf JPG, PNG ya WEBP image allowed hai')),
});

exports.uploadImages = (req, res, next) =>
    upload.array('images', 6)(req, res, (err) => {
        if (!err) return next();
        const msg =
            err.code === 'LIMIT_FILE_SIZE' ? 'Image 5MB se badi hai'
                : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Maximum 6 images allowed hain'
                    : err.message;
        next(err.status ? err : httpError(400, msg));
    });