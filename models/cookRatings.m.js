'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cookRatingSchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks", required: true },
    employerId: { type: Schema.Types.ObjectId, ref: "employers", required: true },
    hygiene: { type: Number, required: true },
    behaviour: { type: Number, required: true },
    taste: { type: Number, required: true },
    punctuality: { type: Number, required: true },
    comment: { type: String },
    createdAt: Date,
    updatedAt: Date
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });


module.exports = mongoose.model('cookratings ', cookRatingSchema);