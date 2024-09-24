'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var emailLogSchema = new Schema({
    email: { type: String, required: true, trim: true, lowercase: true },
    type: { type: Number, required: true },  //1=Verify, 2=Login, 3= Forgot Password
    sender: { type: String, default: null },
    message: { type: String, required: true },
    subject: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('emaillogs', emailLogSchema);