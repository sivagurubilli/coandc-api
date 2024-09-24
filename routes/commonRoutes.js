var express = require('express');
var multer = require('multer');
var router = express.Router();
const { isValidGetMethod, isValidPostMethod, isValidPutMethod, isValidDeleteMethod } = require("../middlewares/validateHttpMethods");
let { validateAccessToken } = require("../middlewares");
let { dropdown, config, test, website, file, faq, chat, helpchat } = require('../controllers');
const { checkCookLoginValidation, changePasswordValidation } = require("../validations/cook");


//API_ROUTES
router.route('/fetch/gender').all(isValidGetMethod).get(dropdown.genderDropdownValues);
router.route('/fetch/cusiniesList').all(isValidGetMethod).get(dropdown.fetchCuisinesList);

//Testing
router.route('/test').all(isValidGetMethod).get(test.createRole);
router.route('/fetchS3Files').all(isValidGetMethod).get(file.fetchAllFiles);

//Configurations api
router.route('/fetch/config').all(isValidGetMethod).get(validateAccessToken, config.getconfig);
router.route('/fetch/ipv6').all(isValidGetMethod).get(config.getIPv6Address);
router.route('/contactUs/submit/ticket').all(isValidPostMethod).post(dropdown.raiseTicket);
router.route('/faqs/fetch').all(isValidGetMethod).get(faq.fetchFaqs)

router.route('/login').all(isValidPostMethod).post(checkCookLoginValidation, dropdown.commonLogin);
router.route('/login/changePassword').all(isValidPostMethod).post(changePasswordValidation, validateAccessToken, dropdown.changeLoginPassword)
router.route('/edit/privacy-settings').all(isValidPostMethod).post(validateAccessToken, dropdown.editPrivacySettings);


//All_Website_Apis
router.route('/website/fetch/testimonials').all(isValidGetMethod).get(website.fetchTestimonials);
router.route('/website/fetch/topjobs').all(isValidGetMethod).get(website.getTopJobs);
router.route('/website/fetch/topchefs').all(isValidGetMethod).get(website.getTopChefs);
router.route('/helpchat/fetch').all(isValidGetMethod).get(helpchat.getHelpChatList);
router.route('/website/fetch/cookslist').all(isValidGetMethod).get(website.getWebsiteCooksList);



//Chat_App
router.route('/chat/createUser').all(isValidPostMethod).post(chat.createChatUser);
router.route('/chat/initiateWeavyId').all(isValidPostMethod).post(dropdown.initiateWeavyId)

module.exports = router;