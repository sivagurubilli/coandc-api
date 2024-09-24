var express = require('express');
var multer = require('multer');
var router = express.Router();
let { support } = require('../controllers');
let { validateAdminAccessToken, validateCookAccessToken, validateHouseCookAccess, validateCateringAccess, validateChefAccess, validatePartyCookAccess } = require("../middlewares");
const { isValidGetMethod, isValidPostMethod, isValidPutMethod, isValidDeleteMethod } = require("../middlewares/validateHttpMethods");

router.route('/login').all(isValidPostMethod).post(support.CSExecutiveLogin);

module.exports = router;