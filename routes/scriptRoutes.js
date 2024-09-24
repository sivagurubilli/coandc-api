var express = require('express');
var multer = require('multer');
var router = express.Router();
const { isValidGetMethod, isValidPostMethod, isValidPutMethod, isValidDeleteMethod } = require("../middlewares/validateHttpMethods");
let { validateAccessToken } = require("../middlewares");
let { scripts } = require('../controllers');
const { checkCookLoginValidation, changePasswordValidation } = require("../validations/cook");

//API_ROUTES
// router.route('/import/jobs').all(isValidGetMethod).get(scripts.importJobs);
// router.route('/import/clients').all(isValidGetMethod).get(scripts.importClients);
// router.route('/import/housejobs').all(isValidGetMethod).get(scripts.importHouseJobs);
// router.route('/bcrypt/password').all(isValidGetMethod).get(scripts.bcryptPassword);
// router.route('/import/chefs').all(isValidGetMethod).get(scripts.importChefs);
// router.route('/import/empTransactions').all(isValidGetMethod).get(scripts.importTransactionsNew);
// router.route('/import/applications').all(isValidGetMethod).get(scripts.importJobApplications);
// router.route('/update/cooks').all(isValidGetMethod).get(scripts.updateCook);
// router.route('/import/cooks').all(isValidGetMethod).get(scripts.importCooks);
// router.route('/import/employers').all(isValidGetMethod).get(scripts.importEmployers);
// router.route('/import/employerstransactions').all(isValidGetMethod).get(scripts.importEmployerTransactions);
// router.route('/import/clientTransactions').all(isValidGetMethod).get(scripts.importClientTransactions);





module.exports = router;