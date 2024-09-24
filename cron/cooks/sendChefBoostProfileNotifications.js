const { Cook, CookPoints } = require('../../models/index')
const { getCurrentDateAndTime, getCurrentDate, getNextDay } = require("../../helpers/dates");
const { processNotificationsInChunks } = require("../../helpers/notification");

const sendChefBoostProfileNotifications = async () => {
    try {
        console.log("Sending notifications for chefs to boost profiles cron job started")
        let [tokens] = await Promise.all([
            Cook.find({
                deviceToken: { $exists: true, $ne: null, $ne: undefined, $ne: "" }, memberType: 1, status: 1, cookType: 2, profilePercent: { $gte: 70 }
            }).distinct('deviceToken')
        ]);

        console.log({ tokensLength: tokens.length })
        await processNotificationsInChunks({ screen: "buychefplan", chunkSize: 900, tokens, title: `Boost your profile now.`, message: `Boosting your profile will improve its visibility and lead to more job opportunities.` })
        console.log("Sending notifications for chefs to boost profiles cron job completed")
    }
    catch (error) {
        console.log("Sending notifications for chefs to boost profiles cron job failed")
        console.log(error)
    }
}

module.exports = sendChefBoostProfileNotifications;
