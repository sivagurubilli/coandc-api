'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    email: { type: String, trim: true, required: true },
    role:{type:String,required:true,enum:['admin','support']},
    password: { type: String, required: true },
    lastLoginDateTime: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
adminSchema.index({ email: 1 });
const Admin = mongoose.model('admin', adminSchema);
export default Admin;