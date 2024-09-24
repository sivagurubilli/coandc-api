'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var emailVerifySchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    email: { type: String, trim: true, lowercase: true },
    status: { type: Number, default: 1 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('emailverify', emailVerifySchema);

