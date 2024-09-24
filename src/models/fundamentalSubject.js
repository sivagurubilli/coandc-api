'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const fundamentalSubjectSchema = new Schema({
    subjectName: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    status: { type: Number, required: true, trim: true, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: Date,
    updatedAt: Date
});

const FundamentalSubject= mongoose.model('fundamentalsubjects', fundamentalSubjectSchema);
export default FundamentalSubject;