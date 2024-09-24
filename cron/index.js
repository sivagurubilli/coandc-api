const CronJob = require("cron").CronJob;
const CookJobs = require("./cooks/index");
const EmployerJobs = require("./employers/index")
const { Cook, CookPoints } = require('../models/index')

exports.cronSchedulars = async () => {
    //Alloting cook Free & Paid points at every day 12:41AM IST
    new CronJob('41 0 * * *', async () => {
        await CookJobs.allotCookPoints();
    }, null, true, 'Asia/Kolkata');

    //Updating status for every jobs/evemt at every day 01:39AM IST
    new CronJob('39 1 * * *', async () => {
        await EmployerJobs.setJobsExpiryStatus();
    }, null, true, 'Asia/Kolkata');

    //Sending notifications to incomplete cook profiles at every thursday 03:35PM IST
    new CronJob('35 15 * * 4', async () => {
        await CookJobs.sendProfileCompleteNotification();
    }, null, true, 'Asia/Kolkata');

    //Sending notifications to boost chefs profile at every tuesday 11:03AM IST
    new CronJob('3 11 * * 2', async () => {
        await CookJobs.sendChefBoostProfileNotifications();
    }, null, true, 'Asia/Kolkata');

    //Sending notifications to employer plan expiry prior everyday at 10:30PM IST
    new CronJob('30 22 * * *', async () => {
        await EmployerJobs.sendEmployerPlanExpiryPriorNotification();
    }, null, true, 'Asia/Kolkata');

    //Sending notifications to employer plan expiry prior everyday at 10:45PM IST
    new CronJob('45 22 * * *', async () => {
        await EmployerJobs.sendEmployerPlanExpiryPostNotification();
    }, null, true, 'Asia/Kolkata');

}
