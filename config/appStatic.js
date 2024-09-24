exports.data = {
  sms: {
    otpMsg: 'Your OTP from {projectName} is {otp}',
  },
  testMobileno: 8971898731,
  verifyEmail: {
    link: `verify`,
    type: 'verification',
    subject: 'Email Verification for {project}',
  },
  forgotPassword: {
    subject: 'Forgot Password for {project}',
    type: 'forgotPassword',
    link: 'password/forgot'
  },
  errorMsg: {
    paramNotFound: '{param} is not found in request'
  },
  email: {
    registration: {
      subject: 'Welcome to {projectName}'
    },
    communication: {
      subject: `{projectName} update`
    }
  }
}