let { responseJson, sendMail, isRequestDataValid, invoiceGen, sendWhatsappSms, calculateDistance, sendNotice } = require("../utils/appUtils");
let { SharedProfiles, Employer, Jobs, Events, EmployerPoints, ClientPoints, ClientRequirement, Cook } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
const { checkEmployerValidJobPoints, isValidCuisine, checkClientValidEventPoints } = require("../helpers/index")
let { getCurrentDateAndTime, getCurrentDate, getDateByMonth, addDaysToDate, isDateExpired } = require("../helpers/dates");
const { checkChefValidBalance, checkIsReportedOrNot } = require("../helpers/cook");
const { sendJobApplicationNotification, sendBulkJobNotificationsToChef, sendBulkEventNotifications } = require("../helpers/notification")
const moment = require("moment");
var mongoose = require('mongoose');

exports.addEvent = async (req, res) => {
    try {
        let {
            eventType, eventDate, cuisines, expectedGuest, pincode, city, location,
            cityCoordinates, locationCoordinates, dishes, employerId
        } = Object.assign(req.body)
        let employerData = await Employer.findOne({ _id: employerId, status: { $nin: [0] }, memberType: 1 });
        if (!employerData) throw { statusCode: 400, msg: "No profile found" }

        let clientPlanData = await checkClientValidEventPoints(employerId);
        if (!clientPlanData) throw { statusCode: 402, responseCode: 5, msg: "No valid points. Please purchase plan!" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        let data = await Events.create({
            eventType, eventDate, cuisines, expectedGuest, pincode, city, location,
            createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), dishes,
            cityCoordinates, locationCoordinates, clientId: employerId, totalInterestsReceived: 0,
            clientPointsId: clientPlanData._id
        })
        if (!data) throw Error("Unable to post event")
        clientPlanData = await ClientPoints.findOneAndUpdate({ _id: clientPlanData._id }, { $inc: { currentEventPoints: -1 } }, { new: true })
        await sendBulkEventNotifications({
            longitude: data.locationCoordinates.coordinates[0], latitude: data.locationCoordinates.coordinates[1],
            location: data.location, eventType: data.eventType, eventId: data._id
        })
        res.status(200).send(responseJson(1, 1, data, 'Event posted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Event post failed', e))
    }
}

