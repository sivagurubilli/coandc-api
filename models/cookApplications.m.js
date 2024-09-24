'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { getCurrentDateAndTime } = require("../helpers/dates");

var cookApplicationSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    jobId: { type: Schema.Types.ObjectId, ref: "jobs" },
    eventId: { type: Schema.Types.ObjectId, ref: "events" },
    requirementId: { type: Schema.Types.ObjectId, ref: "clientrequirements" },
    employerPointsId: { type: Schema.Types.ObjectId, ref: "employerpoints" },
    clientPointsId: { type: Schema.Types.ObjectId, ref: "clientpoints" },
    applicationStatus: { type: String, enum: ["applied", "hired", "rejected", "cancelled", "onhold", "shortlisted"] },
    cancelledAt: Date,
    appliedAt: Date,
    expiredAt: Date,
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('cookapplications', cookApplicationSchema);

