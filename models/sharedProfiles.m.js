'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sharedProfileSchema = new Schema({
    employerId: { type: Schema.Types.ObjectId, required: true, ref: "employers" },
    cookId: { type: Schema.Types.ObjectId, required: true, ref: "cooks" },
    sharedTo: { type: String, trim: true, lowercase: true, enum: ["cook", "employer"] },
    jobId: { type: Schema.Types.ObjectId, ref: "jobs" },
    eventId: { type: Schema.Types.ObjectId, ref: "events" },
    requirementId: { type: Schema.Types.ObjectId, ref: "clientrequirements" },
    expiryDate: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

module.exports = mongoose.model('sharedprofiles', sharedProfileSchema);

