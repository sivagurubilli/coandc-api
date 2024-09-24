'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: "employers", required: true },
    clientPointsId: { type: Schema.Types.ObjectId, ref: "clientpoints" },
    status: { type: Number, enum: [0, 1, 2], default: 1 },
    totalInterestsReceived: { type: Number, default: 0 },
    isEventTypeEditable: { type: Number, default: 1, enum: [1, 2] },
    isEventDateEditable: { type: Number, default: 1, enum: [1, 2] },
    eventType: { type: String, trim: true, required: true },
    eventDate: { type: Date, required: true },
    cuisines: { type: [String], default: undefined },
    expectedGuest: { type: Number, required: true },
    pincode: { type: Number, required: true },
    city: { type: String, trim: true, required: true },
    dishes: { type: String, required: true, trim: true },
    cityCoordinates: {
        type: {
            type: String, enum: ['Point']
        },
        coordinates: {
            type: [Number], default: undefined
        }
    },
    location: { type: String, trim: true, required: true },
    locationCoordinates: {
        type: {
            type: String, enum: ['Point']
        },
        coordinates: {
            type: [Number], default: undefined
        }
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
eventSchema.index({ locationCoordinates: '2dsphere' });
eventSchema.index({ cityCoordinates: '2dsphere' });


module.exports = mongoose.model('events', eventSchema);