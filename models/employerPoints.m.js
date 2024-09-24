'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var employerPointSchema = new Schema({
    scriptDate: { type: String, required: true, default: '23032024' },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    employerPlanId: { type: Schema.Types.ObjectId, ref: "employerplans" },
    planTransactionId: { type: Schema.Types.ObjectId, ref: "transactions" },
    assistanceTransactionId: { type: Schema.Types.ObjectId, ref: "transactions" },
    supportAssistance: { type: Number, required: true, enum: [0, 1], default: 0 },
    planType: { type: String, required: true, enum: ['paid', 'cancelled', 'refundrequested'] },
    planStartsAt: { type: Date, required: true },
    planExpiresAt: { type: Date, required: true },
    totalJobPoints: { type: Number, required: true },
    totalProfileViewPoints: { type: Number, required: true },
    totalResponsePoints: { type: Number, required: true },
    currentJobPoints: { type: Number, required: true },
    currentProfileViewPoints: { type: Number, required: true },
    currentResponsePoints: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('employerpoints', employerPointSchema);