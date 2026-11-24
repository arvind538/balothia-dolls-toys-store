const { cloudinary, cloudinaryReady } = require('../config/cloudinary');
const { httpError } = require('../middleware/error');

const FOLDER = 'balothia/products';

exports.uploadBuffer = (buffer) => {
    if (!cloudinaryReady()) {
        throw httpError(500, 'Cloudinary configure nahi hai. .env me CLOUDINARY_* keys daalo aur backend restart karo.');
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: FOLDER, resource_type: 'image', transformation: [{ width: 1200, height: 1200, crop: 'limit' }] },
            (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(buffer);
    });
};

const publicIdFromUrl = (url) => {
    const m = String(url).match(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    return m ? m[1] : null;
};

exports.deleteImages = async (urls = []) => {
    if (!cloudinaryReady()) return;
    const ids = urls.map(publicIdFromUrl).filter((id) => id && id.startsWith(`${FOLDER}/`));
    await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id, { invalidate: true })));
};