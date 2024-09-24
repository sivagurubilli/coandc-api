'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

var userActivityLogsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    activity: {
        type: String, required: true, enum: [
            "user_login",
            "viewed_job_alerts",
            "test_series_attempted",
            "test_series_submitted",
            "current_affairs_viewed",
            "quiz_viewed",
            "fundamental_finaltest_viewed",
            "fundamental_finaltest_submitted",
            "fundamental_material_viewed",
            "fundamental_material_submitted",
            "course_finaltest_viewed",
            "course_finaltest_submitted",
            "course_material_viewed",
            "course_material_submitted"
        ]
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
});
userActivityLogsSchema.index({ userId: 1, activity: 1 });
const UserActivityLogs = mongoose.model('useractivities', userActivityLogsSchema);
export default UserActivityLogs;