exports.httpError = (status, message) => Object.assign(new Error(message), { status });

exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

exports.errorHandler = (err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message;
    if (err.name === 'CastError') { status = 400; message = 'Invalid ID'; }
    if (err.name === 'ValidationError') status = 400;
    if (err.code === 11000) { status = 400; message = 'Already exists (duplicate value)'; }
    if (status === 500) console.error(err);
    res.status(status).json({ message });
};