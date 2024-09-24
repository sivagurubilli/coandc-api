'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var resumeTemplateSchema = new Schema({
    template: { type: String, required: true },
    templateUrl: { type: String, required: true },
    status: { type: Number, required: true, default: 1 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('resumetemplates', resumeTemplateSchema);

