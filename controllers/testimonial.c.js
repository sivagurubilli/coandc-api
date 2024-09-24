let { privateKey, adminEmail } = require('../config/config')
let { isValidDate, responseJson, sendMail, isRequestDataValid, invoiceGen, capitalizeEveryInnerWord, checkValueType } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Admin, Role, Events, Transaction, Cook, CookPlan, Employer, ClientPlan, EmployerPlan, ClientPoints, ClientRequirement, EmployerPoints, Jobs, CSExecutive, DisposalAccounts,
    CookActivity, CookApplication, CookPoints, CookShortlist, CookVerify, EmailVerify, EmployerActivity, EmployerVerify,
    CookReports, EmployerReports, Testimonial } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate } = require("../helpers/dates");
const { isValidProvince, isValidLanguage, isValidQualification, isValidPartyPlates, isValidCuisine, isValidCateringPlates } = require("../helpers/index")
const { isEmailAvailable, isMobileAvailable, getMobileData, checkRegistrationLimits, assignInitialFreePlan, isValidName, isWhatsappNumberAvailable } = require('../helpers/user');
const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createTestimonial = async (req, res) => {
    try {
        let {
            name, image, message
        } = Object.assign(req.body)

        const requiredFields = {
            name, image, message
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Testimonial.create({
            name: capitalizeEveryInnerWord(name), image, message, status: 1,
            createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
        })
        res.status(200).send(responseJson(1, 1, data, 'Testimonial created successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Testimonial creation failed', e))
    }
}

exports.fetchTestimonials = async (req, res) => {
    try {
        let {
            name, image, message,
            id,
            limit, page, skip
        } = Object.assign(req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
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

exports.editTestimonial = async (req, res) => {
    try {

        let {
            name, image, message, status, id
        } = Object.assign(req.body)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let updateBody = { updatedAt: getCurrentDateAndTime() }
        if (name) updateBody.name = name;
        if (image) updateBody.image = image;
        if (message) updateBody.message = message;
        if (status == 0 || status == 1) updateBody.status = status;
        let data = await Testimonial.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No testimonial found" }

        res.status(200).send(responseJson(1, 1, data, 'Testimonial updated successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Testimonial updation failed', e))
    }
}

exports.deleteTestimonial = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Testimonial.findOne({ _id: id })
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No testimonial found" }
        data = await Testimonial.findOneAndDelete({ _id: id })
        res.status(200).send(responseJson(1, 1, {}, 'Testimonial deleted successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Testimonial deletion failed', e))
    }
}