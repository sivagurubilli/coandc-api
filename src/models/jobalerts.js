'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const jobAlertSchema = new Schema({
    title: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    courseId:{type:Schema.Types.ObjectId,required:true,ref:'courses'},
    status: { type: Number, enum: [0, 1], default: 1 },
    createdAt: Date,
    updatedAt: Date
});

const JobAlert = mongoose.model('jobalerts', jobAlertSchema);
export default JobAlert;