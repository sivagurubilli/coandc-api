'use strict';

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const unitSchema = new Schema({
    chapterId: { type: Schema.Types.ObjectId, required: true, ref: "chapters" },
    subjectId: { type: Schema.Types.ObjectId, ref: "subjects" },
    courseId: { type: Schema.Types.ObjectId, ref: "courses" },
    unitName: { type: String, required: true },
    unitNumber: { type: Number, sparse: true },
    status: { type: Number, required: true, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const Unit = mongoose.model('units', unitSchema);
export default Unit;