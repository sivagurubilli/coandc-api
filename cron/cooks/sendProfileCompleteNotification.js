const { Cook, CookPoints } = require('../../models/index')
const { getCurrentDateAndTime, getCurrentDate, getNextDay } = require("../../helpers/dates");
const { processNotificationsInChunks } = require("../../helpers/notification");

const sendProfileCompleteNotification = async () => {
    try {
        console.log("Sending notifications to incomplete cook profile cron job started")
        let [tokens] = await Promise.all([
            Cook.find({
                deviceToken: { $exists: true, $ne: null, $ne: undefined, $ne: "" }, memberType: 1, status: 1, $or: [
                    { dp: { $exists: false } },
                    { qualification: { $exists: false } },
                    { languages: { $exists: false } },
                    { about: { $exists: false } },
                    { whatsappNumber: { $exists: false } },
                    { addressLine1: { $exists: false } },
                    { area: { $exists: false } },
                    { cityName: { $exists: false } },
                    { pincode: { $exists: false } },
                    { provinceName: { $exists: false } },
                    { houseCookProfileStatus: 0 },
                    { chefProfileStatus: 0 },
                    { partyCookProfileStatus: 0 }
                ]
            }).distinct('deviceToken')
        ]);

        console.log({ tokensLength: tokens.length })
        await processNotificationsInChunks({ screen: "editcookprofile", chunkSize: 400, tokens, title: `Warning! Your profile is incomplete`, message: `To apply for a job or be contacted by employers, update your profile.` })
        console.log("Sending notifications to incomplete cook profile cron job completed")
    }
    catch (error) {
        console.log("Sending notifications to incomplete cook profile cron job failed")
        console.log(error)
    }
}

module.exports = sendProfileCompleteNotification;
