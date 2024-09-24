'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var jobSchema = new Schema({
    employerUid: { type: String },
    employerId: { type: Schema.Types.ObjectId, ref: "employers" },
    employerPointsId: { type: Schema.Types.ObjectId, ref: "employerpoints" },
    maximumResponsesCount: { type: Number, default: 0 },
    currentResponsesCount: { type: Number, min: 0, default: 0 },
    designation: { type: String, },
    salary: { type: Number, },
    experience: { type: Number, },
    openings: { type: Number, default: 0 },
    urgency: { type: String, },
    contactNumber: { type: Number, },
    whatsappUpdate: { type: Number, enum: [0, 1], default: 1 },
    status: { type: Number, enum: [0, 1, 2], default: 0 },
    expiryDate: { type: Date, },
    description: { type: String, },
    visibility: { type: Number, enum: [0, 1], default: 1 },
    pincode: { type: Number },
    food: { type: Number, required: true, enum: [0, 1], default: 0 },
    accommodation: { type: Number, required: true, enum: [0, 1], default: 0 },
    qualification: { type: String },
    cuisines: { type: [String], default: undefined },
    dishes: { type: String },
    location: { type: String, },
    isAdminViewed: { type: Number, enum: [0, 1], default: 0 },
    isCSViewed: { type: Number, enum: [0, 1], default: 0 },
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

jobSchema.index({ locationCoordinates: '2dsphere' });

module.exports = mongoose.model('jobs', jobSchema);