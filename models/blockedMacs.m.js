'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema;
var blockedmacSchema = new schema({
    macAddress: { type: String, trim: true, index: true },
    createdAt: Date,
    updatedAt: Date
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

// no.of clients, no.of transformations
module.exports = mongoose.model('blockedmacs', blockedmacSchema);