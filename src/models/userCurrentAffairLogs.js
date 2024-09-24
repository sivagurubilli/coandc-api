'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    questionId: { type: Schema.Types.ObjectId, ref: "currentaffairs", required: true },
    questionNumber: { type: Number, },
    correctOption: { type: Number, required: true },
    selectedOption: { type: Number, required: true }
});

const userCurrentAffairLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    currentAffairsId: { type: Schema.Types.ObjectId, ref: "currentaffairs" },
    responses: [questionSchema],
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const UserCurrentAffairLogs = mongoose.model('usercurrentaffairlogs', userCurrentAffairLogSchema);
export default UserCurrentAffairLogs;

