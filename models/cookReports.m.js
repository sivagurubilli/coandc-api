'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cookReportSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    jobId: { type: Schema.Types.ObjectId, ref: "jobs" },
    eventId: { type: Schema.Types.ObjectId, ref: "events" },
    requirementId: { type: Schema.Types.ObjectId, ref: "clientrequirements" },
    comment: String,
    reason: { type: String, required: true },
    createdAt: Date,
    updatedAt: Date
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('cookreports', cookReportSchema);

