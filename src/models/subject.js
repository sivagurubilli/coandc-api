'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const subjectSchema = new Schema({
    subjectName: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    status: { type: Number, required: true, trim: true, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const Subject = mongoose.model('subjects', subjectSchema);
export default Subject;