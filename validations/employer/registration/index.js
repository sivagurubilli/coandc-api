const { checkEmployerRegisterValidation } = require("./checkEmployerRegistrationValidation");
const { checkEmployerOtpValidation } = require("./checkEmployerOtpValidation");
const { checkEmployerLoginValidation } = require("./checkEmployerLoginValidation");
const { checkChangeEmployerMobileValidation } = require("./checkChangeEmployerMobileValidation");
const { checkEditEmployerValidation } = require("./checkEditEmployerValidation");
const { checkWhatsappNumberValidation } = require("./checkWhatsappNumberValidation");
const { checkWhatsappOtpValidation } = require("./checkWhatsappOtpValidation");
const { verifyNewMobileOtpValidation } = require("./verifyNewMobileOtpValidation");
const { updateNewMobileValidation } = require("./updateNewMobileValidation");

module.exports = {
    checkEmployerRegisterValidation,
    checkEmployerOtpValidation,
    checkEmployerLoginValidation,
    checkChangeEmployerMobileValidation,
    checkEditEmployerValidation,
    checkWhatsappOtpValidation,
    checkWhatsappNumberValidation,
    verifyNewMobileOtpValidation,
    updateNewMobileValidation
}