'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const optionSchema = new Schema({
    optionNumber: { type: Number, required: true },
    optionValue: { type: String, required: true, trim: true },
});

const questionSchema = new Schema({
    type: {
        type: String, required: true, enum: {
            values: ['text', 'audio', 'video'],
            message: 'Invalid type. Must be "text," "audio," or "video."'
        },
        default: 'text'
    },
    question: { type: String, required: true, trim: true },
    questionNumber: { type: Number, required: true },
    correctOption: { type: Number, required: true },
    options: [optionSchema],
    explanation: { type: String, trim: true },
    selectedOption: { type: Number, required: true },
    _id: { type: Schema.Types.ObjectId, required: true },
});

const seriesTestSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    seriesTestId: { type: Schema.Types.ObjectId, required: true, ref: 'seriestests' },
    seriesId: { type: Schema.Types.ObjectId, ref: "series" },
    subjectId: { type: Schema.Types.ObjectId, required: true, ref: "subjects" },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: "courses" },
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    timeLeftInMinutes: { type: Number, required: true },
    questions: [questionSchema],
    createdAt: Date,
    updatedAt: Date
});

const UserSeriesTestTracker = mongoose.model('usertestseriestracker', seriesTestSchema);
export default UserSeriesTestTracker;