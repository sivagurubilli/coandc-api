
let { responseJson, sendMail, isRequestDataValid, invoiceGen } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Transaction, CookPlan, Employer, ClientPlan, EmployerPlan } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate } = require("../helpers/dates");
const crypto = require("crypto");
const moment = require("moment");

exports.createClientPlans = async (req, res) => {
    try {

        let clientPlanName = req.body.clientPlanName;
        let data = await ClientPlan.findOne({ clientPlanName });
        if (data) req.body.updatedAt = getCurrentDateAndTime();
        else req.body.updatedAt = getCurrentDateAndTime(), req.body.createdAt = getCurrentDateAndTime();
        data = await ClientPlan.findOneAndUpdate({ clientPlanName }, { $set: req.body }, { new: true, upsert: true, setDefaultsOnInsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Plan created successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan creation failed', e))
    }
}

exports.getClientPlans = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.query)

        let dbQuery = { isDeleted: false };
        if (id) dbQuery._id = id;
        let data = await ClientPlan.find(dbQuery).sort({ price: 1 });
        res.status(200).send(responseJson(1, 1, data, 'Plan fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan fetch  Failed', e))
    }
}

exports.editClientPlans = async (req, res) => {
    try {


        let {
            id,
            clientPlanName,
            validityInDays,
            eventPoints,
            houseCookPoints,
            partyCateringPoints,
            price,
            status,
            supportAssistance,
            refundPolicy
        } = Object.assign(req.body)


        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await ClientPlan.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("Invalid clientPlanId");

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (clientPlanName) updateBody.clientPlanName = clientPlanName;
        if (validityInDays) updateBody.validityInDays = validityInDays;
        if (eventPoints) updateBody.eventPoints = eventPoints;
        if (houseCookPoints) updateBody.houseCookPoints = houseCookPoints;
        if (partyCateringPoints) updateBody.partyCateringPoints = partyCateringPoints;
        if (price) updateBody.price = price;
        if (status != null && status != undefined) updateBody.status = status;
        if (refundPolicy != null && refundPolicy != undefined) updateBody.refundPolicy = refundPolicy;
        if (supportAssistance != null && supportAssistance != undefined) updateBody.supportAssistance = supportAssistance;

        data = await ClientPlan.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, data, 'Plan updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan update failed', e))
    }
}

exports.deleteClientPlan = async (req, res) => {
    try {
        let {
            id,
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            id
        }

        let data = await ClientPlan.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("Invalid clientPlanId");

        data = await ClientPlan.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true, deletedAt: getCurrentDateAndTime() } }, { new: true })
        res.status(200).send(responseJson(1, 1, {}, 'Plan deleted successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan delete failed', e))
    }
}


//Cook_Plans
exports.createCookPlans = async (req, res) => {
    try {

        let cookPlanName = req.body.cookPlanName;
        let data = await CookPlan.findOne({ cookPlanName });
        if (data) req.body.updatedAt = getCurrentDateAndTime();
        else req.body.updatedAt = getCurrentDateAndTime(), req.body.createdAt = getCurrentDateAndTime();
        data = await CookPlan.findOneAndUpdate({ cookPlanName }, { $set: req.body }, { new: true, upsert: true, setDefaultsOnInsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Plan created successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan Creation  Failed', e))
    }
}

exports.getCookPlans = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.query)

        let dbQuery = { isDeleted: false };
        if (id) dbQuery._id = id;
        let data = await CookPlan.find(dbQuery).sort({ price: 1 });
        res.status(200).send(responseJson(1, 1, data, 'Plan fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan fetching failed', e))
    }
}


