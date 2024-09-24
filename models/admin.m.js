'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adminSchema = new Schema({
    fullName: { type: String, maxlength: 150, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: Number, required: true },
    password: { type: String, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "roles" },
    status: { type: Number, required: true, default: 1 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('admins', adminSchema);

