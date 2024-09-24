import express from 'express';
import { AdminController, CommonController, CourseController, FundamentalController, PaymentsController, SeriesController } from '../controllers/index.js';
import ValidateHttpMethods from '../../middlewares/validatHttpMethods.js';
import AuthMiddleware from '../../middlewares/authMiddleware.js';
import multer from 'multer';
const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    cb(null, '')
  }
})
const upload = multer({ storage: storage }).single('file');

const AdminRouter = express.Router();
AdminRouter.post('/upload-file', upload, AuthMiddleware.validateAdminAccessToken, CommonController.uploadFile);

AdminRouter.route('/login')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AdminController.login);

AdminRouter.route('/generate/access-token')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(
    AuthMiddleware.validateAdminRefreshToken,
    AdminController.generateNewAccessToken,
  );

//Current-Affair Apis

AdminRouter.route('/add-current-affairs')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AdminController.addCurrentAffairs);

AdminRouter.route('/fetch-current-affairs')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AdminController.fetchCurrentAffairsByAdmin);

AdminRouter.route('/edit-current-affairs')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AdminController.editCurrentAffairs);

AdminRouter.route('/delete-current-affairs')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AdminController.deleteCurrentAffairs);

//Quiz Category Apis
AdminRouter.route('/add-quiz-category')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AdminController.addQuizCategory);

AdminRouter.route('/fetch-quiz-categories')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AdminController.getQuizCategoriesList);

AdminRouter.route('/edit-quiz-category')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AdminController.editQuizCategory);

AdminRouter.route('/delete-quiz-category')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AdminController.deleteQuizCategory);

//Quiz Category Apis
AdminRouter.route('/add-quiz-content')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AdminController.addQuizContent);

AdminRouter.route('/fetch-quiz-content')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AdminController.getQuizContentList);

AdminRouter.route('/edit-quiz-content')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AdminController.editQuizContent);

AdminRouter.route('/delete-quiz-content')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AdminController.deleteQuizContent);

/*****************course-APIS**********************/
AdminRouter.route('/add-course')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    AuthMiddleware.validateAdminAccess,
    CourseController.addCourse);

AdminRouter.route('/fetch-courses')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CourseController.fetchCourses);

AdminRouter.route('/edit-course')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    CourseController.editCourse);

AdminRouter.route('/delete-course')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    CourseController.deleteCourse);

/******************subject -Routes****************/

AdminRouter.route('/add-subject')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    CourseController.addSubject);

AdminRouter.route('/fetch-subjects')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CourseController.fetchSubjects);

AdminRouter.route('/edit-subject')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    CourseController.editSubject);

AdminRouter.route('/delete-subject')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    CourseController.deleteSubject);

/******************Course-subject -Routes****************/

AdminRouter.route('/add-course-subject-combination')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    CourseController.addCourseSubjectCombination);

AdminRouter.route('/fetch-course-subject-combinations')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CourseController.fetchCourseSubjectCombination);

AdminRouter.route('/edit-course-subject-combination')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    CourseController.editCourseSubjectCombination);

AdminRouter.route('/delete-course-subject-combination')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    CourseController.deleteCourseSubjectCombination);

/******************Chapter -Routes****************/

AdminRouter.route('/add-chapter')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    CourseController.addChapter);

AdminRouter.route('/fetch-chapters')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CourseController.getChapters);

AdminRouter.route('/edit-chapter')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    CourseController.editChapter);

AdminRouter.route('/delete-chapter')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    CourseController.deleteChapter);

/******************Unit -Routes****************/
AdminRouter.route('/add-unit')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    CourseController.addUnit);

AdminRouter.route('/fetch-units')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CourseController.getUnits);

AdminRouter.route('/edit-unit')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    CourseController.editUnits);

AdminRouter.route('/delete-unit')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    CourseController.deleteUnit);

/******************Material -Routes****************/
AdminRouter.route('/add-material')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    CourseController.addMaterial);

AdminRouter.route('/fetch-materials')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CourseController.getMaterials);

AdminRouter.route('/edit-material')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    CourseController.editMaterial);

AdminRouter.route('/delete-material')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    CourseController.deleteMaterial);

/******************Course Final Test -Routes****************/
AdminRouter.route('/add-course-finaltest')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    CourseController.addFinaltest);

AdminRouter.route('/fetch-course-finaltest')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CourseController.getFinaltests);

AdminRouter.route('/edit-course-finaltest')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    CourseController.editFinaltest);

AdminRouter.route('/delete-course-finaltest')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    CourseController.deleteFinaltest);

/******************Plans -Routes****************/
AdminRouter.route('/add-plan')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    AdminController.addPlan);

AdminRouter.route('/fetch-plans')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    CommonController.getPlansList);

AdminRouter.route('/edit-plan')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    AdminController.editPlan);

AdminRouter.route('/delete-plan')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    AdminController.deletePlan);

