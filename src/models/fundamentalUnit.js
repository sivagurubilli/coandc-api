'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const fundamentalUnitSchema = new Schema({
    chapterId: { type: Schema.Types.ObjectId, required: true, ref: "fundamentalchapters" },
    subjectId: { type: Schema.Types.ObjectId, ref: "fundamentalsubjects" },
    unitName: { type: String, required: true, },
    unitNumber: { type: Number, required: true, },
    status: { type: Number, required: true, trim: true, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: Date,
    updatedAt: Date
});

const FundamentalUnit = mongoose.model('fundamentalunits', fundamentalUnitSchema);
export default FundamentalUnit;