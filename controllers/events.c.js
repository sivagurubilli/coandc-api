let { responseJson, sendMail, isRequestDataValid, invoiceGen } = require("../utils/appUtils");
let { EmployerRatings, Transaction, EmployerPoints, Employer, Jobs, Events, ClientPoints, Cook, CookPoints, CookActivity, CookApplication, CookShortlist, EmployerActivity } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
const { checkEmployerValidJobPoints, checkClientValidEventPoints } = require("../helpers/index")
let { getCurrentDateAndTime, getCurrentDate, getDateByMonth, addDaysToDate, checkDatesDifference } = require("../helpers/dates");
const crypto = require("crypto");
const moment = require("moment");
const { isValidProvince, isValidLanguage, isValidQualification, isValidCuisine } = require("../helpers/index");
const { checkChefValidBalance, checkPartyCookValidBalance, checkHouseCookValidBalance, checkCateringValidBalance, checkIsReportedOrNot } = require("../helpers/cook");
const { sendJobApplicationNotification, sendEventApplicationNotification, sendBulkEventNotifications } = require("../helpers/notification")
const { calculateEmployerRatingAverages } = require('../helpers/user');

var mongoose = require('mongoose');

exports.eventPost = async (req, res) => {
    try {

        let {
            eventType, eventDate, cuisines, expectedGuest, pincode, city, location,
            cityCoordinates, locationCoordinates, dishes
        } = Object.assign(req.body, req.query, req.params)
        let clientPlanData = await checkClientValidEventPoints(req.user._id);
        if (!clientPlanData) throw { statusCode: 402, responseCode: 5, msg: "No valid points. Please purchase plan!" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        let data = await Events.create({
            eventType, eventDate, cuisines, expectedGuest, pincode, city, location,
            createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), dishes,
            cityCoordinates, locationCoordinates, clientId: req.user._id, totalInterestsReceived: 0,
            clientPointsId: clientPlanData._id
        })
        if (!data) throw Error("Unable to post event")
        clientPlanData = await ClientPoints.findOneAndUpdate({ _id: clientPlanData._id }, { $inc: { currentEventPoints: -1 } }, { new: true })
        await sendBulkEventNotifications({
            longitude: data.locationCoordinates.coordinates[0], latitude: data.locationCoordinates.coordinates[1],
            location: data.location, eventType: data.eventType, eventId: data._id
        })
        res.status(200).send(responseJson(1, 1, data, 'Event posted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Event post failed', e))
    }
}


exports.fetchEvents = async (req, res) => {
    try {

        let {
            limit, page, skip, id, active, expired
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbFilters = { clientId: req.user._id, isDeleted: false };
        if (id) dbFilters._id = mongoose.Types.ObjectId(id);
        if (active == 1) dbFilters.eventDate = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbFilters.eventDate = { $lte: getCurrentDateAndTime() }

        // let data = await Events.find(dbQuery).sort({ eventDate: 1 }).limit(limit).skip(skip);
        let aggregateQuery = [];
        aggregateQuery.push(
            {
                $match: dbFilters
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: {
                                $and: [
                                    { $lt: ['$eventDate', getCurrentDateAndTime()] },
                                ],
                            },
                            then: 0,
                            else: '$status'
                        },
                    },
                },
            },
            {
                $sort: {
                    eventDate: -1
                }
            },
        )

        let totalData = await Events.aggregate(aggregateQuery);

        //Applying_pagination
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            })
        let data = await Events.aggregate(aggregateQuery)
        res.status(200).send(responseJson(1, 1, data, 'Events fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Events fetch failed', e))
    }
}


