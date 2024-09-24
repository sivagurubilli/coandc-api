'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ipSchema = new schema({
    ipAddress: { type: String, trim: true, index: true },
    macAddress: { type: String, trim: true, index: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

// no.of clients, no.of transformations
module.exports = mongoose.model('ipaddress', ipSchema);