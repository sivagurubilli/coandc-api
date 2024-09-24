'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var languageSchema = new Schema({
    languageName: { type: String, maxlength: 150, required: true },
    status: { type: Number, required: true, default: 1 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('languages', languageSchema);

