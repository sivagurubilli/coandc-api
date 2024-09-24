let { responseJson, sendMail, isRequestDataValid, invoiceGen, sendWhatsappSms, calculateDistance, sendNotice } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Transaction, EmployerPoints, EmployerRatings, Employer, Jobs, CookPoints, CookActivity, CookApplication, CookShortlist, EmployerActivity } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
const { checkEmployerValidJobPoints, isValidCuisine } = require("../helpers/index")
let { getCurrentDateAndTime, getCurrentDate, getDateByMonth, addDaysToDate } = require("../helpers/dates");
const { checkChefValidBalance, checkIsReportedOrNot } = require("../helpers/cook");
const { sendJobApplicationNotification, sendBulkJobNotificationsToChef } = require("../helpers/notification")
const { calculateEmployerRatingAverages } = require('../helpers/user');
const crypto = require("crypto");
const moment = require("moment");
var mongoose = require('mongoose');

exports.createJobPost = async (req, res) => {
    try {

        let pointsData = await checkEmployerValidJobPoints(req.user._id);
        if (!pointsData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points.Try subscription" }
        if (req.body.cuisines && req.body.cuisines.length) {
            await isValidCuisine(req.body.cuisines);
        }
        let jobData = await Jobs.create({
            ...req.body,
            employerPointsId: pointsData._id,
            maximumResponsesCount: pointsData.totalResponsePoints,
            currentResponsesCount: 0,
            expiryDate: pointsData.planExpiresAt,
            employerId: req.user._id,
            createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
        });
        if (!jobData) throw Error("Unable to post job.Try again")
        await EmployerPoints.findOneAndUpdate({ _id: pointsData._id }, { $inc: { currentJobPoints: -1 } }, { new: true });
        await sendBulkJobNotificationsToChef({ longitude: jobData.locationCoordinates.coordinates[0], latitude: jobData.locationCoordinates.coordinates[1], location: jobData.location, designation: jobData.designation, jobId: jobData._id });
        res.status(200).send(responseJson(1, 1, jobData, 'Job posted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job post failed', e))
    }
}

exports.getJobPosts = async (req, res) => {
    try {

        let {
            limit, page, skip,
            expired, active,
            id
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 100
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbFilters = { employerId: mongoose.Types.ObjectId(req.user._id), isDeleted: false };
        if (id) dbFilters._id = mongoose.Types.ObjectId(id);
        if (active == 1) dbFilters.expiryDate = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbFilters.expiryDate = { $lte: getCurrentDateAndTime() }

        // let data = await Jobs.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);

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
                                    { $lt: ['$expiryDate', getCurrentDateAndTime()] },
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
                    createdAt: -1
                }
            },
        )

        let totalData = await Jobs.aggregate(aggregateQuery);

        //Applying_pagination
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            })
        let data = await Jobs.aggregate(aggregateQuery)
        res.status(200).send(responseJson(1, 1, data, 'Jobs fetched successfully!', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Jobs fetching failed', e))
    }
}

exports.editJobPosts = async (req, res) => {
    try {

        let {
            designation,
            salary,
            experience,
            openings,
            urgency,
            contactNumber,
            whatsappUpdate,
            status,
            description,
            visibility,
            pincode,
            food,
            accommodation,
            qualification,
            dishes,
            location,
            locationCoordinates,
            id,
            cuisines
        } = Object.assign(req.body)

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (cuisines && !cuisines.length) throw { statusCode: 400, msg: "Please provide atleast one cuisine" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
            updateBody.cuisines = cuisines;
        }
        if (dishes !== null && dishes !== undefined) updateBody.dishes = dishes;
        if (designation) updateBody.designation = designation;
        if (salary) updateBody.salary = salary;
        if (experience) updateBody.experience = experience;
        if (openings !== null && openings !== undefined) updateBody.openings = openings;
        if (urgency) updateBody.urgency = urgency;
        if (contactNumber) updateBody.contactNumber = contactNumber;
        if (whatsappUpdate == 0 || whatsappUpdate == 1) updateBody.whatsappUpdate = whatsappUpdate;
        if (status == 0 || status == 1 || status == 2) updateBody.status = status;
        if (description) updateBody.description = description;
        if (visibility == 0 || visibility == 1) updateBody.visibility = visibility;
        if (pincode) updateBody.pincode = pincode;
        if (food == 0 || food == 1) updateBody.food = food;
        if (accommodation == 0 || accommodation == 1) updateBody.accommodation = accommodation;
        if (qualification !== null && qualification !== undefined) updateBody.qualification = qualification;
        if (location) updateBody.location = location;
        if (locationCoordinates) updateBody.locationCoordinates = locationCoordinates;

        let data = await Jobs.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("No job found")
        if (data && new Date(data.expiryDate) < new Date(getCurrentDateAndTime())) throw { statusCode: 500, responseCode: 6, msg: "Job is already expired" }
        data = await Jobs.findOneAndUpdate({ isDeleted: false, _id: id }, { $set: updateBody }, { new: true });
        if (!data) throw Error("Unable to edit.Try again")
        res.status(200).send(responseJson(1, 1, data, 'Job updated successfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job updation failed', e))
    }
}

