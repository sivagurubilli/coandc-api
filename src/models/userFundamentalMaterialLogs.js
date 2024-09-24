'use strict';

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userMaterialLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    unitId: { type: Schema.Types.ObjectId, ref: "fundamentalunits" },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
const UserFundamentalMaterialLogs = mongoose.model('userfundamentalmateriallogs', userMaterialLogSchema);
export default UserFundamentalMaterialLogs;

