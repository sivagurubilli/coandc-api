let { Transaction, EmployerPoints, Employer, Jobs, ClientPoints, EmployerReports } = require('../models/index')
const { getCurrentDateAndTime } = require("./dates");

exports.checkEmployerValidJobPoints = async (userId) => {
    try {
        let planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentJobPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
        if (!planData) {
            planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentJobPoints: { $gte: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
            if (planData && planData.currentJobPoints <= 0) throw { statusCode: 402, responseCode: 10, msg: 'Insufficient points.Purchase plan to apply' }
        }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.checkEmployerValidProfileViewPoints = async (userId) => {
    try {
        let planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentProfileViewPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
        if (!planData) {
            planData = await EmployerPoints.findOne({ employerId: userId, isDeleted: false, currentProfileViewPoints: { $gte: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lt: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
            if (planData && planData.currentProfileViewPoints <= 0) throw { statusCode: 402, responseCode: 10, msg: 'Insufficient points.Purchase plan to apply' }
        }
        return planData;
    }
    catch (e) {
        throw e
    }
}


exports.checkClientValidEventPoints = async (userId) => {
    try {
        let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentEventPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
        if (!planData) {
            planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentEventPoints: { $gte: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
            if (planData && planData.currentEventPoints <= 0) throw { statusCode: 402, responseCode: 10, msg: 'Insufficient points.Purchase plan to apply' }
        }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.checkClientValidHouseCookPoints = async (userId) => {
    try {

        let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentHouseCookPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
        if (!planData) {
            planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentHouseCookPoints: { $gte: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
            if (planData && planData.currentHouseCookPoints <= 0) throw { statusCode: 402, responseCode: 10, msg: 'Insufficient points.Purchase plan to v' }
        }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.checkClientValidPartyCateringPoints = async (userId) => {
    try {
        let planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentPartyCateringPoints: { $gt: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
        if (!planData) {
            planData = await ClientPoints.findOne({ clientId: userId, isDeleted: false, currentPartyCateringPoints: { $gte: 0 }, planExpiresAt: { $gte: getCurrentDateAndTime() }, planStartsAt: { $lte: getCurrentDateAndTime() } }).sort({ 'planExpiresAt': 1 });
            if (planData && planData.currentPartyCateringPoints <= 0) throw { statusCode: 402, responseCode: 10, msg: 'Insufficient points.Purchase plan to apply' }
        }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.checkIsProfileReportedOrNot = async (body) => {
    try {
        let reportData = await EmployerReports.findOne(body);
        if (reportData) throw { statusCode: 404, responsecode: 0, msg: 'This profile is currently unavailable' }
        return false;
    }
    catch (e) {
        throw e
    }
}

exports.mergeEmployerDashboardData = (data) => {
    return data.reduce((acc, obj) => {
        acc.totalProfileShortlists += obj.totalProfileShortlists || 0;
        acc.totalJobApplications += obj.totalJobApplications || 0;
        acc.totalActiveJobs += obj.totalActiveJobs || 0;
        acc.currentJobPoints += obj.currentJobPoints || 0;
        acc.currentProfileViewPoints += obj.currentProfileViewPoints || 0;
        acc.currentResponsePoints += obj.currentResponsePoints || 0;
        return acc;
    }, {
        totalProfileShortlists: 0,
        totalJobApplications: 0,
        totalActiveJobs: 0,
        currentJobPoints: 0,
        currentProfileViewPoints: 0,
        currentResponsePoints: 0,
    });
}

exports.mergeClientDashboardData = (data) => {
    return data.reduce((acc, obj) => {
        acc.currentEventPoints += obj.currentEventPoints || 0;
        acc.currentHouseCookPoints += obj.currentHouseCookPoints || 0;
        acc.currentPartyCateringPoints += obj.currentPartyCateringPoints || 0;
        acc.totalActiveEvents += obj.totalActiveEvents || 0;
        acc.totalEventInterestReceived += obj.totalEventInterestReceived || 0;
        acc.totalRequirements += obj.totalRequirements || 0;
        acc.totalRequirementApplicationsReceived += obj.totalRequirementApplicationsReceived || 0;
        return acc;
    }, {
        currentEventPoints: 0,
        currentHouseCookPoints: 0,
        currentPartyCateringPoints: 0,
        totalActiveEvents: 0,
        totalEventInterestReceived: 0,
        totalRequirements: 0,
        totalRequirementApplicationsReceived: 0
    });
}