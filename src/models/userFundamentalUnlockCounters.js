'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userUnlockCounterSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    chapterId: { type: Schema.Types.ObjectId, ref: "fundamentalchapters", required: true },
    nextUnlockedUnitNumber: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
userUnlockCounterSchema.index({ userId: 1, chapterId: 1 });
const UserFundamentalUnlockCounters = mongoose.model('userfundamentalunlockcounters', userUnlockCounterSchema);
export default UserFundamentalUnlockCounters;

