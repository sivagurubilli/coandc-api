'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ooursesubjectSchema = new Schema({
    subjectId: { type: Schema.Types.ObjectId, required: true, ref: "subjects" },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: "courses" },
    status: { type: Number, required: true, trim: true, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const CourseSubjectCombination = mongoose.model('coursesubjectcombinations', ooursesubjectSchema);
export default CourseSubjectCombination;