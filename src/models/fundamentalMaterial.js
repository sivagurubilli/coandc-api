'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const fundamentalMaterialSchema = new Schema({
    unitId: { type: Schema.Types.ObjectId, required: true, ref: "fundamentalunits" },
    materialName: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
    description: { type: String, trim: true },
    materialNumber: { type: Number, required: true },
    type: { type: String, default: "pdf", required: true },
    status: { type: Number, required: true, trim: true, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const FundamentalMaterial = mongoose.model('fundamentalmaterials', fundamentalMaterialSchema);
export default FundamentalMaterial;