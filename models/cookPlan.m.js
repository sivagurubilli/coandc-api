'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { getCurrentDateAndTime } = require("../helpers/dates");

var cookPlanSchema = new Schema({
    cookPlanName: { type: String, required: true },
    validityInDays: { type: Number, required: true },
    profileBoostRank: { type: Number, required: true },
    resumeBuilder: { type: Number, required: true, enum: [0, 1], default: 0 },
    actionPerDay: { type: Number, required: true, enum: [0, 1], default: 0 },
    actionPerMonth: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: Number, required: true, enum: [0, 1], default: 1 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('cookplans', cookPlanSchema);

