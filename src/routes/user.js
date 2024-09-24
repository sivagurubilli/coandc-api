import express from 'express';
import {
  UserController, AdminController, CommonController, PaymentsController, CourseController,
  FundamentalController, SeriesController
} from '../controllers/index.js';
import ValidateHttpMethods from '../../middlewares/validatHttpMethods.js';
import AuthMiddleware from '../../middlewares/authMiddleware.js';
import multer from 'multer';
const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    cb(null, '')
  }
})
const upload = multer({ storage: storage }).single('file');

const UserRouter = express.Router();
UserRouter.post('/upload-file', AuthMiddleware.validateUserAccessToken, upload, CommonController.uploadFile);

UserRouter.route('/fetch-config')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken, UserController.getconfig);

UserRouter.route('/signup')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(UserController.signup);

  UserRouter.route('/true-caller-signup')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(UserController.TrueCallersignup);
  

UserRouter.route('/verify/signup-otp')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(UserController.verifySignupOtp);

UserRouter.route('/login')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(UserController.login);

UserRouter.route('/verify/login-otp')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(UserController.verifyLoginOtp);

UserRouter.route('/fetch-profile')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken, UserController.fetchProfile);

UserRouter.route('/edit-profile')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateUserAccessToken, UserController.editProfile);

UserRouter.route('/generate/access-token')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(
    AuthMiddleware.validateUserRefreshToken,
    UserController.generateNewAccessToken,
  );

UserRouter.route('/fetch-current-affairs')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AdminController.fetchCurrentAffairsByUser);

UserRouter.route('/save/current-affair-log')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AdminController.saveCurrentAffairLog);

UserRouter.route('/fetch-top-current-affairs')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AdminController.getTopCurrentAffairs);

UserRouter.route('/fetch-quiz-category')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AdminController.getQuizCategoriesList);

UserRouter.route('/fetch-quiz-content')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    UserController.getQuizContentsListByUser);

UserRouter.route('/save/quiz-content-log')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    UserController.readQuizContent);

//Course And Plan Api's
UserRouter.route('/fetch-plans')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    CommonController.getPlansList);

UserRouter.route('/create-rzp-payment')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    PaymentsController.createRzpPayment);

UserRouter.route('/store-rzp-payment')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    PaymentsController.storeRzpPayment);


//Upgrade-Api's
UserRouter.route('/fetch-upgrade-plans')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkUpgradePlanAccess,
    PaymentsController.getUpgradePlansList);

UserRouter.route('/create-rzp-upgrade-payment')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkUpgradePlanAccess,
    PaymentsController.initiateUpgradePlanPayment);

UserRouter.route('/store-rzp-upgrade-payment')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkUpgradePlanAccess,
    PaymentsController.confirmRzpUpgradePlanPayment);


//Course_Api's
UserRouter.route('/fetch-courses-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    CourseController.fetchCourses);

UserRouter.route('/enroll-course')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    CourseController.enrollCourse);

UserRouter.route('/disenroll-course')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    CourseController.disenrollCourse);

UserRouter.route('/fetch-enrolled-courses')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    CourseController.getUserEnrolledCourses);

UserRouter.route('/fetch-chapters-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    CourseController.getChaptersListByUser);

UserRouter.route('/fetch-units-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    CourseController.getUnitsListByUser);

UserRouter.route('/fetch-unit-details')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    CourseController.getUnitDetailsByUser);

UserRouter.route('/save-course-material-log')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    CourseController.saveMaterialLog);

UserRouter.route('/check-course-finaltest-access')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    CourseController.checkFinalTestAccess);

UserRouter.route('/submit-course-finaltest')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    CourseController.submitFinaltest);


//Fundamental_Api's
UserRouter.route('/fundamentals/fetch-subjects-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    FundamentalController.fetchFundamentalSubjectsListByUser);

UserRouter.route('/fundamentals/fetch-units-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    FundamentalController.fetchFundamentalUnitByUser);

UserRouter.route('/fundamentals/fetch-unit-details')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    FundamentalController.getFundamentalUnitDetailsByUser);

UserRouter.route('/fundamentals/save-material-log')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    FundamentalController.saveMaterialLog);

UserRouter.route('/fundamentals/check-finaltest-access')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    FundamentalController.checkFinalTestAccess);

UserRouter.route('/fundamentals/submit-finaltest')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    FundamentalController.submitFinaltest);

/**********************SERIES-TEST-API'S*******************/
UserRouter.route('/series/fetch-series-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    SeriesController.getSeriesListbyUser);

UserRouter.route('/series/fetch-series-test')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    SeriesController.getSeriesTestByUser);

UserRouter.route('/series/exit-series-test')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    SeriesController.exitSeriesTest);

UserRouter.route('/series/submit-series-test')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    SeriesController.submitSeriesTest);

UserRouter.route('/series/fetch-ongoing-tests')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    SeriesController.fetchOngoingSeriesTests);


UserRouter.route('/series/fetch-test-scores')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    SeriesController.fetchTestScores);

UserRouter.route('/series/fetch-test-log')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AuthMiddleware.checkSubscriptionAccess,
    SeriesController.fetchSeriesTestLogs);

UserRouter.route('/fetch-faq')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AdminController.fetchFaqs);

UserRouter.route('/fetch-job-alerts')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    AdminController.fetchAlerts);

//Ticket-api's
UserRouter.route('/add-ticket')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    UserController.createTicket);

UserRouter.route('/fetch-tickets')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateUserAccessToken,
    UserController.fetchTickets);

UserRouter.route('/delete-ticket')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateUserAccessToken,
    UserController.deleteTicket);


//Activity_Logs_Apis
UserRouter.route('/add-activity-log')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateUserAccessToken,
    UserController.storeUserActivityLog);


export default UserRouter;
