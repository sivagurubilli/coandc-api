'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const planSchema = new Schema({
    name: { type: String, trim: true, required: true },
    validityInDays: { type: Number, required: true },
    gstPercent: { type: Number, required: true },
    upgradePlan: { type: Boolean, default: false },
    price: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    status: { type: Number, required: true, default: 1 },
    applePlanId: { type: String },
    maxCourse: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const Plans = mongoose.model('plans', planSchema);
export default Plans;
