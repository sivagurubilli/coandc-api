let { privateKey, adminEmail } = require('../config/config')
let { isValidDate, responseJson, sendMail, isRequestDataValid, invoiceGen } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Admin, Role, Events, Transaction, Cook, CookPlan, Employer, ClientPlan, EmployerPlan, ClientPoints, ClientRequirement, EmployerPoints, Jobs, CSExecutive } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate } = require("../helpers/dates");
const { isValidProvince, isValidLanguage, isValidQualification, isValidPartyPlates, isValidCuisine, isValidCateringPlates } = require("../helpers/index")
const { isEmailAvailable, isMobileAvailable, getMobileData, checkRegistrationLimits, assignInitialFreePlan, isValidName, isWhatsappNumberAvailable } = require('../helpers/user');
const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

exports.CSExecutiveLogin = async (req, res) => {
    try {

        let {
            username, password
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            username, password
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await CSExecutive.findOne({ username }).populate([{ path: "roleId", select: "roleName" }])
        data = JSON.parse(JSON.stringify(data));
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "No account found" }

        const isPasswordMatch = bcrypt.compareSync(password, data.password);
        if (!isPasswordMatch) throw { statusCode: 500, responseCode: 6, msg: "Invalid password.Try again" }

        data.token = jwt.sign({ id: data._id }, privateKey);
        res.status(200).send(responseJson(1, 1, data, 'Logged in successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Login failed', e))
    }
}