exports.editEvent = async (req, res) => {
    try {

        let {
            id, eventType, eventDate, cuisines, expectedGuest, pincode, city, location,
            cityCoordinates, locationCoordinates, dishes, status
        } = Object.assign(req.body, req.query, req.params)
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        let eventData = await Events.findOne({ _id: id, isDeleted: false });
        if (!eventData) throw { statusCode: 404, responseCode: 2, msg: "No event found" }
        if (eventData) {
            if (new Date(eventData.eventDate) < new Date(getCurrentDateAndTime())) throw { statusCode: 410, responseCode: 6, msg: "Event is already expired" }
            if (new Date(eventDate) < new Date(getCurrentDateAndTime())) throw { statusCode: 400, responseCode: 8, msg: "Event date must be greater than current date" }
            if (eventDate && !checkDatesDifference(eventDate, 60)) throw { statusCode: 400, responseCode: 7, msg: "Event date must be less than 60 days from current date" }
            if (eventType && eventType !== eventData.eventType && eventData.isEventTypeEditable == 0) throw { statusCode: 500, responseCode: 2, msg: "Event is not editable as it is already updated earlier." }
            if (eventDate && moment(eventDate).isSame(moment(eventData.eventDate), 'day') == false && eventData.isEventDateEditable == 0) throw { statusCode: 500, responseCode: 2, msg: "Event is not editable as it is already updated earlier." }
        }

        if (eventType && eventData.eventType !== eventType) updateBody.eventType = eventType, updateBody.isEventTypeEditable = 0;
        if (eventDate && moment(eventDate).isSame(moment(eventData.eventDate), 'day') == false) updateBody.eventDate = eventDate, updateBody.isEventDateEditable = 0;
        if (cuisines) updateBody.cuisines = cuisines;
        if (expectedGuest) updateBody.expectedGuest = expectedGuest;
        if (pincode) updateBody.pincode = pincode;
        if (city) updateBody.city = city;
        if (cityCoordinates) updateBody.cityCoordinates = cityCoordinates;
        if (locationCoordinates) updateBody.locationCoordinates = locationCoordinates;
        if (dishes) updateBody.dishes = dishes;
        if (status == 0 || status == 1 || status == 2) updateBody.status = status;
        if (location) updateBody.location = location;


        eventData = await Events.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, eventData, 'Event updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Events edit failed', e))
    }
}

