'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var employerReportSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks", required: true },
    employerId: { type: Schema.Types.ObjectId, ref: "employers", required: true },
    comment: String,
    reason: { type: String, trim: true, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
employerReportSchema.index({ cookId: 1, employerId: 1 });
module.exports = mongoose.model('employerreports', employerReportSchema);

