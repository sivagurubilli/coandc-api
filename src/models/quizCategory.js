
'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
var quizCategorySchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['mcq', 'content'] },
    icon: { type: String, required: true },
    createdAt: Date,
    updatedAt: Date
});

const QuizCategory = mongoose.model('quizcategories', quizCategorySchema);
export default QuizCategory;