exports.findEvents = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            cuisines, sortingByEventDate
        } = Object.assign(req.body)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        //Employer_Points_Validations
        // let employerPlanData = await checkClientValidPartyCateringPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Please purchase plan!" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQuery = { isDeleted: false, status: 1, eventDate: { $gte: getCurrentDateAndTime() } };
        //DB_Filterings
        if (cuisines) dbQuery.cuisines = { $in: cuisines };

        //Sorting_filters
        let sortFilters = { distanceInMeters: 1 }
        sortFilters.eventDate = (sortingByEventDate) ? parseInt(sortingByEventDate) : 1;

        let aggregateQuery = [];
        if (latitude && longitude) {
            const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
            const maxDistanceMeters = 100 * 1000;  //100 KM RADIUS
            aggregateQuery.push({
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distanceInMeters',
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    key: 'locationCoordinates'
                }
            },)
        }

        aggregateQuery.push(
            {
                $lookup: {
                    from: "employers",
                    localField: "clientId",
                    foreignField: "_id",
                    as: "employers"
                }
            },
            {
                $unwind: "$employers"
            },
            {
                $match: { "employers.status": 1, ...dbQuery }
            },
            {
                $lookup: {
                    from: "cookreports",
                    let: { eventId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [{ $eq: ["$eventId", "$$eventId"] }, { $eq: ["$cookId", mongoose.Types.ObjectId(req.user._id)] }] }
                            }
                        }
                    ],
                    as: "reportsData"
                }
            },
            {
                $match: {
                    "reportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: "employerreports",
                    let: { employerId: "$employers._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [{ $eq: ["$employerId", "$$employerId"] }, { $eq: ["$cookId", mongoose.Types.ObjectId(req.user._id)] }] }
                            }
                        }
                    ],
                    as: "employerreportsData"
                }
            },
            {
                $match: {
                    "employerreportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: 'cookactivities',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$eventId', '$$eventId'] },
                                        { $eq: ['$cookId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'viewed'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'cookActivities'
                }
            },
            {
                $lookup: {
                    from: 'cookapplications',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$eventId', '$$eventId'] },
                                        { $eq: ['$cookId', mongoose.Types.ObjectId(req.user._id)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'applicationData'
                }
            },
            {
                $lookup: {
                    from: 'cookshortlists',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$eventId', '$$eventId'] },
                                        { $eq: ['$cookId', mongoose.Types.ObjectId(req.user._id)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'shortlistData'
                }
            },
            {
                $addFields: {
                    applicationData: {
                        $cond: {
                            if: { $gt: [{ $size: '$applicationData' }, 0] },
                            then: { $arrayElemAt: ['$applicationData', 0] },
                            else: null
                        }
                    },
                    shortlistData: {
                        $cond: {
                            if: { $gt: [{ $size: '$shortlistData' }, 0] },
                            then: { $arrayElemAt: ['$shortlistData', 0] },
                            else: null
                        }
                    },
                    isViewed: {
                        $cond: {
                            if: { $gt: [{ $size: '$cookActivities' }, 0] },
                            then: true,
                            else: false
                        }
                    },
                    isApplied: {
                        $cond: {
                            if: { $gt: [{ $size: '$applicationData' }, 0] },
                            then: true,
                            else: false
                        }
                    },
                    isShortlisted: {
                        $cond: {
                            if: { $gt: [{ $size: '$shortlistData' }, 0] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    cookActivities: 0
                }
            },
            {
                $sort: sortFilters
            },
        )
        let totalData = await Events.aggregate(aggregateQuery);
        //Pagination
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            });
        let data = await Events.aggregate(aggregateQuery);

        data = JSON.parse(JSON.stringify(data));
        data = data.map((x) => {
            if (latitude && longitude) x.distanceInMeters = Math.round(x.distanceInMeters), x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
            x.clientId = { fullName: x.employers.fullName, dp: x.employers.dp, _id: x.employers._id }
            delete x.employers;
            return x;
        })
        let isNew = totalData.some(job => !job.isViewed);
        res.status(200).send(responseJson(1, 1, data, 'Events fetched successfully', {}, data.length, totalData.length, isNew))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Events fetch failed', e))
    }
}

exports.viewEvent = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ eventId: id, cookId: req.user._id });

        let jobData = await Events.findOne({ _id: id, isDeleted: false }).populate(
            [{ path: 'clientId', select: 'fullName weavyId email mobile whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages dp whatsappContact emailContact smsContact chatContact notificationStatus' }]
        );
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No event found" }
        jobData = JSON.parse(JSON.stringify(jobData));

        let [logData, applicationData, shortlistData] = await Promise.all([
            CookActivity.create({ cookId: req.user._id, eventId: id, employerId: jobData.clientId._id, activity: "viewed", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }),
            CookApplication.findOne({ cookId: req.user._id, eventId: id }),
            CookShortlist.findOne({ cookId: req.user._id, eventId: id, isDeleted: false })
        ])
        let ratingsData = await EmployerRatings.find({ employerId: jobData.clientId._id }).select({ _id: 0, createdAt: 0, updatedAt: 0, cookId: 0, employerId: 0 });
        ratingsData = JSON.parse(JSON.stringify(ratingsData));
        jobData.ratingsData = calculateEmployerRatingAverages(ratingsData);
        jobData.ratingsList = await EmployerRatings.find({ employerId: jobData.clientId._id }).populate([{ path: 'cookId', select: 'fullName dp' }, { path: 'employerId', select: 'fullName dp' }]).sort({ createdAt: -1 });

        jobData.isViewed = true;
        jobData.isApplied = (applicationData) ? true : false;
        jobData.isShortlisted = (shortlistData) ? true : false;
        res.status(200).send(responseJson(1, 1, {
            eventData: jobData,
            applicationData,
            shortlistData
        }, 'Event viewed successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Event view failed', e))
    }
}

