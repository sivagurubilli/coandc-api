'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const fundamentalChapterSchema = new Schema({
    subjectId: { type: Schema.Types.ObjectId, required: true, ref: "fundamentalsubjects" },
    chapterNumber: { type: Number },
    chapterName: { type: String, required: true },
    status: { type: Number, required: true, trim: true, default: 1, enum: [0, 1] },
    isDeleted: { type: Boolean, default: false },
    createdAt: Date,
    updatedAt: Date
});
const FundamentalChapter = mongoose.model('fundamentalchapters', fundamentalChapterSchema);
export default FundamentalChapter;