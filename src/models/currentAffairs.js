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
    questionNumber: { type: Number, },
    correctOption: { type: Number, required: true },
    options: [optionSchema],
    explanation: { type: String, trim: true }
});

var currentAffairSchema = new Schema({
    monthName: {
        type: String, required: true, lowercase: true, enum: [
            'january', 'february', 'march', 'april',
            'may', 'june', 'july', 'august',
            'september', 'october', 'november', 'december'
        ]
    },
    year:{type:Number,required:true},
    questions: [questionSchema],
    date: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const CurrentAffairs = mongoose.model('currentaffairs', currentAffairSchema);
export default CurrentAffairs;