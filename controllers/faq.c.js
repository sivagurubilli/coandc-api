let { privateKey, adminEmail } = require('../config/config')
let { isValidDate, responseJson, sendMail, isRequestDataValid, invoiceGen, capitalizeEveryInnerWord, checkValueType } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Faq } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate } = require("../helpers/dates");
const { isValidProvince, isValidLanguage, isValidQualification, isValidPartyPlates, isValidCuisine, isValidCateringPlates } = require("../helpers/index")
const { isEmailAvailable, isMobileAvailable, getMobileData, checkRegistrationLimits, assignInitialFreePlan, isValidName, isWhatsappNumberAvailable } = require('../helpers/user');
const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createFaq = async (req, res) => {
    try {
        let {
            question, answer
        } = Object.assign(req.body)

        const requiredFields = {
            question, answer
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Faq.create({
            question, answer, status: 1,
            createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
        })
        res.status(200).send(responseJson(1, 1, data, 'Faq created successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Faq creation failed', e))
    }
}

exports.fetchFaqs = async (req, res) => {
    try {
        let {
            question, answer, id,
            limit, page, skip
        } = Object.assign(req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 100;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = {};
        if (question) dbQuery.question = question;
        if (answer) dbQuery.answer = answer;
        if (id) dbQuery._id = id;

        let data = await Faq.find(dbQuery).sort({ createdAt: 1 }).limit(limit).skip(skip);
        let totalData = await Faq.find(dbQuery);

        res.status(200).send(responseJson(1, 1, data, 'Faqs fetched successfully! ', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Faqs fetching failed', e))
    }
}

exports.editFaq = async (req, res) => {
    try {

        let {
            question, answer, status, id
        } = Object.assign(req.body)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let updateBody = { updatedAt: getCurrentDateAndTime() }
        if (question) updateBody.question = question;
        if (answer) updateBody.answer = answer;
        if (status == 0 || status == 1) updateBody.status = status;
        let data = await Faq.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No faq found" }

        res.status(200).send(responseJson(1, 1, data, 'Faq updated successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Faq updation failed', e))
    }
}

exports.deleteFaq = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Faq.findOne({ _id: id })
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No faq found" }
        data = await Faq.findOneAndDelete({ _id: id })
        res.status(200).send(responseJson(1, 1, {}, 'Faq deleted successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Faq deletion failed', e))
    }
}