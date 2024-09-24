const { Cook, CookPoints } = require('../../models/index')
const { getCurrentDateAndTime, getCurrentDate, getNextDay, addDaysToDate } = require("../../helpers/dates");
const moment = require("moment");

const allotCookPoints = async () => {
    try {
        console.log("Alloting Cook Points Cron Job Started")
        let [partyCooksData, houseCooksData, cateringsData, chefsData] = await Promise.all([
            Cook.find({ memberType: 1, partyCook: 1, status: { $nin: [0] } }).distinct('_id'),
            Cook.find({ memberType: 1, cookType: 1, status: { $nin: [0] } }).distinct('_id'),
            Cook.find({ memberType: 2, status: { $nin: [0] } }).distinct('_id'),
            Cook.find({ memberType: 1, cookType: 2, status: { $nin: [0] } }).distinct('_id')
        ]);

        await Promise.all([
            CookPoints.updateMany({ cookId: { $in: partyCooksData } }, {
                $set: {
                    partyDailyLimitBalance: 10,
                    updatedAt: getCurrentDateAndTime()
                }
            }, { multi: true }),
            CookPoints.updateMany({ cookId: { $in: partyCooksData }, planEndDate: { $lte: getCurrentDateAndTime() } }, {
                $set: {
                    partyMonthlyLimitBalance: 50,
                    updatedAt: getCurrentDateAndTime(),
                    planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                    planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`
                }
            }, { multi: true }),
            CookPoints.updateMany({ cookId: { $in: houseCooksData } }, {
                $set: {
                    houseDailyLimitBalance: 10,
                    updatedAt: getCurrentDateAndTime()
                }
            }, { multi: true }),
            CookPoints.updateMany({ cookId: { $in: houseCooksData }, planEndDate: { $lte: getCurrentDateAndTime() } }, {
                $set: {
                    houseMonthlyLimitBalance: 50,
                    updatedAt: getCurrentDateAndTime(),
                    planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                    planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`
                }
            }, { multi: true }),
            CookPoints.updateMany({ cookId: { $in: cateringsData } }, {
                $set: {
                    cateringDailyLimitBalance: 10,
                    updatedAt: getCurrentDateAndTime()
                }
            }, { multi: true }),
            CookPoints.updateMany({ cookId: { $in: cateringsData }, planEndDate: { $lte: getCurrentDateAndTime() } }, {
                $set: {
                    cateringMonthlyLimitBalance: 50,
                    updatedAt: getCurrentDateAndTime(),
                    planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                    planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`
                }
            }, { multi: true }),
            CookPoints.updateMany(
                {
                    cookId: { $in: chefsData },
                    chefPlanEndDate: { $lte: getCurrentDateAndTime() }
                }, {
                $set: {
                    chefDailyLimitBalance: 10,
                    chefMonthlyLimitBalance: 50,
                    chefDailyLimit: 10,
                    chefMonthlyLimit: 50,
                    updatedAt: getCurrentDateAndTime(),
                    chefPlanEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                    chefPlanRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`
                }
            }, { multi: true })
        ])

        //Updating Points for Paid Chefs
        let paidPointsData = await CookPoints.find({ cookId: { $in: chefsData }, chefPlanEndDate: { $gte: getCurrentDateAndTime() } });
        await Promise.all([
            paidPointsData.map(async (x) => {
                console.log({ x })
                await CookPoints.findOneAndUpdate({ _id: x._id }, { $set: { chefDailyLimitBalance: x.chefDailyLimit, updatedAt: getCurrentDateAndTime() } }, { new: true })
            })
        ])
        console.log("Alloting Cook Points Cron Job Completed")
    }
    catch (error) {
        console.log("Alloting Cook Points Cron Job Failed")
        console.log(error)
    }
}

module.exports = allotCookPoints;
