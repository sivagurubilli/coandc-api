'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;


const courseSchema = new Schema({
    courseName: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    status: { type: Number, required: true, trim: true, default: 1 },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const Course = mongoose.model('courses', courseSchema);
export default Course;