exports.applyEvent = async (req, res) => {
    try {
        let {
            id, pointsData, updateBody, cookData
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ eventId: id, cookId: req.user._id });

        const jobData = await Events.findOne({ _id: id, isDeleted: false });
        console.log(jobData)
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No event found" }

        const applicationLogData = await CookApplication.findOne({ cookId: req.user._id, eventId: id, isDeleted: false });
        if (applicationLogData) throw { statusCode: 500, resposeCode: 5, msg: "You have already applied for this event earlier." }

        let activityLogQuery = {
            isDeleted: false,
            cookId: req.user._id,
            activity: {
                $in: ['applied', 'mobileinteraction', 'chatinteraction', 'whatsappinteraction', 'cancelled']
            },
            eventId: id
        }
        let activityLogsData = await CookActivity.find(activityLogQuery);
        if (!activityLogsData.length) {
            if (req.user.memberType == 2) pointsData = await checkCateringValidBalance(req.user._id), updateBody = { cateringDailyLimitBalance: -1, cateringMonthlyLimitBalance: -1 }
            else if (req.user.memberType == 1) pointsData = await checkPartyCookValidBalance(req.user._id), updateBody = { partyDailyLimitBalance: -1, partyMonthlyLimitBalance: -1 }
            if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points. Please purchase plan!" }
            cookData = await CookPoints.findOneAndUpdate({ _id: pointsData._id }, { $inc: updateBody }, { new: true })
        }


        let [data, logData, eventsData] = await Promise.all([
            CookApplication.create({
                cookId: req.user._id, eventId: id, applicationStatus: 'applied',
                appliedAt: getCurrentDateAndTime(), employerId: jobData.clientId,
                expiredAt: jobData.eventDate, clientPointsId: jobData.clientPointsId,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()

            }),
            CookActivity.create({ cookId: req.user._id, eventId: id, employerId: jobData.clientId, activity: "applied", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }),
            Events.findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { totalInterestsReceived: 1 } }, { new: true }).populate([{ path: "clientId" }]),
        ])

        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to apply event. Try again" }

        //For Email Message
        sendMail({
            to: eventsData.clientId.email,
            type: "eventApplication",
            subject: `New Application Received for your event`,
            options: {
                username: eventsData.clientId.fullName,
                eventName: eventsData.eventType
            }
        })
        //Sending Push Notifications
        if (eventsData.clientId.deviceToken && eventsData.clientId.notificationStatus == 1) {
            await sendEventApplicationNotification({ designation: eventsData.eventType, deviceToken: eventsData.clientId.deviceToken, employerId: eventsData.clientId._id, applicationId: data._id });
        }
        res.status(200).send(responseJson(1, 1, data, 'Event applied successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Event applying failed', e))

    }
}

exports.applyEventShortlist = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ eventId: id, cookId: req.user._id });

        const jobData = await Events.findOne({ _id: id, isDeleted: false });
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No event found" }

        const shortistedLogData = await CookShortlist.findOne({ cookId: req.user._id, eventId: id, isDeleted: false });
        if (shortistedLogData) throw { statusCode: 500, resposeCode: 5, msg: "You have already shortlisted this event earlier." }

        let [data, logData] = await Promise.all([
            CookShortlist.create({
                cookId: req.user._id,
                eventId: id,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime(),
                employerId: jobData.clientId
            }),
            CookActivity.create({ cookId: req.user._id, eventId: id, employerId: jobData.clientId, activity: "shortlisted", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        ])

        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to shortlist event. Try again" }
        res.status(200).send(responseJson(1, 1, data, 'Event Shortlisted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Event shortlisting failed', e))

    }
}

