
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var advtSchema = new Schema({
    usertype: { type: String, required: true, trim: true, enum: ["chef", "housecook", "partycook", "catering", "employer", "client"] },
    image: { type: String, required: true, trim: true },
    status: { type: Number, default: 1 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('advertisements', advtSchema);

