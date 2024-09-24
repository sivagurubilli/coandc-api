'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var whatsappLogSchema = new Schema({
    mobileNo: { type: Number, required: true },
    type: { type: Number, required: true },   //1=Verify, 2=Login, 3 = Forgot Password, 4 = Change whatsapp Number
    response: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('whatsapplogs', whatsappLogSchema);

