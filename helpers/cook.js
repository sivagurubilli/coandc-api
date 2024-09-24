let { CookPoints, Jobs, ClientPoints, CookReports } = require('../models/index')
const { getCurrentDateAndTime } = require("./dates");

exports.checkChefValidBalance = async (userId) => {
    try {

        let planData = await CookPoints.findOne({ cookId: userId, isDeleted: false });
        if ((planData && new Date(planData.chefPlanEndDate) < new Date(getCurrentDateAndTime())) || planData.chefDailyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.chefDailyLimit} jobs per day. Please visit tomorrow.` }
        if ((planData && new Date(planData.chefPlanEndDate) < new Date(getCurrentDateAndTime())) || planData.chefMonthlyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.chefMonthlyLimit} jobs this month. Please buy a plan to access more or check later.` }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.checkPartyCookValidBalance = async (userId) => {
    try {
        let planData = await CookPoints.findOne({ cookId: userId, isDeleted: false });
        if ((planData && new Date(planData.planEndDate) < new Date(getCurrentDateAndTime())) || planData.partyDailyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.partyDailyLimit} events per day. Please visit tomorrow.` }
        if ((planData && new Date(planData.planEndDate) < new Date(getCurrentDateAndTime())) || planData.partyMonthlyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.partyMonthlyLimit} events this month. Please check later.` }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.checkHouseCookValidBalance = async (userId) => {
    try {
        let planData = await CookPoints.findOne({ cookId: userId, isDeleted: false });
        if ((planData && new Date(planData.planEndDate) < new Date(getCurrentDateAndTime())) || planData.houseDailyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.houseDailyLimit} jobs per day. Please visit tomorrow.` }
        if ((planData && new Date(planData.planEndDate) < new Date(getCurrentDateAndTime())) || planData.houseMonthlyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.houseMonthlyLimit} jobs this month. Please check later.` }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.checkCateringValidBalance = async (userId) => {
    try {
        let planData = await CookPoints.findOne({ cookId: userId, isDeleted: false });
        if ((planData && new Date(planData.planEndDate) < new Date(getCurrentDateAndTime())) || planData.cateringDailyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.cateringDailyLimit} events per day. Please visit tomorrow.` }
        if ((planData && new Date(planData.planEndDate) < new Date(getCurrentDateAndTime())) || planData.cateringMonthlyLimitBalance <= 0) throw { statusCode: 402, responseCode: 10, msg: `You have reached your limit of viewing ${planData.cateringMonthlyLimit} events this month. Please check later.` }
        return planData;
    }
    catch (e) {
        throw e
    }
}

exports.isJobReported = async (jobId) => {
    try {
        let reportData = await CookReports.findOne({ jobId, cookId: req.user._id });
        if (reportData) throw { statusCode: 404, responsecode: 0, msg: "This job is currently available" }
        return jobId;
    }
    catch (e) {
        throw e
    }
}
exports.checkIsReportedOrNot = async (body) => {
    try {
        let message = (body.eventId) ? 'This event is currently unavailable' : 'This job is currently unavailable';
        let reportData = await CookReports.findOne(body).lean();
        if (reportData) throw { statusCode: 404, responsecode: 0, msg: message }
        return false;
    }
    catch (e) {
        throw e
    }
}