exports.addJob = async (req, res) => {
    try {

        let employerData = await Employer.findOne({ _id: req.body.employerId, status: { $nin: [0] }, memberType: 2 });
        if (!employerData) throw { statusCode: 400, msg: "No profile found" }

        let pointsData = await checkEmployerValidJobPoints(req.body.employerId);
        if (!pointsData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points.Try subscription" }
        if (req.body.cuisines && req.body.cuisines.length) {
            await isValidCuisine(req.body.cuisines);
        }
        let jobData = await Jobs.create({
            ...req.body,
            employerPointsId: pointsData._id,
            maximumResponsesCount: pointsData.totalResponsePoints,
            currentResponsesCount: 0,
            expiryDate: pointsData.planExpiresAt,
            employerId: req.body.employerId,
            createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
        });
        if (!jobData) throw Error("Unable to post job.Try again")
        await EmployerPoints.findOneAndUpdate({ _id: pointsData._id }, { $inc: { currentJobPoints: -1 } }, { new: true });
        await sendBulkJobNotificationsToChef({ longitude: jobData.locationCoordinates.coordinates[0], latitude: jobData.locationCoordinates.coordinates[1], location: jobData.location, designation: jobData.designation, jobId: jobData._id });
        res.status(200).send(responseJson(1, 1, jobData, 'Job posted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job post failed', e))
    }
}

exports.shareCookProfile = async (req, res) => {
    try {
        let {
            employerId,
            cookIds,
            jobId,
            requirementId,
            eventId
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            employerId,
            cookIds
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        cookIds = [...new Set(cookIds)]
        if (!cookIds.length) throw { statusCode: 400, msg: "Please provide atleast one cook profile." }

        if (!eventId && !requirementId && !jobId) throw { statusCode: 400, msg: "Please provide jobId, eventId or requirementId" }
        let modelName, dbQuery;
        if (jobId) modelName = Jobs, dbQuery = { _id: jobId, status: { $nin: [0] } };
        if (eventId) modelName = Events, dbQuery = { _id: eventId, status: { $nin: [0] } };
        if (requirementId) modelName = ClientRequirement, dbQuery = { _id: requirementId, status: { $nin: [0] } };
        let jobdata = await modelName.findOne(dbQuery);
        let jobtype = (eventId) ? "event" : "job";
        if (!jobdata) throw { statusCode: 400, msg: `No ${jobtype} found!` }
        let expiryDate = (eventId) ? jobdata.eventDate : jobdata.expiryDate;
        let currentDate = getCurrentDateAndTime();

        let employer = await Employer.findOne({ _id: employerId, status: { $nin: [0] } })
        if (!employer) throw { statusCode: 400, msg: "No employer profile found!" }
        let data = [];
        let realCookIds = [];
        cookIds.map((x) => {
            if (mongoose.isValidObjectId(x)) {
                let obj = {
                    employerId, cookId: x, sharedTo: "employer", createdAt: currentDate, updatedAt: currentDate, expiryDate
                };
                if (eventId) obj.eventId = eventId;
                if (jobId) obj.jobId = jobId;
                if (requirementId) obj.requirementId = requirementId;
                data.push(obj);
                realCookIds.push(x);
            }
        })
        let cooksCount = await Cook.findOne({ _id: { $in: realCookIds }, status: { $nin: [0] } }).countDocuments();
        console.log({ cooksCount, realCookIdsCount: realCookIds.length })
        if (cooksCount != realCookIds.length) throw { statusCode: 400, msg: "Please provide valid cook profiles." }

        let alreadyExistedCount = await SharedProfiles.find({ employerId, expiryDate: { $gte: getCurrentDateAndTime() }, cookId: { $in: realCookIds } }).countDocuments();
        if (alreadyExistedCount) throw { statusCode: 400, msg: "Some profiles were alreay shared, please check!" }
        await SharedProfiles.insertMany(data);
        res.status(200).send(responseJson(1, 1, {}, 'Profiles shared successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Sharing profiles failed', e))
    }
}

exports.getSharedCookProfiles = async (req, res) => {
    try {

        let {
            employerId,
            cookId,
            jobId,
            requirementId,
            eventId,
            date,
            status,
            id, limit, page, skip
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = {};
        if (id) dbQuery._id = id;
        if (employerId) dbQuery.employerId = employerId;
        if (cookId) dbQuery.cookId = cookId;
        if (jobId) dbQuery.jobId = jobId;
        if (eventId) dbQuery.eventId = eventId;
        if (requirementId) dbQuery.requirementId = requirementId;
        if (status == 1) dbQuery.expiryDate = { $gte: getCurrentDateAndTime() };
        if (status == 0) dbQuery.expiryDate = { $lt: getCurrentDateAndTime() };

        let totalDataCount = await SharedProfiles.find(dbQuery).countDocuments();
        let paginatedData = await SharedProfiles.find(dbQuery).populate([
            { path: "employerId", select: "fullName memberType email mobile dp addressLine1 addressLine2 weavyId cityName provinceName area pincode status" },
            { path: "cookId", select: "fullName memberType cookType partyCook email mobile dp addressLine1 addressLine2 weavyId cityName provinceName area pincode status" },
            { path: "jobId" },
            { path: "eventId" },
            { path: "requirementId" }
        ]).sort({ createdAt: -1 }).limit(limit).skip(skip);

        paginatedData = JSON.parse(JSON.stringify(paginatedData));
        paginatedData = paginatedData.map((x) => {
            x.status = (isDateExpired(x.expiryDate)) ? 0 : 1;
            return x;
        })
        res.status(200).send(responseJson(1, 1, paginatedData, 'Shared profiles fetched successfully', {}, paginatedData.length, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching shared profiles failed', e))
    }
}

exports.deleteSharedProfile = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await SharedProfiles.findById(id);
        if (!data) throw { statusCode: 400, msg: "No data found" }

        await SharedProfiles.findOneAndDelete({ _id: id });
        res.status(200).send(responseJson(1, 1, {}, 'Deleted successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Deleting shared profiles failed', e))
    }
}

exports.editSharedCookProfile = async (req, res) => {
    try {
        let {
            employerId,
            cookId,
            jobId,
            requirementId,
            eventId,
            id
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await SharedProfiles.findById(id);
        if (!data) throw { statusCode: 400, msg: "Please provide a valid shared profileId." }

        let updateBody = { updatedAt: getCurrentDateAndTime() };

        let modelName, dbQuery;
        if (jobId) modelName = Jobs, dbQuery = { _id: jobId, status: { $nin: [0] } }, updateBody.jobId = jobId;
        if (eventId) modelName = Events, dbQuery = { _id: eventId, status: { $nin: [0] } }, updateBody.eventId = eventId;
        if (requirementId) modelName = ClientRequirement, dbQuery = { _id: requirementId, status: { $nin: [0] } }, updateBody.requirementId = requirementId;
        if (eventId || jobId || requirementId) {
            let jobdata = await modelName.findOne(dbQuery);
            let jobtype = (eventId) ? "event" : "job";
            if (!jobdata) throw { statusCode: 400, msg: `No ${jobtype} found!` }
            updateBody.expiryDate = (eventId) ? jobdata.eventDate : jobdata.expiryDate;
        }

        if (employerId) {
            let employer = await Employer.findOne({ _id: employerId, status: { $nin: [0] } })
            if (!employer) throw { statusCode: 400, msg: "No employer profile found!" }
            updateBody.employerId = employerId;
        }
        if (cookId) {
            let cook = await Cook.findOne({ _id: cookId, status: { $nin: [0] } })
            if (!cook) throw { statusCode: 400, msg: "No cook profile found!" }
            updateBody.cookId = cookId;
        }

        if ((employerId && (data.employerId).toString() != employerId.toString()) || (cookId && (data.cookId).toString() != cookId.toString())) {
            let dbQuery = { employerId: (employerId) ? employerId : data.employerId, cookId: (cookId) ? cookId : data.cookId };
            let isDataExists = await SharedProfiles.findOne(dbQuery).lean();
            if (isDataExists) throw { statusCode: 400, msg: "This profile is already shared. Please check!" }
        }
        data = await SharedProfiles.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        data = JSON.parse(JSON.stringify(data));
        data.status = (isDateExpired(data.expiryDate)) ? 0 : 1;
        res.status(200).send(responseJson(1, 1, data, 'Shared profile updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Sharing profiles updation failed', e))
    }
}
