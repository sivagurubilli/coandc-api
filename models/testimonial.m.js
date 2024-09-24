'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var testimonialSchema = new Schema({
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: Number, enum: [0, 1], default: 1 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('testimonials', testimonialSchema);

