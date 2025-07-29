const mongoose = require('mongoose');

const baseFields = {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
};

const baseOptions = {
    timestamps: { createdAt: false, updatedAt: true }
};

module.exports = { baseFields, baseOptions };