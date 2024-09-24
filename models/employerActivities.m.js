'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var employerActivitySchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    applicationId: { type: Schema.Types.ObjectId, ref: "cookapplications" },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    employerPointsId: { type: Schema.Types.ObjectId, ref: "employerpoints" },
    clientPointsId: { type: Schema.Types.ObjectId, ref: "clientpoints" },
    activity: { type: String, required: true, trim: true, enum: ['viewed', 'shortlisted', 'chatinteraction', 'mobileinteraction', 'whatsappinteraction'] },
    cookType: { type: String, trim: true, enum: ['housecook', 'partycook', 'chef', 'catering'] },
    expiresAt: Date,
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
employerActivitySchema.index({ cookId: 1, employerId: 1, activity: 1 });

module.exports = mongoose.model('employeractivities', employerActivitySchema);

