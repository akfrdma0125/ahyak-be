// middlewares/responseWrapper.js
function responseWrapper(req, res, next) {
    const originalJson = res.json;

    res.json = function (data) {
        const wrapped = { status: 'success', data };
        return originalJson.call(this, wrapped);
    };

    next();
}

module.exports = responseWrapper;
