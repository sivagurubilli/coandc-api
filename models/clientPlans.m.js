'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientPlanSchema = new Schema({
    clientPlanName: { type: String, required: true },
    validityInDays: { type: Number, required: true },
    eventPoints: { type: Number, required: true },
    houseCookPoints: { type: Number, required: true },
    partyCateringPoints: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: Number, required: true, enum: [0, 1], default: 1 },
    supportAssistance: { type: Number, required: true, enum: [0, 1] },
    refundPolicy: { type: Number, required: true, enum: [0, 1] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('clientplans', clientPlanSchema);