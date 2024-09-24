var express = require('express');
var multer = require('multer');
var router = express.Router();
const { isValidGetMethod, isValidPostMethod, isValidPutMethod, isValidDeleteMethod } = require("../middlewares/validateHttpMethods");
let { cook, payment, file, plans, events, jobs, admin } = require('../controllers');
let { validateCookAccessToken, validateHouseCookAccess, validateCateringAccess,
    validateChefAccess, validatePartyCookAccess, validateCateringOrPartyCookAccess } = require("../middlewares");
const { checkCookRegisterValidation, checkChangeMobileValidation,
    checkRegistrationOtpValidation, checkCookLoginValidation, checkEditCookValidation,
    checkEditHouseCookValidation, checkEditCateringValidation, checkEditChefValidation, checkEditPartycookValidation,
    checkPaymentCreateValidation, checkPaymentConfirmValidation, checkWhatsappNumberValidation, checkWhatsappOtpValidation, updateNewMobileValidation, verifyNewMobileOtpValidation } = require("../validations/cook");
const { PlansValidation } = require("../validations/admin");
const { findEventsValidation, findJobsValidation, findHouseCookJobsValidation } = require("../validations/employer/findCooks");


//MULTER_OPERATIONS
const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
});
const upload = multer({ storage: storage }).array('file', 10);

//FILE_UPLOAD_APIS
router.route('/upload').all(isValidPostMethod).post(validateCookAccessToken, file.upload);

//PROFILE_APIS
router.route('/signup').all(isValidPostMethod).post(checkCookRegisterValidation, cook.cookRegister);
router.route('/signup/changemobilenumber').all(isValidPutMethod).put(checkChangeMobileValidation, cook.changeMobileNumber);
router.route('/signup/resendOtp').all(isValidPostMethod).post(cook.resendOtp);
router.route('/signup/verifyOtp').all(isValidPostMethod).post(checkRegistrationOtpValidation, cook.verifyCookOtp);
router.route('/check/whatsappNumber').all(isValidPostMethod).post(validateCookAccessToken, cook.checkWhatsappNumber);
router.route('/edit/whatsappNumber').all(isValidPutMethod).put(validateCookAccessToken, checkWhatsappNumberValidation, cook.updateWhatsappNumber);
router.route('/verify/whatsappOtp').all(isValidPutMethod).put(validateCookAccessToken, checkWhatsappOtpValidation, cook.verifyWhatsappOtp);
router.route('/login').all(isValidPostMethod).post(checkCookLoginValidation, cook.cookLogin);
router.route('/fetch/profile').all(isValidGetMethod).get(validateCookAccessToken, cook.getCookProfile);
router.route('/update/last-login-time').all(isValidPutMethod).put(validateCookAccessToken, cook.updateLoginTime);
router.route('/login/changemobilenumber').all(isValidPutMethod).put(validateCookAccessToken, updateNewMobileValidation, cook.updateMobileNumber);
router.route('/login/updateMobile/verifyOtp').all(isValidPutMethod).put(validateCookAccessToken, verifyNewMobileOtpValidation, cook.verifyNewMobileNumberOtp);
router.route('/signup/forgotPassword').all(isValidPostMethod).post(cook.forgotPassword);
router.route('/signup/forgotPassword/verifyOtp').all(isValidPostMethod).post(cook.verifyOtpAndUpdatePassword);
router.route('/login/verifyEmail').all(isValidPostMethod).post(validateCookAccessToken, cook.verifyEmail);
router.route('/login/changeEmail').all(isValidPostMethod).post(validateCookAccessToken, cook.changeEmail);
router.route('/login/updateEmailVerificationStatus').all(isValidGetMethod).get(cook.updateEmailVerificationStatus);
router.route('/disable-account').all(isValidGetMethod).get(validateCookAccessToken, cook.disableAccount);
router.route('/enable-account').all(isValidGetMethod).get(validateCookAccessToken, cook.enableAccount);
router.route('/delete-account/request/add').all(isValidDeleteMethod).delete(validateCookAccessToken, cook.raiseDeleteRequest);
router.route('/generate-resume').all(isValidPostMethod).post(validateCookAccessToken, validateChefAccess, cook.generateResume)
router.route('/dashboard').all(isValidGetMethod).get(validateCookAccessToken, cook.getDashboardData);
router.route('/revoke-delete-request').all(isValidGetMethod).get(validateCookAccessToken, cook.revokeDeleteRequest);
router.route('/update/weavyId').all(isValidPutMethod).put(validateCookAccessToken, cook.updateWeavyId);
router.route('/change/role').all(isValidPutMethod).put(validateCookAccessToken, cook.changeRole);
router.route('/store/employer-rating').all(isValidPostMethod).post(validateCookAccessToken, cook.storeEmployerRating);
router.route('/advertisement-list/fetch').all(isValidGetMethod).get(validateCookAccessToken, admin.getAdvtList);


