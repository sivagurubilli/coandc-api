
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adminOtpSchema = new Schema({
    otp: String,
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, expires: '5m', default: Date.now },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('adminotps', adminOtpSchema);



