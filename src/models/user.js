'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  mobileNo: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  profileImageUrl: { type: String, trim: true },
  isEmailVerified: { type: Boolean, default: false },
  isMobileVerified: { type: Boolean, default: false },
  lastLoginDateTime: { type: Date },
  status: { type: Number, default: 0 },
  planStartsAt: { type: Date },
  planExpiresAt: { type: Date },
  subscriptionStatus: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  deviceToken: { type: String },
});
userSchema.index({ name: 1, mobileNo: 1, isDeleted: 1 });
const User = mongoose.model('users', userSchema);
export default User;
