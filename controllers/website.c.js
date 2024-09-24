let { privateKey, adminEmail } = require('../config/config')
let { isValidDate, responseJson, sendMail, isRequestDataValid, invoiceGen, capitalizeEveryInnerWord, checkValueType } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Testimonial, Cook, Employer, Jobs } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate } = require("../helpers/dates");
const { isValidProvince, isValidLanguage, isValidQualification, isValidPartyPlates, isValidCuisine, isValidCateringPlates } = require("../helpers/index")
const { isEmailAvailable, isMobileAvailable, getMobileData, checkRegistrationLimits, assignInitialFreePlan, isValidName, isWhatsappNumberAvailable } = require('../helpers/user');
const moment = require("moment");

exports.fetchTestimonials = async (req, res) => {
    try {
        let {
            name, image, message,
            id,
            limit, page, skip
        } = Object.assign(req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 15;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = {};
        if (name) dbQuery.name = name;
        if (image) dbQuery.image = image;
        if (message) dbQuery.message = message;
        if (id) dbQuery._id = id;

        let data = await Testimonial.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await Testimonial.find(dbQuery);

        res.status(200).send(responseJson(1, 1, data, 'Testimonials fetched successfully! ', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Testimonials fetching failed', e))
    }
}

exports.getTopChefs = async (req, res) => {
    try {

        let {
            id,
            limit, page, skip
        } = Object.assign(req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 15;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = { memberType: 1, cookType: 2, dp: { $exists: true }, profilePercent: { $gte: 80 }, status: 1, chefProfileStatus: 1 };
        if (id) dbQuery._id = id;

        let data = await Cook.find(dbQuery).sort({ lastLoginDateTime: -1 }).limit(limit).skip(skip);
        let totaldata = await Cook.find(dbQuery).countDocuments();

        res.status(200).send(responseJson(1, 1, data, 'Top chefs fetched successfully!', {}, data.length, totaldata))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Top chefs fetching failed', e))
    }
}

exports.getTopJobs = async (req, res) => {
    try {

        let {
            id,
            limit, page, skip
        } = Object.assign(req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = { status: 1, salary: { $gte: 30000 }, expiryDate: { $gte: getCurrentDateAndTime() } };
        if (id) dbQuery._id = id;

        let data = await Jobs.find(dbQuery).sort({ createdAt: -1, salary: -1 }).limit(limit).skip(skip);
        let totaldata = await Jobs.find(dbQuery);

        res.status(200).send(responseJson(1, 1, data, 'Top jobs fetched successfully! ', {}, data.length, totaldata.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Top jobs fetching failed', e))
    }
}

exports.getWebsiteCooksList = async (req, res) => {
    try {
        let {
            cook,
            limit, page, skip
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            cook
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        if (cook !== "housecook" && cook !== "chef" && cook != "catering" && cook != "partycook") throw { statusCode: 400, msg: "Please provide a valid cook" }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = { status: 1, lastLoginDateTime: { $exists: true }, profilePercent: { $gte: 70 }, basicProfileStatus: 1 }
        if (cook == "housecook") dbQuery.memberType = 1, dbQuery.cookType = 1, dbQuery.houseCookProfileStatus = 1;
        if (cook == "chef") dbQuery.memberType = 1, dbQuery.cookType = 2, dbQuery.chefProfileStatus = 1;
        if (cook == "catering") dbQuery.memberType = 2, dbQuery.cateringProfileStatus = 1;
        if (cook == "partycook") dbQuery.memberType = 1, dbQuery.partyCook = 1, dbQuery.partyCookProfileStatus = 1;

        let paginatedData = await Cook.find(dbQuery).select("profilePercent lastLoginDateTime fullName cityName dp cateringCuisines cateringFoodType partyCuisines partyExperience partyCookFoodType householdCuisines area jobType chefCuisines chefExperience currentCityName cityName").sort({ profilePercent: -1, lastLoginDateTime: -1 }).limit(limit).skip(skip);
        let totalDataCount = await Cook.find(dbQuery).countDocuments();
        res.status(200).send(responseJson(1, 1, paginatedData, 'Profiles fetched successfully', {}, paginatedData.length, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile fetching failed ', e))
    }
}