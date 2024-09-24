const { checkChangeMobileValidation } = require("./checkChangeMobileValidation");
const { checkRegistrationOtpValidation } = require("./checkRegistrationOtpValidation");
const { checkCookLoginValidation } = require("./checkCookLoginValidation");
const { checkCookRegisterValidation } = require("./checkCookRegisterValidation");
const { checkEditCookValidation } = require("./checkEditCookValidation");
const { checkEditHouseCookValidation } = require("./checkEditHouseCookValidation");
const { checkEditCateringValidation } = require("./checkEditCateringValidation");
const { checkEditChefValidation } = require("./checkEditChefValidation");
const { checkEditPartycookValidation } = require("./checkEditPartycookValidation");
const { checkPaymentCreateValidation } = require("./checkPaymentCreateValidation");
const { checkPaymentConfirmValidation } = require("./checkPaymentConfirmValidation");
const { checkWhatsappNumberValidation } = require("./checkWhatsappNumberValidation");
const { checkWhatsappOtpValidation } = require("./checkWhatsappOtpValidation");
const { verifyNewMobileOtpValidation } = require("./verifyNewMobileOtpValidation");
const { updateNewMobileValidation } = require("./updateNewMobileValidation");
const { changePasswordValidation } = require("./changePasswordValidation");
module.exports = {
    changePasswordValidation,
    updateNewMobileValidation,
    verifyNewMobileOtpValidation,
    checkChangeMobileValidation,
    checkRegistrationOtpValidation,
    checkCookLoginValidation,
    checkCookRegisterValidation,
    checkEditCookValidation,
    checkEditHouseCookValidation,
    checkEditCateringValidation,
    checkEditChefValidation,
    checkEditPartycookValidation,
    checkPaymentConfirmValidation,
    checkPaymentCreateValidation,
    checkWhatsappNumberValidation,
    checkWhatsappOtpValidation
}