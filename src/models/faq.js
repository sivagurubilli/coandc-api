'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const faqSchema = new Schema({
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    status: { type: Number, enum: [0, 1], default: 1 },
    createdAt: Date,
    updatedAt: Date
});

const Faq = mongoose.model('faqs', faqSchema);
export default Faq;