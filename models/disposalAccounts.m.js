'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var disposalAccountSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    previousStatus: { type: Number, required: true },
    activity: { type: Number, enum: [1, 2], required: true },//1=Suspended  ,2 =Delete Requested
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('disposalaccounts', disposalAccountSchema);

