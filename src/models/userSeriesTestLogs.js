'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    questionId: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    correctOption: { type: Number, required: true },
    isAnswerCorrect: { type: Number, required: true, enum: [0, 1] }
});

const userSeriesTestLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    seriesTestId: { type: Schema.Types.ObjectId, required: true, ref: 'seriestests' },
    seriesId: { type: Schema.Types.ObjectId, required: true, ref: 'series' },
    combinationId: { type: Schema.Types.ObjectId, required: true, ref: 'coursesubjectcombination' },
    subjectId: { type: Schema.Types.ObjectId, required: true, ref: "subjects" },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: "courses" },
    timeTakenInMinutes: { type: Number, required: true },
    percentage: { type: Number, required: true },
    responses: [questionSchema],
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const UserSeriesTestLogs = mongoose.model('userseriestestlogs', userSeriesTestLogSchema);
export default UserSeriesTestLogs;

