const { Employer, Transaction } = require('../../models/index')
const { getCurrentDateAndTime, getCurrentDate, getNextDay, addDaysToDate } = require("../../helpers/dates");
const { processNotificationsInChunks } = require("../../helpers/notification");
const mongoose = require('mongoose');
const moment = require('moment');

const sendEmployerPlanExpiryPostNotification = async () => {
    try {
        console.log("Sending notifications for employer plan expiry post cron job started")
        let checkDate = moment(addDaysToDate(-5)).format("YYYY-MM-DD");
        let currentDate = moment(getCurrentDateAndTime()).format("YYYY-MM-DD");
        let transactions = await Transaction.find({ transactionEndDateTime: { $gte: `${checkDate}T00:00:00.000Z`, $lt: `${currentDate}T23:59:59.999Z` }, transactionBy: 2, employerId: { $exists: true }, employerPointsId: { $exists: true } }).distinct('employerId');
        if (transactions.length) {
            let tokens = await Employer.find({ deviceToken: { $exists: true }, memberType: 2, status: 1, _id: { $in: transactions } }).distinct('deviceToken');
            console.log({ tokensLength: tokens.length })
            await processNotificationsInChunks({ screen: "buyemployerplan", chunkSize: 900, tokens, title: `Your plan is expired.`, message: `If you haven’t finished your hiring, buy a plan to extend the access.` })
        }
        console.log("Sending notifications for employer plan expiry post cron job completed")
    }
    catch (error) {
        console.log("Sending notifications for employer plan expiry post cron job failed")
        console.log(error)
    }
}

module.exports = sendEmployerPlanExpiryPostNotification;
