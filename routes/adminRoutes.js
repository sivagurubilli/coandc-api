var express = require('express');
var multer = require('multer');
var router = express.Router();
let { cook, payment, file, admin, jobs, events, dropdown, testimonial, faq, helpchat, custom } = require('../controllers');
let { validateAdminOrSupportAccessToken, validateCookAccessToken, validateHouseCookAccess, validateCateringAccess, validateChefAccess, validatePartyCookAccess } = require("../middlewares");
const { PlansValidation, CookValidation, EmployerValidation } = require("../validations/admin");
let { plans } = require('../controllers');
const { isValidGetMethod, isValidPostMethod, isValidPutMethod, isValidDeleteMethod } = require("../middlewares/validateHttpMethods");
const { checkCreateJobPostValidation, checkEditJobPostValidation } = require("../validations/employer/jobs");
const { checkCreateEventValidation, checkEditEventValidation } = require("../validations/employer/events");
const { editReqValidation } = require("../validations/employer/clientRequirements/index");
const { createExecutiveValidation } = require("../validations/csExecutive")
//MULTER_OPERATIONS
const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
});
const upload = multer({ storage: storage }).array('file', 10)
//FILE_UPLOAD_APIS
router.route('/upload').all(isValidPostMethod).post(file.upload);

//Cook_Plan_APIS
router.route('/cookplans/store').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, PlansValidation.checkCreateCookPlanValidation, plans.createCookPlans);
router.route('/cookplans/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, plans.getCookPlans);
router.route('/cookplans/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, PlansValidation.checkEditCookPlanValidation, plans.editCookPlans);
router.route('/cookplans/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, plans.deleteCooksPlan);

//Client_Plan_APIS
router.route('/clientplans/store').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, PlansValidation.checkCreateClientPlanValidation, plans.createClientPlans);
router.route('/clientplans/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, plans.getClientPlans);
router.route('/clientplans/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, PlansValidation.checkEditClientPlanValidation, plans.editClientPlans);
router.route('/clientplans/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, plans.deleteClientPlan);

//Employer_Plan_Apis
router.route('/employerplans/store').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, PlansValidation.checkCreateEmployerPlanValidation, plans.createEmployerPlans);
router.route('/employerplans/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, plans.getEmployerPlans);
router.route('/employerplans/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, PlansValidation.checkEditEmployerPlanValidation, plans.editEmployerPlans);
router.route('/employerplans/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, plans.deleteEmployerPlan);

//LOGIN_APIS
router.route('/login').all(isValidPostMethod).post(admin.adminLogin);
router.route('/activites/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getActivitiesList);
router.route('/tickets/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.fetchTickets);
router.route('/securities/add').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.storeSecurityKey);
router.route('/securities/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.fetchSecurityKey);
router.route('/plans/allot').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, payment.allotPlansByAdmin);
router.route('/change/cookRole').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.changeRole);
router.route('/applications-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getApplicationsList);
router.route('/allUsers/graph').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getAllUsersGraphData);
router.route('/dashboard/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getDashboardData);
router.route('/forgotPassword').all(isValidPostMethod).post(admin.adminForgotPassword);
router.route('/forgotPassword/verifyOtp').all(isValidPostMethod).post(PlansValidation.changeAdminPasswordValidation, admin.validateAdminForgotOtp);


//LISTING_APIS
router.route('/housecooks-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getHousecooksList);
router.route('/partycooks-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getPartyCooksList);
router.route('/chefs-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getChefsList);
router.route('/caterings-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getCateringsList);
router.route('/clients-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getClientsList);
router.route('/employers-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getEmployersList);

router.route('/employer-details/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getEmployersDetails);
router.route('/cook-details/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getCookDetails);

router.route('/cook-profile/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.editCook);
router.route('/edit/profile/houseCook').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, CookValidation.editHousecookValidation, admin.edithouseCookProfile);
router.route('/edit/profile/catering').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, CookValidation.editCateringValidation, admin.editCateringProfile);
router.route('/edit/profile/chef').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, CookValidation.editChefValidation, admin.editChefProfile);
router.route('/edit/profile/partyCook').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, CookValidation.editPartycookValidation, admin.editPartycookProfile);

router.route('/employer-profile/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.editEmployer);
router.route('/reset-password').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.resetPassword);

//Jobs
router.route('/jobs-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getJobsList);
router.route('/job-details/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getJobDetails);
router.route('/jobpost/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, checkEditJobPostValidation, jobs.editJobPosts);
router.route('/trigger/jobNotification').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.triggerJobNotification);
//Events
router.route('/events-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getEventsList);
router.route('/event-details/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getEventDetails);
router.route('/event/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, checkEditEventValidation, admin.editEvent);
router.route('/requirement/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, editReqValidation, admin.editClientRequirements);
router.route('/trigger/eventNotification').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.triggerEventNotification);

//Payments
router.route('/payments-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getPaymentsList);
router.route('/payment-details/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getPaymentDetails);


//CHEF_EMPLOYERS_FINDING_APIS
router.route('/find-chefs').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.findChefs);
router.route('/find-party-cooks').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.findPartyCooks);
router.route('/find-caterings').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.findCaterings);
router.route('/find-house-cooks').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.findHouseCooks);
router.route('/find-employers').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.findEmployers);
router.route('/find-clients').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.findClients);
router.route('/allCooksList/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getAllCooksList);

//CS_EXECUTIVE_APIS
router.route('/csexecutive/create').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.createCSExecutive);
router.route('/csexecutives-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.fetchCSExecutiveList);
router.route('/csexecutives-details/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getCSExecutiveDetails);
router.route('/csexecutives/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.editCSExecutive);
router.route('/csexecutives/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, admin.deleteCSExecutive);
router.route('/roles/create').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, dropdown.createRole);
router.route('/roles-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, dropdown.getRoles);

//Account_Disposal_APIS
router.route('/suspend-account').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.supsendAccount);
router.route('/disposal-accounts-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getDisposalAccounts);
router.route('/revoke-suspension').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.revokeSuspension);
router.route('/revoke-delete-request').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.revokeDeleteRequest);
router.route('/delete-account').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, admin.deleteAccount);

//Testimonial_APIS
router.route('/testimonials/add').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, testimonial.createTestimonial);
router.route('/testimonials/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, testimonial.fetchTestimonials);
router.route('/testimonials/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, testimonial.editTestimonial);
router.route('/testimonials/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, testimonial.deleteTestimonial);

//FAQ_APIS
router.route('/faq/add').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, faq.createFaq);
router.route('/faq/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, faq.fetchFaqs);
router.route('/faq/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, faq.editFaq);
router.route('/faq/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, faq.deleteFaq);

//Template_APIS
router.route('/templates-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getResumeTemplatesList);

//Cancel_APIS
router.route('/cancelOrRefund/plans').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, payment.cancelOrRefundPlans)
router.route('/payment/upgradeEmployerPlan').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.upgradeEmployerPlan)

router.route('/reports-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getReportsList);


//Help_chat_apis
router.route('/helpchat/add').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, helpchat.addHelpChat);
router.route('/helpchat/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, helpchat.getHelpChatList);
router.route('/helpchat/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, helpchat.editHelpChat);
router.route('/helpchat/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, helpchat.deleteHelpChat);

//Custom_admin_apis
router.route('/job/add').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, EmployerValidation.addJobValidation, custom.addJob);
router.route('/event/add').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, EmployerValidation.addEventValidation, custom.addEvent);
router.route('/share/cookProfile').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, custom.shareCookProfile);
router.route('/share/cookProfile/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, custom.getSharedCookProfiles);
router.route('/share/cookProfile/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, custom.deleteSharedProfile);
router.route('/share/cookProfile/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, custom.editSharedCookProfile);
router.route('/job/viewUpdate').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.updateJobView);


//Blocking_Mac_address
//Help_chat_apis
router.route('/macaddress/block').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.blockMacAddress);
router.route('/macaddress-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getBlockedMacAddressList);
router.route('/macaddress/unblock').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.unblockMacAddress);


//Allowing MAC Address
router.route('/macaddress/allow').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.allowMacAddress);
router.route('/allowedMacaddress-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getAllowedMacAddressList);
router.route('/macaddress/remove').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, admin.removeAllowedMacAddress);

//Advt_apis
router.route('/advertisement/add').all(isValidPostMethod).post(validateAdminOrSupportAccessToken, admin.addAdvertisement);
router.route('/advertisement-list/fetch').all(isValidGetMethod).get(validateAdminOrSupportAccessToken, admin.getAdvtList);
router.route('/advertisement/edit').all(isValidPutMethod).put(validateAdminOrSupportAccessToken, admin.editAdvertisement);
router.route('/advertisement/delete').all(isValidDeleteMethod).delete(validateAdminOrSupportAccessToken, admin.deleteAdvertisement);


module.exports = router;
