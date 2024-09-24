'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var smsLogSchema = new Schema({
    mobile: { type: Number, required: true },
    type: { type: Number, required: true },   //1=Verify, 2=Change Mobile while Signup, 3=Login, 4 = Forgot Password, 5 = Change Mobile Number after Signup
    senderId: { type: String, default: null },
    message: { type: String, required: true },
    templateId: { type: String },
    response: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('smslogs', smsLogSchema);

