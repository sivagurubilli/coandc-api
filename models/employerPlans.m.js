'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var employerPlanSchema = new Schema({
    employerPlanName: { type: String, required: true },
    validityInDays: { type: Number, required: true },
    jobPoints: { type: Number, required: true },
    plantype: { type: Number, required: true, enum: [2, 1] },                  //1--short-term,2--long-term
    profileViewPoints: { type: Number, required: true },
    responsePoints: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: Number, required: true, enum: [0, 1], default: 1 },
    supportAssistance: { type: Number, required: true, enum: [0, 1] },
    refundPolicy: { type: Number, required: true, enum: [0, 1] },
    assistancePrice: { type: Number, default: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('employerplans', employerPlanSchema);