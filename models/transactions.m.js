'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transactionSchema = new Schema({
    oldUid: String,
    transactionNo: { type: String, required: true, unique: true },
    transactionPaymentNo: { type: String },
    transactionSignature: { type: String },
    transactionBy: { type: Number, required: true, enum: [1, 2] },    //1=Chef, 2=Employer
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    cookPlanId: { type: Schema.Types.ObjectId, ref: "cookplans" },
    cookPointsId: { type: Schema.Types.ObjectId, ref: "cookpoints" },
    employerId: { type: Schema.Types.ObjectId, ref: 'employers' },
    clientPlanId: { type: Schema.Types.ObjectId, ref: "clientplans" },
    clientPointsId: { type: Schema.Types.ObjectId, ref: "clientpoints" },
    employerPlanId: { type: Schema.Types.ObjectId, ref: "employerplans" },
    employerPointsId: { type: Schema.Types.ObjectId, ref: "employerpoints" },
    refundPolicy: Number,
    categoryType: String,
    address: { type: String, trim: true },
    poNo: String,
    planName: String,
    particulars: String,
    transactionStartDateTime: { type: Date, required: true },
    isSelfPayment: { type: Boolean, default: true },
    adminId: { type: Schema.Types.ObjectId, ref: "admins" },
    executiveId: { type: Schema.Types.ObjectId, ref: "csexecutives" },
    transactionEndDateTime: Date,
    transactionType: { type: Number, enum: [1, 2, 3, 4, 5, 6] },  //1 = Payment Gateway, 2= Bank Transfer, 3= Cash, 4= Cheque / DD, 5 = Other,6=Alloted By Admin
    price: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true },
    assistanceIncluded: { type: Number, enum: [0, 1] },
    assistancePrice: { type: Number },
    paymentDetails: { type: Object },
    invoiceNo: { type: String, unique: true, sparse: true },
    invoiceUrl: { type: String },
    paymentStatus: { type: Number, enum: [0, 1, 2, 3] },    //0 = Payment Not Received, 1 = Payment Received, 2= Payment Waved- off, 3 = Refunded
    transactionStatus: { type: Number, enum: [0, 1, 2, 3] },  //0=Transaction not completed, 1=Transaction Completed, 2= Transaction Cancelled, 3= Transaction Void
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    scriptDate: { type: String, required: true, default: '23032024' }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
transactionSchema.index({ cookId: 1 });
transactionSchema.index({ employerId: 1 });


module.exports = mongoose.model('transactions', transactionSchema);

