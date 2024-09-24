'use strict';

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

var paymentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    planId: { type: Schema.Types.ObjectId, ref: 'plans' },
    isSelfPurchased: { type: Boolean, default: true },
    purchaseType: { type: Number, default: 1 },                //1=direct-plan,2=upgrade-plan
    basePrice: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    gstPercent: { type: Number, required: true },
    gstPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    orderId: { type: String, trim: true },
    paymentId: { type: String, trim: true },
    rzpSignature: { type: String, trim: true },
    paymentType: { type: String, trim: true },
    paymentStatus: { type: Number, default: 0, enum: [0, 1] },
    planStartsAt: { type: Date },
    planExpiresAt: { type: Date },
    paymentData: {
        type: Object
    },
    isDeleted: { type: Boolean, default: false },
    invoiceNumber: { type: String },
    invoiceUrl: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const Payment = mongoose.model('payments', paymentSchema);
export default Payment;