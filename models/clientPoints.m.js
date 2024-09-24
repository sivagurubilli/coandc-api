'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientPointSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: "employers" },
    clientPlanId: { type: Schema.Types.ObjectId, ref: "clientplans" },
    planTransactionId: { type: Schema.Types.ObjectId, ref: "transactions" },
    planType: { type: String, required: true, enum: ['free', 'paid', 'cancelled', 'refundrequested'] },
    planStartsAt: { type: Date, required: true },
    planExpiresAt: { type: Date, required: true },
    totalEventPoints: { type: Number, required: true },
    totalHouseCookPoints: { type: Number, required: true },
    totalPartyCateringPoints: { type: Number, required: true },
    currentEventPoints: { type: Number, required: true },
    currentHouseCookPoints: { type: Number, required: true },
    currentPartyCateringPoints: { type: Number, required: true },
    supportAssistance: { type: Number, enum: [0, 1] },
    scriptDate: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('clientpoints', clientPointSchema);