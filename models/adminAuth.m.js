'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adminAuthSchema = new Schema({
    securityKey: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('adminauths', adminAuthSchema);

