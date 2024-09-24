const { Cook, CookPoints, Events, Jobs, ClientRequirement } = require('../../models/index')
const { getCurrentDateAndTime, getCurrentDate, getNextDay } = require("../../helpers/dates");

const setJobsExpiryStatus = async () => {
    try {
        console.log("Expiry status job started")
        await Promise.all([
            Jobs.updateMany(
                {
                    expiryDate: { $lte: getCurrentDateAndTime() }
                }, {
                $set: {
                    status: 0,
                    updatedAt: getCurrentDateAndTime()
                }
            }, { multi: true }),
            Events.updateMany(
                {
                    eventDate: { $lte: getCurrentDateAndTime() }
                }, {
                $set: {
                    status: 0,
                    updatedAt: getCurrentDateAndTime()
                }
            }, { multi: true }),

            ClientRequirement.updateMany({
                expiryDate: { $lte: getCurrentDateAndTime() }
            }, {
                $set: {
                    status: 0,
                    updatedAt: getCurrentDateAndTime()
                }
            })
        ])
        console.log("Expiry status job completed.")
    }
    catch (error) {
        console.log("Expiry status job failed")
        console.log(error)
    }
}

module.exports = setJobsExpiryStatus;