//EDIT_PROFILE_APIS
router.route('/edit/profile').all(isValidPutMethod).put(validateCookAccessToken, checkEditCookValidation, cook.editCookProfile);
router.route('/edit/profile/houseCook').all(isValidPutMethod).put(validateCookAccessToken, validateHouseCookAccess, checkEditHouseCookValidation, cook.edithouseCookProfile);
router.route('/edit/profile/catering').all(isValidPutMethod).put(validateCookAccessToken, validateCateringAccess, checkEditCateringValidation, cook.editCateringProfile);
router.route('/edit/profile/chef').all(isValidPutMethod).put(validateCookAccessToken, validateChefAccess, checkEditChefValidation, cook.editChefProfile);
router.route('/edit/profile/partycook').all(isValidPutMethod).put(validateCookAccessToken, validatePartyCookAccess, checkEditPartycookValidation, cook.editPartycookProfile);
router.route('/edit/chef/jobseeking').all(isValidPutMethod).put(validateCookAccessToken, validateChefAccess, cook.updateJobSeeking);

//Plan_Purchasing_APIS
router.route('/cookplans/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateChefAccess, plans.getCookPlans);
router.route('/payment/initiate').all(isValidPostMethod).post(validateCookAccessToken, validateChefAccess, checkPaymentCreateValidation, payment.initiateCookSubscription);
router.route('/payment/confirm').all(isValidPutMethod).put(validateCookAccessToken, validateChefAccess, checkPaymentConfirmValidation, payment.confirmSubscriptionPayment);
router.route('/payments/history').all(isValidGetMethod).get(validateCookAccessToken, validateChefAccess, payment.getCookPayments);

//FINDINGS
router.route('/find-events').all(isValidPostMethod).post(validateCookAccessToken, validateCateringOrPartyCookAccess, findEventsValidation, events.findEvents);
router.route('/view-event').all(isValidGetMethod).get(validateCookAccessToken, validateCateringOrPartyCookAccess, events.viewEvent);
router.route('/apply-event').all(isValidPostMethod).post(validateCookAccessToken, validateCateringOrPartyCookAccess, events.applyEvent);
router.route('/applied-events/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateCateringOrPartyCookAccess, events.fetchAppliedEventsByCook);
router.route('/shortlist-event').all(isValidPostMethod).post(validateCookAccessToken, validateCateringOrPartyCookAccess, events.applyEventShortlist);
router.route('/shortlisted-events/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateCateringOrPartyCookAccess, events.fetchShortlistedEventsByCook);

router.route('/find-jobs').all(isValidPostMethod).post(validateCookAccessToken, validateChefAccess, findJobsValidation, jobs.findJobs);
router.route('/view-job').all(isValidGetMethod).get(validateCookAccessToken, validateChefAccess, jobs.viewJob);
router.route('/apply-chef-job').all(isValidPostMethod).post(validateCookAccessToken, validateChefAccess, jobs.applyJob);
router.route('/applied-chef-jobs/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateChefAccess, jobs.fetchAppliedJobsByCook);
router.route('/shortlist-chef-job').all(isValidPostMethod).post(validateCookAccessToken, validateChefAccess, jobs.applyJobShortlist);
router.route('/view-employer/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateChefAccess, cook.viewEmployerDetails);
router.route('/shortlisted-chef-jobs/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateChefAccess, jobs.fetchShortlistedJobsByCook);

router.route('/cancel/application').all(isValidPutMethod).put(validateCookAccessToken, cook.cancelApplication);
router.route('/remove-shortlist/application').all(isValidDeleteMethod).delete(validateCookAccessToken, cook.removeShortlistedApplication);
router.route('/find-housecook-jobs').all(isValidPostMethod).post(validateCookAccessToken, validateHouseCookAccess, findHouseCookJobsValidation, cook.findHouseCookJobs);
router.route('/view-housecook-job').all(isValidGetMethod).get(validateCookAccessToken, validateHouseCookAccess, cook.viewHouseCookJob);
router.route('/apply-housecook-job').all(isValidPostMethod).post(validateCookAccessToken, validateHouseCookAccess, cook.applyHouseJob);
router.route('/applied-housecook-jobs/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateHouseCookAccess, cook.fetchAppliedHouseJobsByCook);
router.route('/shortlist-housecook-job').all(isValidPostMethod).post(validateCookAccessToken, validateHouseCookAccess, cook.applyHoseJobShortlist);
router.route('/shortlisted-housecook-jobs/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateHouseCookAccess, cook.fetchShortlistedHousejobsByCook);

router.route('/store/activity-logs').all(isValidPostMethod).post(validateCookAccessToken, cook.storeActivityLog);
router.route('/fetch/activity-logs').all(isValidGetMethod).get(validateCookAccessToken, cook.fetchActivityLogs);
router.route('/report/submit').all(isValidPostMethod).post(validateCookAccessToken, cook.reportSubmit);

router.route('/templates-list/fetch').all(isValidGetMethod).get(validateCookAccessToken, validateChefAccess, admin.getResumeTemplatesList);


module.exports = router;