exports.findJobs = async (req, res) => {
    try {

        let {
            latitude, longitude,
            minimumExperience, maximumExperience,
            minimumSalary, maximumSalary,
            limit, page, skip,
            cuisines, sortingBySalary, sortingByCreatedAt
        } = Object.assign(req.body)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 100;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQuery = { status: 1, isDeleted: false, expiryDate: { $gte: getCurrentDateAndTime() } };

        //Filterings
        if (cuisines) dbQuery.cuisines = { $in: cuisines };
        if (minimumExperience !== null && minimumExperience !== undefined && maximumExperience) dbQuery.experience = { $gte: minimumExperience, $lte: maximumExperience };
        if (minimumSalary && maximumSalary && maximumSalary != 100000) dbQuery.salary = { $gte: minimumSalary, $lt: maximumSalary };
        if (minimumSalary && maximumSalary && maximumSalary == 100000) dbQuery.salary = { $gte: minimumSalary };

        //Sorting_filters
        let sortFilters = { distanceInMeters: 1 }
        if (sortingBySalary && sortingByCreatedAt) throw { statusCode: 400, responseCode: 2, msg: "Cannot apply multiple sortings" }
        if (!sortingBySalary && !sortingByCreatedAt) sortFilters.createdAt = -1;
        if (sortingBySalary) sortFilters.salary = parseInt(sortingBySalary);
        if (sortingByCreatedAt) sortFilters.createdAt = parseInt(sortingByCreatedAt);


        let aggregateQuery = [];
        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        };
        if (latitude && longitude) {
            const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
            const maxDistanceMeters = 500 * 1000;  //100 KM RADIUS
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
                    localField: "employerId",
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
                    let: { jobId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [{ $eq: ["$jobId", "$$jobId"] }, { $eq: ["$cookId", mongoose.Types.ObjectId(req.user._id)] }] }
                            }
                        }
                    ],
                    as: "cookreportsData"
                }
            },
            {
                $match: {
                    "cookreportsData": { $size: 0 }
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
                    let: { jobId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$jobId', '$$jobId'] },
                                        { $eq: ['$cookId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$isDeleted', false] },
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
                    let: { jobId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$jobId', '$$jobId'] },
                                        { $eq: ['$cookId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$isDeleted', false] },
                                        { $in: ['$applicationStatus', ['applied', 'selected', 'rejected']] }
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
                    let: { jobId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$jobId', '$$jobId'] },
                                        { $eq: ['$isDeleted', false] },
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
        );

        //Pushing to facet
        facetQuery.paginatedData.push(
            {
                $project: { cookActivities: 0 }
            },
            {
                $sort: sortFilters
            },
            {
                $skip: skip,
            },
            {
                $limit: limit,
            });

        aggregateQuery.push({
            $facet: facetQuery
        })

        // let totalData = await Jobs.aggregate(aggregateQuery);
        //Pagination

        // let data = await Jobs.aggregate(aggregateQuery);

        // data = JSON.parse(JSON.stringify(data));
        // data = data.map((x) => {
        //     if (latitude && longitude) x.distanceInMeters = Math.round(x.distanceInMeters), x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
        //     x.employerId = { fullName: x.employers.fullName, dp: x.employers.dp, _id: x.employers._id }
        //     delete x.employers;
        //     return x;
        // })

        let data = await Jobs.aggregate(aggregateQuery);
        data = JSON.parse(JSON.stringify(data));
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length) {
            paginatedData = paginatedData.map((x) => {
                if (latitude && longitude) x.distanceInMeters = Math.round(x.distanceInMeters), x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                x.employerId = { fullName: x.employers.fullName, dp: x.employers.dp, _id: x.employers._id }
                delete x.employers;
                return x;
            })
        }

        // data = data.map((x) => {
        //     if (latitude && longitude) x.distanceInMeters = Math.round(x.distanceInMeters), x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
        //     x.employerId = { fullName: x.employers.fullName, dp: x.employers.dp, _id: x.employers._id }
        //     delete x.employers;
        //     return x;
        // })

        let isNew = paginatedData.some(job => !job.isViewed);
        res.status(200).send(responseJson(1, 1, paginatedData, 'Jobs fetched successfully', {}, paginatedDataCount, totalDataCount, isNew))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Jobs fetch failed', e))
    }
}


exports.viewJob = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ jobId: id, cookId: req.user._id });

        let jobData = await Jobs.findOne({ _id: id, isDeleted: false }).populate(
            [{ path: 'employerId', select: 'fullName email mobile whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages dp whatsappContact emailContact smsContact chatContact notificationStatus weavyId' }]
        );
        if (!jobData) throw { statusCode: 500, responseCode: 3, msg: "No job found" }
        jobData = JSON.parse(JSON.stringify(jobData));

        let [logData, applicationData, shortlistData] = await Promise.all([
            CookActivity.create({ cookId: req.user._id, jobId: id, isDeleted: false, employerId: jobData.employerId._id, activity: "viewed", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }),
            CookApplication.findOne({ cookId: req.user._id, jobId: id }),
            CookShortlist.findOne({ cookId: req.user._id, jobId: id, isDeleted: false })
        ])
        let ratingsData = await EmployerRatings.find({ employerId: jobData.employerId._id }).select({ _id: 0, createdAt: 0, updatedAt: 0, cookId: 0, employerId: 0 });
        ratingsData = JSON.parse(JSON.stringify(ratingsData));
        jobData.ratingsData = calculateEmployerRatingAverages(ratingsData);
        jobData.ratingsList = await EmployerRatings.find({ employerId: jobData.employerId._id }).populate([{ path: 'cookId', select: 'fullName dp' }, { path: 'employerId', select: 'fullName dp' }]).sort({ createdAt: -1 });

        jobData.isViewed = true;
        jobData.isApplied = (applicationData) ? true : false;
        jobData.isShortlisted = (shortlistData) ? true : false;
        res.status(200).send(responseJson(1, 1, {
            jobData,
            applicationData,
            shortlistData
        }, 'Job viewed successfully'))
    }
    catch (e) {
        console.log({ e })
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job view failed', e))
    }
}


