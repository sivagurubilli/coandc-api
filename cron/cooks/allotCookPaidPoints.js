const { Cook, CookPoints } = require('../../models/index')
const { getCurrentDateAndTime, getCurrentDate, getNextDay } = require("../../helpers/dates");

const allotCookPaidPoints = async () => {
    try {
        console.log("Alloting Chef Paid Points Cron Job Started")
        let [chefsData] = await Promise.all([
            Cook.find({ memberType: 1, cookType: 2, status: { $nin: [0] } }).distinct('_id')
        ]);

        let paidPointsData = await CookPoints.find({ cookId: { $in: chefsData }, chefPlanEndDate: { $gte: getCurrentDateAndTime() } });
        console.log({ length: paidPointsData.length })
        await Promise.all([
            paidPointsData.map((x) => {
                CookPoints.findOneAndUpdate({ _id: x._id }, { $set: { chefDailyLimitBalance: x.chefDailyLimit, updatedAt: getCurrentDateAndTime() } }, { new: true })
            })
        ])
        console.log("Alloting Chef Paid Points Cron Job Completed")
    }
    catch (error) {
        console.log("Alloting Chef Paid Points Cron Job Failed")
        console.log(error)
    }
}

module.exports = allotCookPaidPoints;
