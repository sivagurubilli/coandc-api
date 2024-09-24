'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var csExecutiveSchema = new Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    status: { type: Number, required: true, enum: [1, 2] },
    roleId: { type: Schema.Types.ObjectId, ref: "roles", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    houseCookAccess: { type: Number, enum: [0, 1], required: true },
    partyCookAccess: { type: Number, enum: [0, 1], required: true },
    chefAccess: { type: Number, enum: [0, 1], required: true },
    cateringAccess: { type: Number, enum: [0, 1], required: true },
    employerAccess: { type: Number, enum: [0, 1], required: true },
    clientAccess: { type: Number, enum: [0, 1], required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('csexecutives', csExecutiveSchema);

