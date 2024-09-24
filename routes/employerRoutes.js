var express = require('express');
var multer = require('multer');
var router = express.Router();
const { isValidGetMethod, isValidPostMethod, isValidPutMethod, isValidDeleteMethod } = require("../middlewares/validateHttpMethods");
let { cook, employer, file, payment, plans, jobs, events, admin } = require('../controllers');
let { validateEmployerAccessToken, validateClientAccess, validateEmployerAccess } = require("../middlewares/index");
const { checkEmployerRegisterValidation, checkEmployerOtpValidation,
    checkEmployerLoginValidation, checkChangeEmployerMobileValidation,
    checkEditEmployerValidation, checkWhatsappNumberValidation, checkWhatsappOtpValidation, updateNewMobileValidation, verifyNewMobileOtpValidation } = require("../validations/employer/registration");
const { checkAddReqValidation } = require("../validations/employer/clientRequirements/index");
const { checkClientPaymentConfirmValidation, checkClientPaymentCreateValidation, checkEmployerPaymentCreateValidation, checkEmployerPaymentConfirmValidation } = require("../validations/employer/payment");;
const { checkCreateJobPostValidation, checkEditJobPostValidation } = require("../validations/employer/jobs");
const { checkCreateEventValidation, checkEditEventValidation } = require("../validations/employer/events");
const { findChefsValidation, findPartyCookValidation, findCateringsValidation, findHouseCookValidation } = require("../validations/employer/findCooks");

//MULTER_OPERATIONS
const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
});
const upload = multer({ storage: storage }).array('file', 10);



//FILE_UPLOAD_APIS
router.route('/upload').all(isValidPostMethod).post(validateEmployerAccessToken, file.upload);

