'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const optionSchema = new Schema({
    optionNumber: { type: Number },
    optionValue: { type: String, trim: true },
});

const questionSchema = new Schema({
    type: {
        type: String, enum: {
            values: ['text', 'audio', 'video'],
            message: 'Invalid type. Must be "text," "audio," or "video."'
        },
        default: 'text'
    },
    question: { type: String, trim: true },
    questionNumber: { type: Number, },
    correctOption: { type: Number },
    options: [optionSchema],
    explanation: { type: String, trim: true }
});

var quizContentSchema = new Schema({
    date: { type: Date, required: true },
    questions: {
        type: [questionSchema],
        default: undefined
    },
    quizCategoryId: { type: Schema.Types.ObjectId, ref: 'quizcategories', required: true },
    content: { type: String },
    createdAt: Date,
    updatedAt: Date
});

const QuizContent = mongoose.model('quizcontents', quizContentSchema);
export default QuizContent;



