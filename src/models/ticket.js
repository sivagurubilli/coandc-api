'use strict';

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ticketSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
    issueType: { type: Number, required: true, enum: [1, 2, 3] },//1=Course Issues, 2=Payment Issues, 3=Other Issues
    status: { type: Number, trim: true, required: true, default: 0 },
    description: { type: String, required: true, trim: true },
    resolution: { type: String, trim: true },
    ticketNumber: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const Ticket = mongoose.model('tickets', ticketSchema);
export default Ticket;