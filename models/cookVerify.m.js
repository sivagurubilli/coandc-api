'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cookVerifySchema = new Schema({
    cookId: { type: Schema.Types.ObjectId, ref: "Cook", },
    mobile: Number,
    email: { type: String, trim: true, lowercase: true },
    whatsapp: Number,
    otp: String,
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('cookverify', cookVerifySchema);

