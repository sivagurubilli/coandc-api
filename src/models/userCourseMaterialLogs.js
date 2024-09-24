'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

var userMaterialLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    unitId: { type: Schema.Types.ObjectId, ref: "units" },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const UserCourseMaterialLogs = mongoose.model('usercoursemateriallogs', userMaterialLogSchema);
export default UserCourseMaterialLogs;

