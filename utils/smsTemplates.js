exports.registerOtp = (otp) => {
    return `Dear User,

Your OTP for signup to cookandchef.in is ${otp} .
Valid for 15 minutes.
Please do not share this.

Regards,
Team CookandChef`
}

exports.updateMobileOtp = (otp) => {
    return `Dear User,
Your OTP to verify your Phone number in your CookandChef account is ${otp}. Valid for 15 minutes.
Thank you,
CookandChef Team`
}

exports.forgotPassword = (otp) => {
    return `Dear user,
OTP to reset your password on CookandChef.in is ${otp} .
Do not share.

Team CookandChef`
}