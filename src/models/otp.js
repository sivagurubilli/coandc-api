'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  mobileNo: String,
  otp: String,
  email: String,
  createdAt: { type: Date, expires: '15m', default: Date.now },
});
otpSchema.index({ mobileNo: 1, otp: 1 });
otpSchema.index({ email: 1, otp: 1 });
const Otp = mongoose.model('otps', otpSchema);
export default Otp;