exports.fetchAppliedEventsByCook = async (req, res) => {
    try {
        let {
            id, limit, skip, page
        } = Object.assign(req.body, req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let [data, totalData] = await Promise.all([
            CookApplication.find({ cookId: req.user._id, eventId: { $exists: true }, isDeleted: false, applicationStatus: { $nin: ["cancelled"] } }).populate([{
                path: 'eventId', populate: [{ path: 'clientId', select: 'fullName email mobile whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages dp whatsappContact emailContact smsContact chatContact notificationStatus' }]
            }]).sort({ 'appliedAt': -1 }).limit(limit).skip(skip),
            CookApplication.find({ cookId: req.user._id, eventId: { $exists: true }, isDeleted: false, applicationStatus: { $nin: ["cancelled"] } })
        ])

        res.status(200).send(responseJson(1, 1, data, 'Applied events fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Applied events fetching failed', e))
    }
}

exports.fetchShortlistedEventsByCook = async (req, res) => {
    try {
        let {
            id, limit, skip, page
        } = Object.assign(req.body, req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = { cookId: req.user._id, eventId: { $exists: true }, isDeleted: false };
        if (id) dbQuery._id = id;

        let [data, totalData] = await Promise.all([
            CookShortlist.find(dbQuery).populate([
                { path: 'eventId' },
                { path: 'employerId', select: 'fullName email mobile dp memberType whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages weavyId' }
            ]).sort({ 'appliedAt': -1 }).limit(limit).skip(skip),
            CookShortlist.find(dbQuery)
        ])

        res.status(200).send(responseJson(1, 1, data, 'Shortlisted events fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Shortlisted events fetching failed', e))
    }
}

exports.fetchEventApplications = async (req, res) => {
    try {

        let {
            id, limit, skip, page, applicationStatus, eventId, cookId
        } = Object.assign(req.body, req.query)

        let matchingFilters = { employerId: mongoose.Types.ObjectId(req.user._id), isDeleted: false, expiredAt: { $gte: getCurrentDateAndTime() } }
        if (eventId) matchingFilters.eventId = mongoose.Types.ObjectId(eventId);
        if (cookId) matchingFilters.cookId = mongoose.Types.ObjectId(cookId);
        if (applicationStatus) matchingFilters.applicationStatus = applicationStatus;


        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let aggregateQuery = [
            {
                $lookup: {
                    from: "employerreports",
                    let: { cookId: "$cookId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [{ $eq: ["$cookId", "$$cookId"] }, { $eq: ["$employerId", mongoose.Types.ObjectId(req.user._id)] }] }
                            }
                        }
                    ],
                    as: "reportsData"
                }
            },
            {
                $match: {
                    ...matchingFilters,
                    "reportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: "events",
                    localField: "eventId",
                    foreignField: "_id",
                    as: "eventsData"
                }
            },
            {
                $unwind: "$eventsData"
            },
            {
                $lookup: {
                    from: "cooks",
                    localField: "cookId",
                    foreignField: "_id",
                    as: "cooksData"
                }
            },
            {
                $unwind: "$cooksData"
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { applicationId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$applicationId', '$$applicationId'] },
                                        {
                                            $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)]
                                        },
                                        { $eq: ['$activity', 'viewed'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'employeractivities'
                }
            },
            {
                $addFields: {
                    isViewed: {
                        $cond: {
                            if: { $gt: [{ $size: '$employeractivities' }, 0] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    employeractivities: 0
                }
            },
        ]

        let totalData = await CookApplication.aggregate(aggregateQuery);
        //Applying_Paginations
        aggregateQuery.push(
            {
                $sort: {
                    appliedAt: -1
                }
            },
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            })

        let data = await CookApplication.aggregate(aggregateQuery)
        let isNew = totalData.some(application => !application.isViewed);
        res.status(200).send(responseJson(1, 1, data, 'Applications fetched successfully', {}, data.length, totalData.length, isNew))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching applications failed', e))
    }
}

exports.viewEventApplication = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        // let pointsData = await checkClientValidEventPoints(req.user._id);
        // if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points.Try subscription" }

        let data = await CookApplication.findOne({ _id: id }).populate([{ path: "eventId" }, { path: "cookId" }]);
        if (!data) throw { statusCode: 500, responseCode: 2, msg: "No application found" }
        data = JSON.parse(JSON.stringify(data)); data.isViewed = true;

        let activityLogsData = await EmployerActivity.create({
            employerId: req.user._id, applicationId: id,
            activity: 'viewed', createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime()
        });
        res.status(200).send(responseJson(1, 1, data, 'Application fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Application fetching failed', e))

    }
}

exports.updateEventApplication = async (req, res) => {
    try {
        let {
            id, applicationStatus
        } = Object.assign(req.body)

        const requiredFields = {
            id, applicationStatus
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        // let pointsData = await checkClientValidEventPoints(req.user._id);
        // if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points.Try subscription" }

        let data = await CookApplication.findOneAndUpdate({ _id: id }, { $set: { applicationStatus } }, { new: true });
        if (!data) throw { statusCode: 500, responseCode: 2, msg: "No application found" }

        res.status(200).send(responseJson(1, 1, data, 'Application updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Application updation failed', e))

    }
}
