'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userCoursesSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    enrolledOn:{type:Number,default:0,required:true},   //0=On Free Access, 1=On purchase plans
    courseId: { type: Schema.Types.ObjectId, ref: "courses" },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const UserCourse = mongoose.model('usercourses', userCoursesSchema);
export default UserCourse;