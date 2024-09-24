'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientRequirementSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: "employers" },
    cuisines: { type: [String], required: true, default: undefined },
    preferredGender: { type: Number, required: true, enum: [1, 2, 3] },
    status: { type: Number, enum: [0, 1, 2], default: 1 },
    totalApplications: { type: Number, default: 0 },
    jobType: { type: Number, enum: [1, 2, 3], required: true },                 // 1 = Full Time, 2 = Part Time, 3 = Any
    minimumPayment: { type: String, trim: true, required: true },
    urgency: { type: String, required: true },
    breakfast: { type: Number, required: true, enum: [0, 1] },
    lunch: { type: Number, required: true, enum: [0, 1] },
    dinner: { type: Number, required: true, enum: [0, 1] },
    vesselWash: { type: Number, required: true, enum: [0, 1] },
    expiryDate: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('clientrequirements', clientRequirementSchema);

