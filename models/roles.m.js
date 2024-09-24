'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roleSchema = new Schema({
    roleName: { type: String, maxlength: 150, required: true, lowercase: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { timestamps: { createdAt: true, updatedAt: true }, toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('roles', roleSchema);

