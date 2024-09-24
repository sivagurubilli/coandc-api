'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cookPointSchema = new Schema({
    scriptdate: { type: String },
    cookId: { type: Schema.Types.ObjectId, ref: "cooks" },
    chefDailyLimit: { type: Number },
    chefMonthlyLimit: { type: Number },
    chefDailyLimitBalance: { type: Number },
    chefMonthlyLimitBalance: { type: Number },
    chefPlanStartDate: { type: Date },
    chefPlanEndDate: { type: Date },
    chefPlanRenewalDate: { type: Date },

    cateringDailyLimit: { type: Number },
    cateringMonthlyLimit: { type: Number },
    cateringDailyLimitBalance: { type: Number },
    cateringMonthlyLimitBalance: { type: Number },

    partyDailyLimit: { type: Number },
    partyMonthlyLimit: { type: Number },
    partyDailyLimitBalance: { type: Number },
    partyMonthlyLimitBalance: { type: Number },

    houseDailyLimit: { type: Number },
    houseMonthlyLimit: { type: Number },
    houseDailyLimitBalance: { type: Number },
    houseMonthlyLimitBalance: { type: Number },

    planStartDate: { type: Date },
    planEndDate: { type: Date },
    planRenewalDate: { type: Date },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

module.exports = mongoose.model('cookpoints', cookPointSchema);