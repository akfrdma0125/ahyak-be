const mongoose = require('mongoose');

module.exports = function createModels(name, schemaFields, options = {}) {
    // baseFields, baseOptions는 공통 필드 및 공통 옵션을 의미
    const { baseFields, baseOptions } = require('./commonSchema');

    // 스키마 필드와 옵션을 병합 (사용자 정의가 우선)
    const mergedFields = { ...baseFields, ...schemaFields };
    const mergedOptions = { ...baseOptions, ...options };

    const schema = new mongoose.Schema(mergedFields, mergedOptions);
    return mongoose.model(name, schema);
};