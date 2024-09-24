'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userQuizLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    quizContentId: { type: Schema.Types.ObjectId, required: true, ref: "quizcontentsnew" },
    quizCategoryId: { type: Schema.Types.ObjectId, required: true, ref: "quizcategoriesnew" },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});

const UserQuizLogs = mongoose.model('userquizlogs', userQuizLogSchema);
export default UserQuizLogs;

