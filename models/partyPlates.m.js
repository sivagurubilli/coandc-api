'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var partyPlateSchema = new Schema({
    value: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('partyplates', partyPlateSchema);