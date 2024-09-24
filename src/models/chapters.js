'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const chapterSchema = new Schema({
    combinationId: { type: Schema.Types.ObjectId, required: true, ref: "coursesubjectcombinations" },
    subjectId: { type: Schema.Types.ObjectId, required: true, ref: "subjects" },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: "courses" },
    chapterNumber: { type: Number, required: true },
    chapterName: { type: String, required: true },
    status: { type: Number, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const Chapters = mongoose.model('chapters', chapterSchema);
export default Chapters;