exports.applyJob = async (req, res) => {
    try {
        let {
            id, pointsData, cookData
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ jobId: id, cookId: req.user._id });

        const jobData = await Jobs.findOne({ _id: id, isDeleted: false }).populate([{ path: 'employerId' }]);
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No job found" }
        if (jobData && jobData.status == 0) throw { statusCode: 403, responseCode: 0, msg: "No longer accepting the applications as job was already expired." }
        if (jobData && jobData.status == 2) throw { statusCode: 403, responseCode: 0, msg: "This job has been disabled by the employer." }
        if (jobData && parseInt(jobData.maximumResponsesCount) <= parseInt(jobData.currentResponsesCount)) throw { statusCode: 500, responseCode: 6, msg: "Application limit reached. Contact the Employer directly" }

        //Calculating_User_Distance&&Job_Location
        if (!jobData.visibility || jobData.visibility == 0) {
            if (req.user.currentCityCoordinates && req.user.currentCityCoordinates.coordinates) {
                let jobLocationDistanceInKm = calculateDistance(jobData.locationCoordinates.coordinates[1], jobData.locationCoordinates.coordinates[0],
                    req.user.currentCityCoordinates.coordinates[1], req.user.currentCityCoordinates.coordinates[0]);
                console.log({ jobLocationDistanceInKm })
                if (jobLocationDistanceInKm > 100) throw { statusCode: 403, responseCode: 0, msg: "This employer has disabled applications from other locations." }
            }
            if (!req.user.currentCityCoordinates || !req.user.currentCityCoordinates.coordinates) {
                if ((jobData.location).toLowerCase() != (req.user.currentCityName).toLowerCase()) throw { statusCode: 403, responseCode: 0, msg: "This employer has disabled applications from other locations." }
            }

        }

        //Application_process
        const applicationLogData = await CookApplication.findOne({ cookId: req.user._id, jobId: id, applicationStatus: { $nin: ['cancelled'] } });
        if (applicationLogData) throw { statusCode: 500, resposeCode: 5, msg: "Job is already applied earlier." }

        let chefDailyLimitBalance = 0;
        let chefMonthlyLimitBalance = 0;
        let activityLogQuery = {
            isDeleted: false,
            cookId: req.user._id,
            activity: {
                $in: ['applied', 'mobileinteraction', 'chatinteraction', 'whatsappinteraction', 'cancelled']
            },
            jobId: id
        }

        let activityLogsData = await CookActivity.find(activityLogQuery);
        if (!activityLogsData.length) {
            pointsData = await checkChefValidBalance(req.user._id);
            console.log({ pointsData })
            if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points. Try subscription" }
            chefMonthlyLimitBalance = -1; chefDailyLimitBalance = -1;
            cookData = await CookPoints.findOneAndUpdate({ _id: pointsData._id }, { $inc: { chefDailyLimitBalance, chefMonthlyLimitBalance } }, { new: true })
        }

        let [data, logData, jobsData] = await Promise.all([
            CookApplication.create({
                cookId: req.user._id, jobId: id, applicationStatus: 'applied',
                appliedAt: getCurrentDateAndTime(), employerId: jobData.employerId._id, employerPointsId: jobData.employerPointsId,
                expiredAt: jobData.expiryDate,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()

            }),
            CookActivity.create({ cookId: req.user._id, jobId: id, employerId: jobData.employerId._id, activity: "applied", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }),
            Jobs.findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { currentResponsesCount: 1 }, $set: { updatedAt: getCurrentDateAndTime() } }, { new: true }),
        ])

        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to apply job. Try again" }

        //For Whatsapp Message
        if (jobData.contactNumber && jobData.whatsappUpdate == 1) {
            await sendWhatsappSms({
                role: "cook", cookId: req.user._id, countryCode: "+91", phoneNumber: jobData.contactNumber, type: "Template",
                template: {
                    name: "new_application_received",
                    languageCode: "en",
                    bodyValues: [
                        `${jobData.employerId.fullName}`,
                        `${jobData.designation}`,
                        `${req.user.fullName}`,
                        `${req.user.mobile}`
                    ],
                    headerValues: [`${jobData.designation}`]
                }
            })
        }

        //For Email Message
        sendMail({
            to: jobData.employerId.email,
            type: "jobApplication",
            subject: `New application received for ${jobData.designation}`,
            options: {
                employername: jobData.employerId.fullName,
                designation: jobData.designation,
            }
        })

        //Sending Push Notifications
        if (jobData.employerId.deviceToken) {
            await sendJobApplicationNotification({ designation: jobData.designation, deviceToken: jobData.employerId.deviceToken, employerId: jobData.employerId._id, applicationId: data._id });
        }
        res.status(200).send(responseJson(1, 1, data, 'Job Applied successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job applying failed', e))
    }
}

