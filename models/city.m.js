'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var citySchema = new Schema({
    cityCode: { type: String, maxlength: 3, required: true },
    cityName: { type: String, maxlength: 150, required: true },
    lang: { type: String, maxlength: 2, required: true },
    status: { type: Number, required: true, default: 1 },
    provinceId: { type: Schema.Types.ObjectId, ref: "Provinces" },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });
module.exports = mongoose.model('city', citySchema);

