'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ticketSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: Number, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    ticketNumber: { type: String, required: true },
    status: { type: String, required: true, default: "open", enum: ["open", "closed"] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('tickets', ticketSchema);

