'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var employerRatingSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks", required: true },
    employerId: { type: Schema.Types.ObjectId, ref: "employers", required: true },
    workculture: { type: Number, required: true },
    behaviour: { type: Number, required: true },
    facilities: { type: Number, required: true },
    salary: { type: Number, required: true },
    comment: { type: String },
    createdAt: Date,
    updatedAt: Date
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('employerratings ', employerRatingSchema);