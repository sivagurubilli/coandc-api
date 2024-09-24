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
    explanation: { type: String, trim: true }
});

const finalTestSchema = new Schema({
    unitId: { type: Schema.Types.ObjectId, ref: "units" },
    questions: [questionSchema],
    isDeleted: { type: Boolean, default: false },
    createdAt: Date,
    updatedAt: Date
});

const CourseFinalTest = mongoose.model('coursefinaltests', finalTestSchema);
export default CourseFinalTest;