exports.editCookPlans = async (req, res) => {
    try {


        let {
            id,
            cookPlanName,
            validityInDays,
            profileBoostRank,
            resumeBuilder,
            actionPerDay,
            actionPerMonth,
            price,
            status
        } = Object.assign(req.body)


        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await CookPlan.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("Invalid clientPlanId");

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (cookPlanName) updateBody.cookPlanName = cookPlanName;
        if (validityInDays) updateBody.validityInDays = validityInDays;
        if (profileBoostRank != null && profileBoostRank != undefined) updateBody.profileBoostRank = profileBoostRank;
        if (actionPerDay) updateBody.actionPerDay = actionPerDay;
        if (actionPerMonth) updateBody.actionPerMonth = actionPerMonth;
        if (price) updateBody.price = price;
        if (status != null && status != undefined) updateBody.status = status;
        if (resumeBuilder != null && resumeBuilder != undefined) updateBody.resumeBuilder = resumeBuilder;

        data = await CookPlan.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, data, 'Plan updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan update failed', e))
    }
}


exports.deleteCooksPlan = async (req, res) => {
    try {
        let {
            id,
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            id
        }

        let data = await CookPlan.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("Invalid clientPlanId");

        data = await CookPlan.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true, deletedAt: getCurrentDateAndTime() } }, { new: true })
        res.status(200).send(responseJson(1, 1, {}, 'Plan deleted successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan delete failed', e))
    }
}


/*-------------------------------EMPLOYER_PLAN_CRUD_APIS-----------------------------------*/
exports.createEmployerPlans = async (req, res) => {
    try {

        let employerPlanName = req.body.employerPlanName;
        let data = await EmployerPlan.findOne({ employerPlanName });
        if (data) req.body.updatedAt = getCurrentDateAndTime();
        else req.body.updatedAt = getCurrentDateAndTime(), req.body.createdAt = getCurrentDateAndTime();
        data = await EmployerPlan.findOneAndUpdate({ employerPlanName }, { $set: req.body }, { new: true, upsert: true, setDefaultsOnInsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Plan Creation  success'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan Creation  Failed', e))
    }
}

exports.getEmployerPlans = async (req, res) => {
    try {

        let {
            id,
            plantype
        } = Object.assign(req.query)
        let dbQuery = { isDeleted: false };
        if (plantype) dbQuery.plantype = plantype;
        if (id) dbQuery._id = id;
        let data = await EmployerPlan.find(dbQuery).sort({ price: 1 });
        res.status(200).send(responseJson(1, 1, data, 'Plan fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan fetch failed', e))
    }
}

exports.editEmployerPlans = async (req, res) => {
    try {

        let {
            id,
            employerPlanName,
            validityInDays,
            jobPoints,
            responsePoints,
            profileViewPoints,
            price,
            status,
            supportAssistance,
            refundPolicy,
            assistancePrice,
            plantype
        } = Object.assign(req.body)


        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await EmployerPlan.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("Invalid id");

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (employerPlanName) updateBody.employerPlanName = employerPlanName;
        if (validityInDays) updateBody.validityInDays = validityInDays;
        if (jobPoints) updateBody.jobPoints = jobPoints;
        if (responsePoints) updateBody.responsePoints = responsePoints;
        if (profileViewPoints) updateBody.profileViewPoints = profileViewPoints;
        if (price) updateBody.price = price;
        if (status != null && status != undefined) updateBody.status = status;
        if (refundPolicy != null && refundPolicy != undefined) updateBody.refundPolicy = refundPolicy;
        if (assistancePrice) updateBody.assistancePrice = assistancePrice;
        if (supportAssistance == 0) updateBody.supportAssistance = 0;
        if (supportAssistance == 1) updateBody.supportAssistance = supportAssistance, updateBody.assistancePrice = 0;
        if (plantype) updateBody.plantype = plantype;


        data = await EmployerPlan.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, data, 'Plan updated successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan updation failed', e))
    }
}

exports.deleteEmployerPlan = async (req, res) => {
    try {
        let {
            id,
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            id
        }

        let data = await EmployerPlan.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("Invalid id");

        data = await EmployerPlan.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true, deletedAt: getCurrentDateAndTime() } }, { new: true })
        res.status(200).send(responseJson(1, 1, {}, 'Plan deleted successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, 0, [], e.msg || 'Plan delete failed', e))
    }
}
