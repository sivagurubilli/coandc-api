'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    questionId: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    correctOption: { type: Number, required: true },
    isAnswerCorrect: { type: Number, required: true, enum: [0, 1] }
});

const userFinalTestLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    unitId: { type: Schema.Types.ObjectId, required: true, ref: "units" },
    chapterId: { type: Schema.Types.ObjectId, required: true, ref: "chapters" },
    combinationId: { type: Schema.Types.ObjectId, required: true, ref: "combinations" },
    subjectId: { type: Schema.Types.ObjectId, ref: "subjects" },
    testId: { type: Schema.Types.ObjectId, ref: "coursefinaltests" },
    percentage: { type: Number, required: true },
    highestPercentage: { type: Number, required: true },
    attemptedOn: { type: Number, required: true, enum: [0, 1] }, //0=Attempted before qualifying, 1=Attempted after qualifying
    responses: [questionSchema],
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const CourseFinalTestLogs = mongoose.model('usercoursefinaltestlogs', userFinalTestLogSchema);
export default CourseFinalTestLogs;

