'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var macListSchema = new Schema({
    macAddress: { type: String, trim: true, required: true },
    users: { type: [String], default: undefined },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

module.exports = mongoose.model('maclist', macListSchema);

