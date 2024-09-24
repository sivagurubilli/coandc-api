'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var resumeBuilderSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    templateId: { type: Schema.Types.ObjectId, ref: "resumetemplates" },
    resumeUrl: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('resumebuilders', resumeBuilderSchema);

