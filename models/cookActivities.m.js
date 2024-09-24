'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { getCurrentDateAndTime } = require("../helpers/dates");

var cookActivitySchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    jobId: { type: Schema.Types.ObjectId, ref: "jobs" },
    eventId: { type: Schema.Types.ObjectId, ref: "events" },
    requirementId: { type: Schema.Types.ObjectId, ref: "clientrequirements" },
    activity: { type: String, required: true, trim: true, enum: ['chatinteraction', 'mobileinteraction', 'whatsappinteraction', 'applied', 'shortlisted', 'viewed', 'cancelled'] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('cookactivities', cookActivitySchema);

