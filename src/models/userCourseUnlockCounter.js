'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

var userCourseUnlockCounterSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "chapters", required: true },
    combinationId: { type: Schema.Types.ObjectId, ref: "combinations", required: true },
    nextUnlockedUnitNumber: { type: Number, required: true },
    createdAt: Date,
    updatedAt: Date
});
userCourseUnlockCounterSchema.index({ userId: 1, chapterId: 1, combinationId: 1 });
const UserCourseUnlockCounter = mongoose.model('usercourseunlockcounters', userCourseUnlockCounterSchema);
export default UserCourseUnlockCounter;

