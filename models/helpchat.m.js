'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema;
var helpChatSchema = new schema({
    question: { type: String, required: true, trim: true },
    answer: { type: String, trim: true },
    status: { type: Number, enum: [0, 1], default: 1 },
    role: { type: String, required: true, trim: true, enum: ["cook", "employer", "client", "website"] },
    link: { type: String, required: true, trim: true },
    createdAt: Date,
    updatedAt: Date
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

// no.of clients, no.of transformations
module.exports = mongoose.model('helpchats', helpChatSchema);