'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cuisineSchema = new Schema({
    cuisineName: { type: String, maxlength: 150, required: true },
    lang: { type: String, maxlength: 2, default: "EN" },
    status: { type: Number, required: true, default: 1 },
}, { timestamps: { createdAt: true, updatedAt: true }, toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('cuisines', cuisineSchema);

