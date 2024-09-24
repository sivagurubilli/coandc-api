var express = require('express');
var multer = require('multer');
var router = express.Router();
let { validateAccessToken } = require("../middlewares");
let { dropdown, config, test } = require('../controllers');
const { isValidGetMethod, isValidPostMethod, isValidPutMethod, isValidDeleteMethod } = require("../middlewares/validateHttpMethods");

//API_ROUTES
router.route('/fetch/gender').all(isValidGetMethod).get(dropdown.genderDropdownValues);
router.route('/create-province').all(isValidPostMethod).post(dropdown.createProvince);
router.route('/create-qualification').all(isValidPostMethod).post(dropdown.createQualification);
router.route('/create-language').all(isValidPostMethod).post(dropdown.createLanguages);
router.route('/create-party-plates').all(isValidPostMethod).post(dropdown.createPartyPlates);
router.route('/create-catering-plates').all(isValidPostMethod).post(dropdown.createCateringPlate);
router.route('/create-cuisines').all(isValidPostMethod).post(dropdown.createCuisine);


router.route('/fetch-province').all(isValidGetMethod).get(dropdown.fetchProvince);
router.route('/fetch-qualification').all(isValidGetMethod).get(dropdown.fetchQualification);
router.route('/fetch-languages').all(isValidGetMethod).get(dropdown.fetchLanguage);
router.route('/fetch-party-plates').all(isValidGetMethod).get(dropdown.fetchPartyPlates);
router.route('/fetch-catering-plates').all(isValidGetMethod).get(dropdown.fetchCateringPlates);

module.exports = router;