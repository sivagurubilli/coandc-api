'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { getCurrentDateAndTime } = require("../helpers/dates");

var cookShortlistSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    jobId: { type: Schema.Types.ObjectId, ref: "jobs" },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    expiryDate: Date,
    eventId: { type: Schema.Types.ObjectId, ref: "events" },
    requirementId: { type: Schema.Types.ObjectId, ref: "clientrequirements" },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('cookshortlists', cookShortlistSchema);