//Register_APIS
router.route('/signup').all(isValidPostMethod).post(checkEmployerRegisterValidation, employer.employerRegister);;
router.route('/signup/changemobilenumber').all(isValidPutMethod).put(checkChangeEmployerMobileValidation, employer.changeMobileNumber);
router.route('/signup/resendOtp').all(isValidPostMethod).post(employer.resendOtp);
router.route('/signup/verifyOtp').all(isValidPostMethod).post(checkEmployerOtpValidation, employer.verifyEmployerOtp);
router.route('/login').all(isValidPostMethod).post(checkEmployerLoginValidation, employer.employerLogin);
router.route('/fetch/profile').all(isValidGetMethod).get(validateEmployerAccessToken, employer.getEmployerProfile);
router.route('/edit/profile').all(isValidPutMethod).put(validateEmployerAccessToken, checkEditEmployerValidation, employer.editEmployer);
router.route('/check/whatsappNumber').all(isValidPostMethod).post(validateEmployerAccessToken, cook.checkWhatsappNumber);
router.route('/edit/whatsappNumber').all(isValidPutMethod).put(validateEmployerAccessToken, checkWhatsappNumberValidation, employer.updateWhatsappNumber);
router.route('/verify/whatsappOtp').all(isValidPutMethod).put(validateEmployerAccessToken, checkWhatsappOtpValidation, employer.verifyWhatsappOtp);
router.route('/update/last-login-time').all(isValidPutMethod).put(validateEmployerAccessToken, employer.updateLoginTime);
router.route('/login/changemobilenumber').all(isValidPutMethod).put(validateEmployerAccessToken, updateNewMobileValidation, employer.updateMobileNumber);
router.route('/login/updateMobile/verifyOtp').all(isValidPutMethod).put(validateEmployerAccessToken, verifyNewMobileOtpValidation, employer.verifyNewMobileNumberOtp);
router.route('/signup/forgotPassword').all(isValidPostMethod).post(employer.forgotPassword);
router.route('/signup/forgotPassword/verifyOtp').all(isValidPostMethod).post(employer.verifyOtpAndUpdatePassword);
router.route('/login/verifyEmail').all(isValidPostMethod).post(validateEmployerAccessToken, employer.verifyEmail);
router.route('/login/changeEmail').all(isValidPostMethod).post(validateEmployerAccessToken, employer.changeEmail);
router.route('/login/updateEmailVerificationStatus').all(isValidGetMethod).get(validateEmployerAccessToken, cook.updateEmailVerificationStatus);
router.route('/shortlist/cook-profile').all(isValidPostMethod).post(validateEmployerAccessToken, employer.shortlistCookProfile);
router.route('/viewed-profiles/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, employer.fetchViewedProfiles);
router.route('/shortlisted-profiles/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, employer.fetchShortlistedProfiles);
router.route('/shortlist-profile/delete').all(isValidDeleteMethod).delete(validateEmployerAccessToken, employer.removeShortlistedProfile);
router.route('/disable-account').all(isValidGetMethod).get(validateEmployerAccessToken, employer.disableAccount);
router.route('/enable-account').all(isValidGetMethod).get(validateEmployerAccessToken, employer.enableAccount);
router.route('/delete-account/request/add').all(isValidDeleteMethod).delete(validateEmployerAccessToken, employer.raiseDeleteRequest);
router.route('/dashboard').all(isValidGetMethod).get(validateEmployerAccessToken, employer.getDashboardData);
router.route('/revoke-delete-request').all(isValidGetMethod).get(validateEmployerAccessToken, employer.revokeDeleteRequest);
router.route('/cook-details/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, employer.getCookDetails);
router.route('/store/cook-rating').all(isValidPostMethod).post(validateEmployerAccessToken, employer.storeCookRating);
router.route('/update/weavyId').all(isValidPutMethod).put(validateEmployerAccessToken, employer.updateWeavyId);
router.route('/advertisement-list/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, admin.getAdvtList);


//ClientRequirment_APIS
router.route('/requirements/add').all(isValidPostMethod).post(validateEmployerAccessToken, validateClientAccess, checkAddReqValidation, employer.addClientRequirements);
router.route('/requirements/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, employer.getClientRequirement);
router.route('/housejob-applications-list/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, employer.fetchHouseJobApplications);
router.route('/housejob-application/view').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, employer.viewHouseJobApplication);
router.route('/housejob-application/edit').all(isValidPutMethod).put(validateEmployerAccessToken, validateClientAccess, employer.updateHouseJobApplication);

//Client_Subscription_APIS
router.route('/clientplans/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, plans.getClientPlans);
router.route('/clientplan/payment/initiate').all(isValidPostMethod).post(validateEmployerAccessToken, validateClientAccess, checkClientPaymentCreateValidation, payment.initiateClientSubscription);
router.route('/clientsplan/payment/confirm').all(isValidPutMethod).put(validateEmployerAccessToken, validateClientAccess, checkClientPaymentConfirmValidation, payment.confirmClientSubscriptionPayment);
router.route('/clientsplan/payment/history').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, payment.getClientPayments);

//Employer_SUBSCRIPTION_APIS
router.route('/employerplans/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateEmployerAccess, plans.getEmployerPlans);
router.route('/employerplan/payment/initiate').all(isValidPostMethod).post(validateEmployerAccessToken, validateEmployerAccess, checkEmployerPaymentCreateValidation, payment.initiateEmployerSubscription);
router.route('/employerplan/payment/confirm').all(isValidPutMethod).put(validateEmployerAccessToken, validateEmployerAccess, checkEmployerPaymentConfirmValidation, payment.confirmEmployerSubscriptionPayment);
router.route('/employerplan/payment/history').all(isValidGetMethod).get(validateEmployerAccessToken, validateEmployerAccess, payment.getEmployerPayments);

//Employer_Assistance_Subscription_Apis
router.route('/employerplan/supportAssistance/payment/initiate').all(isValidPostMethod).post(validateEmployerAccessToken, validateEmployerAccess, payment.initiateEmployerPlanAssistance);
router.route('/employerplan/supportAssistance/payment/confirm').all(isValidPutMethod).put(validateEmployerAccessToken, validateEmployerAccess, payment.confirmEmployerAssistanceSubscriptionPayment);

//EMPLOYER_JOB_POSTING_APIS
router.route('/jobpost/create').all(isValidPostMethod).post(validateEmployerAccessToken, validateEmployerAccess, checkCreateJobPostValidation, jobs.createJobPost);
router.route('/jobpost/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateEmployerAccess, jobs.getJobPosts);
router.route('/jobpost/edit').all(isValidPutMethod).put(validateEmployerAccessToken, validateEmployerAccess, checkEditJobPostValidation, jobs.editJobPosts);
router.route('/job-applications-list/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateEmployerAccess, jobs.fetchChefJobApplications);
router.route('/job-application/view').all(isValidGetMethod).get(validateEmployerAccessToken, validateEmployerAccess, jobs.viewChefJobApplication);
router.route('/job-application/edit').all(isValidPutMethod).put(validateEmployerAccessToken, validateEmployerAccess, jobs.updateChefJobApplication);

//CLIENT_EVENT_POST_APIS
router.route('/clientEvents/create').all(isValidPostMethod).post(validateEmployerAccessToken, validateClientAccess, checkCreateEventValidation, events.eventPost);
router.route('/clientEvents/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, events.fetchEvents);
router.route('/clientEvents/edit').all(isValidPutMethod).put(validateEmployerAccessToken, validateClientAccess, checkEditEventValidation, events.editEvent);
router.route('/event-applications-list/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, events.fetchEventApplications);
router.route('/event-application/view').all(isValidGetMethod).get(validateEmployerAccessToken, validateClientAccess, events.viewEventApplication);
router.route('/event-application/edit').all(isValidPutMethod).put(validateEmployerAccessToken, validateClientAccess, events.updateEventApplication);

//CHEF_FETCHING_APIS
router.route('/find-chefs').all(isValidPostMethod).post(validateEmployerAccessToken, validateEmployerAccess, findChefsValidation, employer.fetchChefs);
router.route('/find-party-cooks').all(isValidPostMethod).post(validateEmployerAccessToken, validateClientAccess, findPartyCookValidation, employer.fetchPartyCooks);
router.route('/find-caterings').all(isValidPostMethod).post(validateEmployerAccessToken, validateClientAccess, findCateringsValidation, employer.fetchCaterings);
router.route('/find-house-cooks').all(isValidPostMethod).post(validateEmployerAccessToken, validateClientAccess, findHouseCookValidation, employer.fetchHouseCooks);

router.route('/store/activity-logs').all(isValidPostMethod).post(validateEmployerAccessToken, employer.storeActivityLog);
router.route('/fetch/activity-logs').all(isValidGetMethod).get(validateEmployerAccessToken, employer.fetchActivityLogs);
router.route('/report/submit').all(isValidPostMethod).post(validateEmployerAccessToken, employer.reportSubmit);
router.route('/share/cookProfiles/fetch').all(isValidGetMethod).get(validateEmployerAccessToken, employer.getSharedCookProfiles);
router.route('/shared/cookProfile/viewDetails').all(isValidGetMethod).get(validateEmployerAccessToken, employer.viewSharedCookDetails);


module.exports = router;