exports.applyJobShortlist = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ jobId: id, cookId: req.user._id });

        const jobData = await Jobs.findOne({ _id: id, isDeleted: false });
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No job found" }

        const shortistedLogData = await CookShortlist.findOne({ cookId: req.user._id, jobId: id, isDeleted: false });
        if (shortistedLogData) throw { statusCode: 500, resposeCode: 5, msg: "Job is already shortlisted earlier." }

        let [data, logData] = await Promise.all([
            CookShortlist.create({
                cookId: req.user._id,
                jobId: id,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime(),
                employerId: jobData.employerId
            }),
            CookActivity.create({ cookId: req.user._id, jobId: id, employerId: jobData.employerId, activity: "shortlisted", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        ])

        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to shortlist job.Try again" }
        res.status(200).send(responseJson(1, 1, data, 'Job Shortlisted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job shortlisting failed', e))

    }
}

exports.fetchAppliedJobsByCook = async (req, res) => {
    try {
        let {
            id, limit, skip, page, applicationStatus
        } = Object.assign(req.body, req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let [data, totalData] = await Promise.all([
            CookApplication.find({ cookId: req.user._id, jobId: { $exists: true }, isDeleted: false, applicationStatus: { $nin: ["cancelled"] } }).populate([{
                path: 'jobId', populate: [{ path: 'employerId', select: 'fullName email mobile whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages dp whatsappContact emailContact smsContact chatContact notificationStatus' }]
            }]).sort({ 'appliedAt': -1 }).limit(limit).skip(skip),
            CookApplication.find({ cookId: req.user._id, jobId: { $exists: true }, isDeleted: false, applicationStatus: { $nin: ["cancelled"] } })
        ])

        res.status(200).send(responseJson(1, 1, data, 'Applied jobs fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Applied jobs fetching failed', e))
    }
}

exports.fetchShortlistedJobsByCook = async (req, res) => {
    try {
        let {
            id, limit, skip, page
        } = Object.assign(req.body, req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = { cookId: req.user._id, jobId: { $exists: true }, isDeleted: false };
        if (id) dbQuery._id = id;

        let [data, totalData] = await Promise.all([
            CookShortlist.find(dbQuery).populate([{
                path: 'jobId', populate: [{ path: 'employerId', select: 'fullName email mobile whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages  dp whatsappContact emailContact smsContact chatContact notificationStatus' }]
            }]).sort({ 'appliedAt': -1 }).limit(limit).skip(skip),
            CookShortlist.find(dbQuery)
        ])

        res.status(200).send(responseJson(1, 1, data, 'Shortlisted jobs fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Shortlisted jobs fetching failed', e))
    }
}



exports.fetchChefJobApplications = async (req, res) => {
    try {

        let {
            id, limit, skip, page, applicationStatus, jobId, cookId
        } = Object.assign(req.body, req.query)

        let matchingFilters = { employerId: mongoose.Types.ObjectId(req.user._id), isDeleted: false, expiredAt: { $gte: getCurrentDateAndTime() } }
        if (jobId) matchingFilters.jobId = mongoose.Types.ObjectId(jobId);
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
                    from: "jobs",
                    localField: "jobId",
                    foreignField: "_id",
                    as: "jobsData"
                }
            },
            {
                $unwind: "$jobsData"
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
        data = JSON.parse(JSON.stringify(data))
        let isNew = totalData.some(application => !application.isViewed);
        res.status(200).send(responseJson(1, 1, data, 'Applications fetched successfully', {}, data.length, totalData.length, isNew))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching applications failed', e))
    }
}

exports.viewChefJobApplication = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        // let pointsData = await checkEmployerValidJobPoints(req.user._id);
        // if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points.Try subscription" }

        let data = await CookApplication.findOne({ _id: id }).populate([{ path: "jobId" }, { path: "cookId" }]);
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

exports.updateChefJobApplication = async (req, res) => {
    try {
        let {
            id, applicationStatus
        } = Object.assign(req.body)

        const requiredFields = {
            id, applicationStatus
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        // let pointsData = await checkEmployerValidJobPoints(req.user._id);
        // if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points.Try subscription" }

        let data = await CookApplication.findOneAndUpdate({ _id: id }, { $set: { applicationStatus } }, { new: true });
        if (!data) throw { statusCode: 500, responseCode: 2, msg: "No application found" }

        res.status(200).send(responseJson(1, 1, data, 'Application status updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Application status updation failed', e))

    }
}
