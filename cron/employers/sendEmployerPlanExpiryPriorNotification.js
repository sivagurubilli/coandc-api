const { Employer, Transaction } = require('../../models/index')
const { getCurrentDateAndTime, getCurrentDate, getNextDay, addDaysToDate } = require("../../helpers/dates");
const { processNotificationsInChunks } = require("../../helpers/notification");
const mongoose = require('mongoose');
const moment = require('moment');

const sendEmployerPlanExpiryPriorNotification = async () => {
    try {
        console.log("Sending notifications for employer plan expiry pre cron job started")
        let checkDate = moment(addDaysToDate(2)).format("YYYY-MM-DD");
        let transactions = await Transaction.find({ transactionEndDateTime: { $gte: `${checkDate}T00:00:00.000Z`, $lt: `${checkDate}T23:59:59.999Z` }, transactionBy: 2, employerId: { $exists: true }, employerPointsId: { $exists: true } }).distinct('employerId');
        if (transactions.length) {
            let tokens = await Employer.find({ deviceToken: { $exists: true }, memberType: 2, status: 1, _id: { $in: transactions } }).distinct('deviceToken');
            console.log({ tokensLength: tokens.length })
            await processNotificationsInChunks({ screen: "buyemployerplan", chunkSize: 900, tokens, title: `Warning: Your plan is going to expiry on ${checkDate}.`, message: `Complete your hiring or Extend your access by activating a plan.` })
        }
        console.log("Sending notifications for employer plan expiry pre cron job completed")
    }
    catch (error) {
        console.log("Sending notifications for employer plan expiry pre cron job failed")
        console.log(error)
    }
}

module.exports = sendEmployerPlanExpiryPriorNotification;
