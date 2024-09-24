'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema;
var allowedMacSchema = new schema({
    macAddress: { type: String, trim: true, index: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
});

// no.of clients, no.of transformations
module.exports = mongoose.model('allowedmacs', allowedMacSchema);