/******************Fundamental -Routes****************/

AdminRouter.route('/add-fundamental-subject')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.addSubject);

AdminRouter.route('/fetch-fundamental-subjects')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.fetchSubjects);

AdminRouter.route('/edit-fundamental-subject')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.editSubject);

AdminRouter.route('/delete-fundamental-subject')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.deleteSubject);

/******************Chapter -Routes****************/

AdminRouter.route('/add-fundamental-chapter')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.addChapter);

AdminRouter.route('/fetch-fundamental-chapters')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.getChapters);

AdminRouter.route('/edit-fundamental-chapter')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.editChapter);

AdminRouter.route('/delete-fundamental-chapter')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.deleteChapter);

/******************Unit -Routes****************/
AdminRouter.route('/add-fundamental-unit')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.addUnit);

AdminRouter.route('/fetch-fundamental-units')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.getUnits);

AdminRouter.route('/edit-fundamental-unit')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.editUnits);

AdminRouter.route('/delete-fundamental-unit')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.deleteUnit);

/******************Material -Routes****************/
AdminRouter.route('/add-fundamental-material')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.addFundamentalMaterial);

AdminRouter.route('/fetch-fundamental-materials')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.getFundamentalMaterial);

AdminRouter.route('/edit-fundamental-material')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.editFundamentalMaterial);

AdminRouter.route('/delete-fundamental-material')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.deleteFundamentalMaterial);

/******************Finaltest -Routes****************/
AdminRouter.route('/add-fundamental-finaltest')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.addFundamentalFinaltest);

AdminRouter.route('/fetch-fundamental-finaltest')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.getFundamentalFinaltests);

AdminRouter.route('/edit-fundamental-finaltest')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.editFundamentalFinaltest);

AdminRouter.route('/delete-fundamental-finaltest')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    FundamentalController.deleteFundamentalFinaltest);

//Series_Routes
AdminRouter.route('/add-series')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    SeriesController.addSeries);
AdminRouter.route('/fetch-series')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    SeriesController.getSeriesList);
AdminRouter.route('/edit-series')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    SeriesController.editSeries);
AdminRouter.route('/delete-series')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    SeriesController.deleteSeries);

//Series_Test_Routes
AdminRouter.route('/add-seriestest')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    SeriesController.addSeriesTest);
AdminRouter.route('/fetch-seriestest')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    SeriesController.getSeriesTests);
AdminRouter.route('/edit-seriestest')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    SeriesController.editSeriesTest);
AdminRouter.route('/delete-seriestest')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    SeriesController.deleteSeriesTest);
AdminRouter.route('/add-seriestest-questions')
  .all(ValidateHttpMethods.isValidPatchMethod)
  .patch(AuthMiddleware.validateAdminAccessToken,
    SeriesController.addSeriesTestQuestions);


//Series_Test_Routes
AdminRouter.route('/add-faq')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    AdminController.createFaq);
AdminRouter.route('/fetch-faq')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    AdminController.fetchFaqs);
AdminRouter.route('/edit-faq')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    AdminController.editFaq);
AdminRouter.route('/delete-faq')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    AdminController.deleteFaq);

/**********************LISTING API'S */
AdminRouter.route('/fetch-users-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    AdminController.fetchUsersList);

AdminRouter.route('/fetch-payments-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    AdminController.fetchPaymentsList);

//Alerts routes
AdminRouter.route('/add-job-alert')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    AdminController.createAlert);
AdminRouter.route('/fetch-job-alerts')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    AdminController.fetchAlerts);
AdminRouter.route('/edit-job-alert')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    AdminController.editAlerts);
AdminRouter.route('/delete-job-alert')
  .all(ValidateHttpMethods.isValidDeleteMethod)
  .delete(AuthMiddleware.validateAdminAccessToken,
    AdminController.deleteAlert);

//Ticket-api's
AdminRouter.route('/edit-ticket')
  .all(ValidateHttpMethods.isValidPutMethod)
  .put(AuthMiddleware.validateAdminAccessToken,
    AdminController.editTicket);

AdminRouter.route('/fetch-tickets-list')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    AdminController.fetchTicketsList);

AdminRouter.route('/fetch-activity-logs')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AdminController.fetchUserActivityLogs);

AdminRouter.route('/assign-plan')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    PaymentsController.assignPlanToUsers);

AdminRouter.route('/upgrade-users-plan')
  .all(ValidateHttpMethods.isValidPostMethod)
  .post(AuthMiddleware.validateAdminAccessToken,
    PaymentsController.upgradeUsersPlan);

AdminRouter.route('/fetch-user-courses')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    AdminController.getUserEnrolledCourses);

AdminRouter.route('/fetch-series-test-logs')
  .all(ValidateHttpMethods.isValidGetMethod)
  .get(AuthMiddleware.validateAdminAccessToken,
    AdminController.fetchUserSeriesTestLogs);

export default AdminRouter;