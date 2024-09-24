
let { privateKey, adminEmail } = require('../config/config')
let { generateOtp, isValidDate, responseJson, sendMail, isRequestDataValid, invoiceGen, capitalizeEveryInnerWord, checkValueType, storeResumeTemplate } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Advertisements, BlockedMac, Admin, Role, Events, Transaction, Cook, CookPlan, Employer, ClientPlan, EmployerPlan, ClientPoints, ClientRequirement, EmployerPoints, Jobs, CSExecutive, DisposalAccounts,
    CookActivity, CookApplication, CookPoints, CookShortlist, CookVerify, EmailVerify, EmployerActivity, EmployerVerify,
    CookReports, EmployerReports, Ticket, ResumeTemplate, AdminAuth, AllowedMac, CookRatings, EmployerRatings, AdminOtp } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate, generateExpiryDate, isDateExpired } = require("../helpers/dates");
const { isValidProvince, isValidLanguage, isValidQualification, isValidPartyPlates, isValidCuisine, isValidCateringPlates } = require("../helpers/index")
const { isEmailAvailable, isMobileAvailable, getMobileData, checkRegistrationLimits, assignInitialFreePlan, isValidName, isWhatsappNumberAvailable, generateHourlyData, calculateCookAverages, calculateEmployerRatingAverages } = require('../helpers/user');
const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getCookProfilePercent, getEmployerProfilePercent } = require("../helpers/points");
const { sendBulkEventNotifications, sendBulkJobNotificationsToChef } = require("../helpers/notification")


exports.adminLogin = async (req, res) => {
    try {

        let {
            username,
            password,
            deviceToken
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            username,
            password
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);


        // let dbQuery = { status: { $in: [1, 2] } };
        // const phoneNumberPattern = /^[0-9]{10}$/;
        // if (!phoneNumberPattern.test(emailOrMobile)) dbQuery.email = (emailOrMobile).toLowerCase();
        // else if (phoneNumberPattern.test(emailOrMobile)) dbQuery.mobile = emailOrMobile;

        // if (deviceToken) updateQuery.deviceToken = deviceToken;

        let data = await Admin.findOne({ username }).populate([{ path: "roleId", select: "roleName" }])
        data = JSON.parse(JSON.stringify(data));
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No account found.Try signup" }
        if (data && data.status == 2) throw { statusCode: 500, responseCode: 3, msg: "Your account is suspended.Contact support team" }
        if (data && data.status == 0) throw { statusCode: 403, responseCode: 4, msg: "Your account is not verified.Try register again" }

        const isPasswordMatch = bcrypt.compareSync(password, data.password);
        if (!isPasswordMatch) throw { statusCode: 400, responseCode: 6, msg: "Invalid password.Try again" }

        data.token = jwt.sign({ id: data._id }, privateKey);
        res.status(200).send(responseJson(1, 1, data, 'Login success'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Login failed', e))
    }
}

exports.getHousecooksList = async (req, res) => {
    try {

        let {
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = {
            status: { $in: [1, 2] }, memberType: 1, cookType: 1
        };
        if (id) dbQuery._id = id;

        let totalData = await Cook.find(dbQuery);
        let data = await Cook.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        res.status(200).send(responseJson(1, 1, data, 'Cooks fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cooks fetching failed', e))

    }
}

exports.getChefsList = async (req, res) => {
    try {

        let {
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = { status: { $in: [1, 2] }, memberType: 1, cookType: 2 };
        if (id) dbQuery._id = id;

        let totalData = await Cook.find(dbQuery);
        let data = await Cook.aggregate([
            {
                $match: {
                    status: { $in: [1, 2] }, memberType: 1, cookType: 2
                }
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'cookId',
                    as: 'transactions'
                }
            },
            {
                $unwind: {
                    path: '$transactions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: {
                    userPlan: -1,
                    createdAt: -1,
                    'transactions.transactionEndDateTime': -1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    data: { $mergeObjects: '$$ROOT' },
                    latestTransaction: {
                        $first: {
                            _id: '$transactions._id',
                            id: '$transactions._id',
                            transactionNo: '$transactions.transactionNo',
                            planName: '$transactions.planName',
                            transactionStartDateTime: '$transactions.transactionStartDateTime',
                            transactionEndDateTime: '$transactions.transactionEndDateTime',
                            invoiceUrl: '$transactions.invoiceUrl',
                            invoiceNo: '$transactions.invoiceNo',
                            paymentStatus: '$transactions.paymentStatus',
                            transactionStatus: '$transactions.transactionStatus'

                        }
                    }
                }
            },
            {
                $sort: {
                    'data.userPlan': -1,
                    'data.createdAt': -1
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            '$data',
                            {
                                transactions: '$latestTransaction'
                            }
                        ]
                    }
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);
        res.status(200).send(responseJson(1, 1, data, 'Chefs fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Chefs fetching failed', e))

    }
}

exports.getPartyCooksList = async (req, res) => {
    try {

        let {
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = { status: { $in: [1, 2] }, memberType: 1, partyCook: 1 };
        if (id) dbQuery._id = id;

        let data = await Cook.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await Cook.find(dbQuery);
        res.status(200).send(responseJson(1, 1, data, 'Party cooks fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Party cooks fetching failed', e))

    }
}

exports.getCateringsList = async (req, res) => {
    try {

        let {
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = { status: { $in: [1, 2] }, memberType: 2 };
        if (id) dbQuery._id = id;

        let data = await Cook.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await Cook.find(dbQuery);
        res.status(200).send(responseJson(1, 1, data, 'Caterings fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Caterings fetching failed', e))

    }
}

exports.getClientsList = async (req, res) => {
    try {

        let {
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = { status: { $in: [1, 2] }, memberType: 1 };
        if (id) dbQuery._id = id;

        // let data = await Employer.find(dbQuery).sort({ userPlan: -1, createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await Employer.find(dbQuery);
        let data = await Employer.aggregate([
            {
                $match: {
                    status: { $in: [1, 2] }, memberType: 1
                }
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'employerId',
                    as: 'transactions'
                }
            },
            {
                $unwind: {
                    path: '$transactions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: {
                    userPlan: -1,
                    createdAt: -1,
                    'transactions.transactionEndDateTime': -1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    data: { $mergeObjects: '$$ROOT' },
                    latestTransaction: {
                        $first: {
                            _id: '$transactions._id',
                            id: '$transactions._id',
                            transactionNo: '$transactions.transactionNo',
                            planName: '$transactions.planName',
                            transactionStartDateTime: '$transactions.transactionStartDateTime',
                            transactionEndDateTime: '$transactions.transactionEndDateTime',
                            invoiceUrl: '$transactions.invoiceUrl',
                            invoiceNo: '$transactions.invoiceNo',
                            paymentStatus: '$transactions.paymentStatus',
                            transactionStatus: '$transactions.transactionStatus'
                        }
                    }
                }
            },
            {
                $sort: {
                    'data.userPlan': -1,
                    'data.createdAt': -1
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            '$data',
                            {
                                transactions: '$latestTransaction'
                            }
                        ]
                    }
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);
        res.status(200).send(responseJson(1, 1, data, 'Clients fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Clients fetching failed', e))
    }
}

exports.getEmployersList = async (req, res) => {
    try {

        let {
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = { status: { $in: [1, 2] }, memberType: 2 };
        if (id) dbQuery._id = id;

        // let data = await Employer.find(dbQuery).sort({ userPlan: -1, createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await Employer.find(dbQuery);
        let data = await Employer.aggregate([
            {
                $match: {
                    status: { $in: [1, 2] }, memberType: 2
                }
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'employerId',
                    as: 'transactions'
                }
            },
            {
                $unwind: {
                    path: '$transactions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: {
                    userPlan: -1,
                    createdAt: -1,
                    'transactions.transactionEndDateTime': -1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    data: { $mergeObjects: '$$ROOT' },
                    latestTransaction: {
                        $first: {
                            _id: '$transactions._id',
                            id: '$transactions._id',
                            transactionNo: '$transactions.transactionNo',
                            planName: '$transactions.planName',
                            transactionStartDateTime: '$transactions.transactionStartDateTime',
                            transactionEndDateTime: '$transactions.transactionEndDateTime',
                            invoiceUrl: '$transactions.invoiceUrl',
                            invoiceNo: '$transactions.invoiceNo',
                            paymentStatus: '$transactions.paymentStatus',
                            transactionStatus: '$transactions.transactionStatus'
                        }
                    }
                }
            },
            {
                $sort: {
                    'data.userPlan': -1,
                    'data.createdAt': -1
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            '$data',
                            {
                                transactions: '$latestTransaction'
                            }
                        ]
                    }
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);
        res.status(200).send(responseJson(1, 1, data, 'Employers fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Employers fetching failed', e))
    }
}

exports.editCook = async (req, res) => {
    try {
        let {
            id,
            fullName,
            addressLine1,
            addressLine2,
            cityName,
            cityCode,
            pincode,
            landmark,
            gender,
            provinceName,
            provinceCode,
            dp,
            dob,
            languages,
            qualification,
            about,
            area,
            areaCoordinates,
            cityCoordinates,
            smsContact, whatsappContact, emailContact
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        let data = await Cook.findOne({ _id: id })
        if (!data) throw { statusCode: 404, responseCode: 0, msg: "No profile found" }

        let updateBody = { updatedAt: getCurrentDateAndTime(), basicProfileStatus: 1 };
        if (fullName) {
            const checkName = isValidName(fullName, data.memberType);
            if (checkName == false) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid name" }
            updateBody.fullName = fullName;
        }
        if (addressLine1 !== null && addressLine1 !== undefined) updateBody.addressLine1 = addressLine1;
        if (addressLine2 !== null && addressLine2 !== undefined) updateBody.addressLine2 = addressLine2;
        if (dp !== null && dp !== undefined) updateBody.dp = dp;
        if (cityName !== null && cityName !== undefined) updateBody.cityName = cityName;
        if (pincode !== null && pincode !== undefined) updateBody.pincode = pincode;
        if (landmark !== null && landmark !== undefined) updateBody.landmark = landmark;
        if (about !== null && about !== undefined) updateBody.about = about;
        if (area !== null && area !== undefined) updateBody.area = area;
        if (areaCoordinates) updateBody.areaCoordinates = areaCoordinates;
        if (cityCoordinates) updateBody.cityCoordinates = cityCoordinates;
        if (provinceName) {
            await isValidProvince(provinceName)
            updateBody.provinceName = provinceName;
        }
        if (languages && languages.length) {
            await isValidLanguage(languages);
            updateBody.languages = languages;
        }
        if (smsContact !== null && smsContact !== undefined) updateBody.smsContact = smsContact;
        if (whatsappContact !== null && whatsappContact !== undefined) updateBody.whatsappContact = whatsappContact;
        if (emailContact !== null && emailContact !== undefined) updateBody.emailContact = emailContact;


        if (data.memberType == 2) {
        }

        else if (data.memberType == 1) {
            if (gender) updateBody.gender = gender;
            if (qualification) {
                await isValidQualification(qualification);
                updateBody.qualification = qualification;
            }
            if (qualification !== null && qualification !== undefined) updateBody.qualification = qualification;
            if (dob) updateBody.dob = isValidDate(dob);
            if (dob == "") updateBody.dob = null;
        }

        data = await Cook.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No account found.Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));
        res.status(200).send(responseJson(1, 1, data, 'Profile updated successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updation failed', e))
    }
}

exports.editEmployer = async (req, res) => {
    try {
        let {
            id,
            propertyType,
            fullName,
            fssai,
            addressLine1,
            addressLine2,
            cityName,
            cityCode,
            pincode,
            landmark,
            gender,
            provinceName,
            provinceCode,
            dp,
            contactPerson,
            contactPersonMobile,
            dob,
            languages,
            employeesCount,
            establishmentYear,
            website,
            area,
            occupation,
            areaCoordinates,
            cityCoordinates, smsContact, emailContact, whatsappContact
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        let data = await Employer.findOne({ _id: id })
        if (!data) throw { statusCode: 404, responseCode: 0, msg: "No profile found" }

        let updateBody = { updatedAt: getCurrentDateAndTime(), basicProfileStatus: 1 };
        if (fullName) {
            const checkName = isValidName(fullName, data.memberType);
            if (checkName == false) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid name" }
            updateBody.fullName = fullName;
        }
        if (addressLine1 !== undefined && addressLine1 !== null) updateBody.addressLine1 = addressLine1;
        if (addressLine2 !== undefined && addressLine2 !== null) updateBody.addressLine2 = addressLine2;
        if (cityName !== undefined && cityName !== null) updateBody.cityName = cityName;
        if (cityCoordinates) updateBody.cityCoordinates = cityCoordinates;
        if (provinceName) { await isValidProvince(provinceName); updateBody.provinceName = provinceName }
        if (dp !== undefined && dp !== null) updateBody.dp = dp;
        if (smsContact == 0 || smsContact == 1) updateBody.smsContact = smsContact;
        if (whatsappContact == 0 || whatsappContact == 1) updateBody.whatsappContact = whatsappContact;
        if (emailContact == 0 || emailContact == 1) updateBody.emailContact = emailContact;

        if (data.memberType == 2) {
            if (propertyType !== null && propertyType !== undefined) updateBody.propertyType = propertyType;
            if (contactPerson !== null && contactPerson !== undefined) updateBody.contactPerson = contactPerson;
            if (contactPersonMobile !== null && contactPersonMobile !== undefined) updateBody.contactPersonMobile = contactPersonMobile;
            if (fssai !== null && fssai !== undefined) updateBody.fssai = fssai;
            if (website !== null && website !== undefined) updateBody.website = website;
            if (establishmentYear !== null && establishmentYear !== undefined) updateBody.establishmentYear = establishmentYear;
            if (employeesCount !== null && employeesCount !== undefined) updateBody.employeesCount = employeesCount;
        }

        else if (data.memberType == 1) {
            if (dob) updateBody.dob = isValidDate(dob);
            if (dob !== undefined && dob !== null) updateBody.dob = dob;
            if (gender) updateBody.gender = gender;
            if (pincode !== null && pincode !== undefined) updateBody.pincode = pincode;
            if (landmark !== null && landmark !== undefined) updateBody.landmark = landmark;
            if (area !== null && area !== undefined) updateBody.area = area;
            if (areaCoordinates) updateBody.areaCoordinates = areaCoordinates;
            if (occupation !== null && occupation !== undefined) updateBody.occupation = occupation;
            if (languages) {
                if (languages.length) await isValidLanguage(languages), updateBody.languages = languages;
                else if (!languages.length) updateBody.languages = languages;
            }
        }

        data = await Employer.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No account found. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        if (data.memberType == 1) {
            requirementsData = await ClientRequirement.findOne({ clientId: id, isDeleted: false });
            data = { ...data, ...requirementsData }
        }
        let profilePercent = getEmployerProfilePercent(data);
        data = await Employer.findOneAndUpdate({ _id: id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        res.status(200).send(responseJson(1, 1, data, 'Profile updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updated failed', e))
    }
}


exports.getEmployersDetails = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Employer.findOne({ _id: id, status: { $nin: [0] } });
        if (!data) throw { statusCode: 404, reponseCode: 5, msg: "No account found. Try again" }
        data = JSON.parse(JSON.stringify(data));
        if (data.memberType == 1) {
            let [freePointsData, transactionsData, requirementsData] = await Promise.all([
                ClientPoints.find({ clientId: id, planType: 'free' }),
                Transaction.find({ employerId: id, isDeleted: false, transactionStatus: 1 }).sort({ createdAt: -1 }).populate([{ path: "clientPointsId" }, { path: "clientPlanId" }]),
                ClientRequirement.find({ clientId: id, isDeleted: false }).sort({ createdAt: -1 })
            ])
            if (transactionsData.length) {
                transactionsData = JSON.parse(JSON.stringify(transactionsData));
                transactionsData = transactionsData.map((x) => {
                    x.status = (isDateExpired(x.transactionEndDateTime)) ? 0 : 1;
                    return x;
                })
            }
            data.freePointsData = freePointsData;
            data.transactionsData = transactionsData;
            data.requirementsData = requirementsData;
        }
        else if (data.memberType == 2) {
            let transactionsData = await EmployerPoints.find({ isDeleted: false, employerId: id }).populate([
                { path: "planTransactionId" },
                { path: "assistanceTransactionId" }
            ]).sort({ createdAt: -1 });
            if (transactionsData.length) {
                transactionsData = JSON.parse(JSON.stringify(transactionsData));
                transactionsData = transactionsData.map((x) => {
                    x.status = (isDateExpired(x.planExpiresAt)) ? 0 : 1;
                    return x;
                })
            }
            data.transactionsData = transactionsData;
        }

        let ratingsData = await EmployerRatings.find({ employerId: id }).select({ _id: 0, createdAt: 0, updatedAt: 0, cookId: 0, employerId: 0 });
        ratingsData = JSON.parse(JSON.stringify(ratingsData));
        data.ratingsData = calculateEmployerRatingAverages(ratingsData);
        data.ratingsList = await EmployerRatings.find({ employerId: id }).populate([{ path: 'cookId', select: 'fullName dp' }]).sort({ createdAt: -1 });

        res.status(200).send(responseJson(1, 1, data, 'Employer details fetched successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Employers details fetching failed', e))
    }
}

exports.getCookDetails = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Cook.findOne({ _id: id, status: { $nin: [0] } });
        if (!data) throw { statusCode: 404, reponseCode: 5, msg: "No account found. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        if (data.memberType == 1 && data.cookType == 2) {
            let transactionsData = await Transaction.find({ isDeleted: false, cookId: id, paymentStatus: 1 }).sort({ createdAt: -1 }).populate([{ path: "cookPlanId" }, { path: "cookPointsId" }]);
            if (transactionsData.length) {
                transactionsData = JSON.parse(JSON.stringify(transactionsData));
                transactionsData = transactionsData.map((x) => {
                    x.status = (isDateExpired(x.transactionEndDateTime)) ? 0 : 1;
                    return x;
                })
            }
            data.transactionsData = transactionsData;
        }
        let ratingsData = await CookRatings.find({ cookId: id }).select({ _id: 0, createdAt: 0, updatedAt: 0, cookId: 0, employerId: 0 });
        ratingsData = JSON.parse(JSON.stringify(ratingsData));
        data.ratingsData = calculateCookAverages(ratingsData);
        data.ratingsList = await CookRatings.find({ cookId: id }).populate([{ path: 'employerId', select: 'fullName dp' }]).sort({ createdAt: -1 });

        res.status(200).send(responseJson(1, 1, data, 'Cook details fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cook details fetching failed', e))
    }
}

exports.getJobsListTest = async (req, res) => {
    try {

        let {
            limit, page, skip,
            expired, active,
            minimumSalary, maximumSalary,
            location, cuisines,
            id
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        console.log({ ...req.query })

        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        let dbQuery = { isDeleted: false };
        if (id) dbQuery._id = id;
        if (active == 1) dbQuery.expiryDate = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbQuery.expiryDate = { $lte: getCurrentDateAndTime() }
        if (minimumSalary != undefined && minimumSalary != null && maximumSalary != undefined && maximumSalary != null) dbQuery.salary = { $gte: minimumSalary, $lte: maximumSalary }
        if (location) dbQuery.$or = [{ location: { $regex: new RegExp(location, "i") } }]
        if (cuisines && cuisines.length) dbQuery.cuisines = { $in: cuisines };

        let data = await Jobs.find(dbQuery).populate([
            { path: 'employerId', select: 'fullName email mobile propertyType addressLine1 addressLine2 cityName pincode provinceName ' }
        ]).sort({ createdAt: -1 }).limit(limit).skip(skip);

        let totalData = await Jobs.find(dbQuery).populate([
            { path: 'employerId', select: 'fullName email mobile propertyType addressLine1 addressLine2 cityName pincode provinceName ' }
        ]).countDocuments();

        if (data.length) {
            data = JSON.parse(JSON.stringify(data));
            data = data.map((x) => {
                if (x.expiryDate && x.status != 2) {
                    x.status = (new Date(getCurrentDateAndTime()) < new Date(x.expiryDate) ? 1 : 0);
                }
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, data, 'Jobs fetched successfully', {}, data.length, totalData))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Jobs fetching failed', e))
    }
}

exports.getJobsList = async (req, res) => {
    try {

        let {
            limit, page, skip,
            expired, active, disabled,
            minimumSalary, maximumSalary,
            latitude, longitude, cuisines,
            id, nameEmailOrMobile
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)
        minimumSalary = +minimumSalary;
        maximumSalary = +maximumSalary;
        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        let jobFilters = { isDeleted: false };
        if (id) jobFilters._id = mongoose.Types.ObjectId(id);
        if (active == 1) jobFilters.expiryDate = { $gte: getCurrentDateAndTime() }
        if (expired == 1) jobFilters.expiryDate = { $lte: getCurrentDateAndTime() }
        if (disabled == 1) jobFilters.status = 2;
        if (minimumSalary >= 0 && maximumSalary > 0) jobFilters.salary = { $gte: minimumSalary, $lte: maximumSalary }
        if (cuisines && cuisines.length) jobFilters.cuisines = { $in: cuisines };

        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 500 * 1000;  //500 KM RADIUS
        let sortFilters = {}

        let aggregateQuery = [];

        if (latitude && longitude) {
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
                $match: jobFilters
            },
        )

        aggregateQuery.push(
            {
                $lookup: {
                    from: "employers",
                    localField: "employerId",
                    foreignField: "_id",
                    as: "employerData"
                }
            },
            {
                $unwind: "$employerData"
            },
        )


        if (nameEmailOrMobile) {
            let employerFilters = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") employerFilters.push({ "employerData.email": { $regex: nameEmailOrMobile, $options: "i" } }, { "employerData.fullName": { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") employerFilters.push({ "employerData.mobile": parseInt(nameEmailOrMobile) });

            aggregateQuery.push(
                {
                    $match: {
                        $or: employerFilters
                    }
                },
            )
        }


        if (!latitude || !longitude) {
            sortFilters = {
                createdAt: -1
            }
        }

        else if (latitude && longitude) {
            sortFilters = {
                distanceInMeters: 1,
                createdAt: -1
            }
        }

        if (cuisines && cuisines.length) {
            aggregateQuery.push(
                {
                    $addFields: {
                        matchingCuisines: {
                            $size: {
                                $setIntersection: ["$cuisines", cuisines]
                            }
                        }
                    }
                },
            );

            let cuisinesSorting = { matchingCuisines: -1 }
            if (latitude && longitude) cuisinesSorting.distanceInMeters = 1;
            cuisinesSorting.createdAt = -1;
            sortFilters = cuisinesSorting;

        }
        console.log({ sortFilters })
        aggregateQuery.push(
            {
                $sort: sortFilters
            },
            {
                $facet: {
                    paginatedData: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $replaceRoot: { newRoot: "$$ROOT" }
                        }
                    ],
                    totalCount: [
                        { $count: "total" }
                    ]
                }
            })

        //Executing the total Query
        let data = await Jobs.aggregate(aggregateQuery);
        let totalCount = data[0].totalCount.length > 0 ? data[0].totalCount[0].total : 0;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length) {
            paginatedData = JSON.parse(JSON.stringify(paginatedData));
            paginatedData = paginatedData.map((x) => {
                if (x.expiryDate && x.status != 2) x.status = (new Date(getCurrentDateAndTime()) < new Date(x.expiryDate) ? 1 : 0);
                if (latitude && longitude) {
                    x.distanceInMeters = Math.round(x.distanceInMeters);
                    x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                }
                return x;
            })
        }

        res.status(200).send(responseJson(1, 1, paginatedData, 'Jobs fetched successfully', {}, paginatedData.length, totalCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Jobs fetching failed', e))
    }
}

exports.getJobDetails = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Jobs.find({ _id: id, isDeleted: false }).populate([
            { path: 'employerId', select: 'fullName email mobile propertyType addressLine1 addressLine2 cityName pincode provinceName dp' }
        ]);
        if (!data) throw { statusCode: 404, reponseCode: 5, msg: "No job found. Try again!" }

        res.status(200).send(responseJson(1, 1, data, 'Job details fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job details fetching failed', e))
    }
}

exports.getEventsListTest = async (req, res) => {
    try {

        let {
            limit, page, skip, id, active, expired,
            cuisines, latitude, longitude
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        let dbQuery = { isDeleted: false };
        if (id) dbQuery._id = id;
        if (active == 1) dbQuery.eventDate = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbQuery.eventDate = { $lte: getCurrentDateAndTime() }
        if (cuisines && cuisines.length) dbQuery.cuisines = { $in: cuisines };

        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 500 * 1000;  //500 KM RADIUS
        let sortFilters = {}

        let data = await Events.find(dbQuery).populate([
            { path: 'clientId', select: 'fullName email mobile addressLine1 addressLine2 cityName pincode provinceName' }
        ]).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await Events.find(dbQuery).populate([
            { path: 'clientId', select: 'fullName email mobile addressLine1 addressLine2 cityName pincode provinceName' }
        ]).countDocuments();

        if (data.length) {
            data = JSON.parse(JSON.stringify(data));
            data = data.map((x) => {
                if (x.eventDate && x.status != 2) {
                    x.status = (new Date(getCurrentDateAndTime()) < new Date(x.eventDate) ? 1 : 0);
                }
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, data, 'Events fetched successfully', {}, data.length, totalData))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Events fetching failed', e))
    }
}

exports.getEventsList = async (req, res) => {
    try {

        let {
            limit, page, skip, id, active, expired, disabled,
            cuisines, latitude, longitude, nameEmailOrMobile
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)
        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        let dbQueryFilters = { isDeleted: false };
        if (id) dbQueryFilters._id = mongoose.Types.ObjectId(id);
        if (active == 1) dbQueryFilters.eventDate = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbQueryFilters.eventDate = { $lte: getCurrentDateAndTime() }
        if (disabled == 1) dbQueryFilters.status = 2;
        if (cuisines && cuisines.length) dbQueryFilters.cuisines = { $in: cuisines };

        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 200 * 1000;  //200 KM RADIUS
        let sortFilters = {}

        let aggregateQuery = [];

        if (latitude && longitude) {
            aggregateQuery.push({
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distanceInMeters',
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    key: 'cityCoordinates'
                }
            },)
        }

        aggregateQuery.push(
            {
                $match: dbQueryFilters
            },
        )

        aggregateQuery.push(
            {
                $lookup: {
                    from: "employers",
                    localField: "clientId",
                    foreignField: "_id",
                    as: "clientId"
                }
            },
            {
                $unwind: "$clientId"
            },
        )


        if (nameEmailOrMobile) {
            let employerFilters = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") employerFilters.push({ "clientId.email": { $regex: nameEmailOrMobile, $options: "i" } }, { "clientId.fullName": { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") employerFilters.push({ "clientId.mobile": parseInt(nameEmailOrMobile) });

            aggregateQuery.push(
                {
                    $match: {
                        $or: employerFilters
                    }
                },
            )
        }

        if (!latitude || !longitude) {
            sortFilters = {
                createdAt: -1
            }
        }

        else if (latitude && longitude) {
            sortFilters = {
                distanceInMeters: 1,
                createdAt: -1
            }
        }

        if (cuisines && cuisines.length) {

            aggregateQuery.push(
                {
                    $addFields: {
                        matchingCuisines: {
                            $size: {
                                $setIntersection: ["$cuisines", cuisines]
                            }
                        }
                    }
                },
            );

            let cuisinesSorting = { matchingCuisines: -1 }
            if (latitude && longitude) cuisinesSorting.distanceInMeters = 1;
            cuisinesSorting.createdAt = -1;
            sortFilters = cuisinesSorting;
        }

        aggregateQuery.push(
            {
                $sort: sortFilters
            },
            {
                $facet: {
                    paginatedData: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $replaceRoot: { newRoot: "$$ROOT" }
                        }
                    ],
                    totalCount: [
                        { $count: "total" }
                    ]
                }
            })

        //Executing the total Query
        let data = await Events.aggregate(aggregateQuery);
        let totalCount = data[0].totalCount.length > 0 ? data[0].totalCount[0].total : 0;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length) {
            paginatedData = JSON.parse(JSON.stringify(paginatedData));
            paginatedData = paginatedData.map((x) => {
                if (x.expiryDate && x.status != 2) x.status = (new Date(getCurrentDateAndTime()) < new Date(x.expiryDate) ? 1 : 0);
                if (latitude && longitude) {
                    x.distanceInMeters = Math.round(x.distanceInMeters);
                    x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                }
                return x;
            })
        }

        res.status(200).send(responseJson(1, 1, paginatedData, 'Events fetched successfully', {}, paginatedData.length, totalCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Events fetching failed', e))
    }
}

exports.getEventDetails = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Events.find({ _id: id, isDeleted: false }).populate([
            { path: 'clientId', select: 'fullName email mobile addressLine1 addressLine2 cityName pincode provinceName dp' }
        ])
        if (!data) throw { statusCode: 404, reponseCode: 5, msg: "No event found. Try again!" }

        res.status(200).send(responseJson(1, 1, data, 'Event details fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Event details fetching failed', e))
    }
}

exports.getPaymentsList = async (req, res) => {
    try {

        let {
            limit, page, skip, id, active, expired, status,
            startDate,
            endDate, transactionBy
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = { isDeleted: false };
        if (transactionBy) dbQuery.transactionBy = transactionBy;
        if (startDate && endDate) dbQuery.createdAt = { $gte: `${startDate}T00:00:00.000Z`, $lt: `${endDate}T23:59:59.999Z` };
        if (status == 0) dbQuery.transactionStatus = 0, dbQuery.paymentStatus = 0;
        if (status == 1) dbQuery.transactionStatus = 1, dbQuery.paymentStatus = 1;
        if (id) dbQuery._id = id;
        if (active == 1) dbQuery.transactionEndDateTime = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbQuery.transactionEndDateTime = { $lte: getCurrentDateAndTime() }

        let data = await Transaction.find(dbQuery).populate([
            { path: 'employerId', select: 'fullName memberType email mobile addressLine1 addressLine2 cityName pincode provinceName' },
            { path: 'cookId', select: 'fullName memberType cookType partyCook mobile addressLine1 addressLine2 cityName pincode provinceName' }
        ]).sort({ createdAt: -1 }).limit(limit).skip(skip);

        let totalData = await Transaction.find(dbQuery).populate([
            { path: 'employerId', select: 'fullName memberType email mobile addressLine1 addressLine2 cityName pincode provinceName' },
            { path: 'cookId', select: 'fullName memberType cookType partyCook mobile addressLine1 addressLine2 cityName pincode provinceName' }
        ]).countDocuments()

        res.status(200).send(responseJson(1, 1, data, 'Payments fetched successfully', {}, data.length, totalData))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payments fetching failed', e))
    }
}

exports.getPaymentDetails = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Transaction.find({ _id: id, isDeleted: false }).populate([
            { path: 'employerId', select: 'fullName memberType email mobile addressLine1 addressLine2 cityName pincode provinceName' },
            { path: 'cookId', select: 'fullName memberType cookType partyCook mobile addressLine1 addressLine2 cityName pincode provinceName' }
        ])
        if (!data) throw { statusCode: 404, reponseCode: 5, msg: "No data found. Try again!" }

        res.status(200).send(responseJson(1, 1, data, 'Payment details fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment details fetching failed', e))
    }
}

exports.resetPassword = async (req, res) => {
    try {
        let {
            id,
            type,
            modelName
        } = Object.assign(req.body)

        const requiredFields = {
            id,
            type
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        if (type !== "cook" && type !== "employer") throw { statusCode: 400, responseCode: 2, msg: 'Please provide valid type' }

        modelName = (type == "cook") ? Cook : Employer;
        let data = await modelName.findOne({ _id: id });
        if (!data) throw { statusCode: 404, responseCode: 2, msg: 'No data found' }

        await modelName.findOneAndUpdate({ _id: id }, {
            $set: {
                updatedAt: getCurrentDateAndTime(),
                passwordUpdateDateTime: getCurrentDateAndTime(),
                password: bcrypt.hashSync("Login1234", 8)
            }
        })
        res.status(200).send(responseJson(1, 1, {}, 'Password reset successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Password reset failed', e))
    }
}


exports.edithouseCookProfile = async (req, res) => {
    try {

        let {
            householdVesselWash,
            householdCuisines,
            payment,
            jobType,
            id
        } = Object.assign(req.body, req.query, req.params)

        let data = await Cook.findOne({ _id: id, status: { $nin: [0] } })
        if (!data) throw { statusCode: 404, responseCode: 2, msg: "No profile found. Try again!" }
        if (data && data.status == 2) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently disabled." }
        if (data && data.status == 3) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently suspended." }
        if (data && data.status == 4) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. Profile has been requested for deletion." }

        let updateBody = {
            houseCookProfileStatus: 1,
            updatedAt: getCurrentDateAndTime()
        };
        if (householdVesselWash !== undefined && householdVesselWash !== null) updateBody.householdVesselWash = householdVesselWash;
        if (payment !== undefined && payment !== null) updateBody.payment = payment;
        if (jobType !== undefined && jobType !== null) updateBody.jobType = jobType;

        //Validating_Cuisines
        if (householdCuisines && householdCuisines.length) {
            await isValidCuisine(householdCuisines);
            updateBody.householdCuisines = householdCuisines;
        }

        data = await Cook.findOneAndUpdate({ _id: id }, {
            $set: updateBody
        }, { new: true })
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No profile found.Try again" }

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: id,
            householdVesselWash,
            householdCuisines,
            payment,
            jobType
        }, 'Profile updated successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updation failed', e))
    }
}

exports.editCateringProfile = async (req, res) => {
    try {

        let {
            cateringMinPlates,
            cateringCuisines,
            cateringFoodType,
            fssai,
            teamSize,
            website,
            id
        } = Object.assign(req.body, req.query, req.params)

        let data = await Cook.findOne({ _id: id, status: { $nin: [0] } })
        if (!data) throw { statusCode: 404, responseCode: 2, msg: "No profile found. Try again!" }
        if (data && data.status == 2) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently disabled." }
        if (data && data.status == 3) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently suspended." }
        if (data && data.status == 4) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. Profile has been requested for deletion." }

        const updateBody = {
            cateringProfileStatus: 1,
            updatedAt: getCurrentDateAndTime()
        }        //Validating_Cuisines
        if (cateringCuisines && cateringCuisines.length) {
            await isValidCuisine(cateringCuisines);
            updateBody.cateringCuisines = cateringCuisines;
        }
        if (cateringMinPlates) await isValidCateringPlates(cateringMinPlates), updateBody.cateringMinPlates = cateringMinPlates;
        if (cateringFoodType !== null && cateringFoodType !== undefined) updateBody.cateringFoodType = cateringFoodType;
        if (fssai !== null && fssai == undefined) updateBody.fssai = fssai;
        if (teamSize !== null && teamSize !== undefined) updateBody.teamSize = teamSize;
        if (website !== null && website !== undefined) updateBody.website = website;

        data = await Cook.findOneAndUpdate({ _id: id }, {
            $set: updateBody
        }, { new: true })
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No profile found. Try again" }

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id,
            cateringMinPlates,
            cateringCuisines,
            cateringFoodType,
            fssai, website, teamSize
        }, 'Profile updated successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updation failed', e))
    }
}

exports.editChefProfile = async (req, res) => {
    try {
        let {
            jobSeeking,
            chefCuisines,
            skills,
            chefExperience,
            currentSalary,
            expectedSalary,
            currentCompany,
            currentCityName,
            relocate,
            currentCityCoordinates,
            resume,
            id
        } = Object.assign(req.body, req.query, req.params)

        let data = await Cook.findOne({ _id: id, status: { $nin: [0] } })
        if (!data) throw { statusCode: 404, responseCode: 2, msg: "No profile found." }
        if (data && data.status == 2) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently disabled." }
        if (data && data.status == 3) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently suspended." }
        if (data && data.status == 4) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. Profile has been requested for deletion." }


        let updateBody = {
            chefProfileStatus: 1,
            updatedAt: getCurrentDateAndTime()
        }

        if (chefCuisines && chefCuisines.length) {
            await isValidCuisine(chefCuisines);
            updateBody.chefCuisines = chefCuisines;
        }
        if (resume !== undefined && resume !== null) updateBody.resume = resume;
        if (skills !== undefined && skills !== null) updateBody.skills = skills;
        if (currentCompany !== undefined && currentCompany !== null) updateBody.currentCompany = currentCompany;
        if (jobSeeking !== undefined && jobSeeking !== null) updateBody.jobSeeking = jobSeeking;
        if (chefExperience !== undefined && chefExperience !== null) updateBody.chefExperience = chefExperience;
        if (currentSalary !== undefined && currentSalary !== null) updateBody.currentSalary = currentSalary
        if (expectedSalary !== undefined && expectedSalary !== null) updateBody.expectedSalary = expectedSalary;
        if (currentCityName !== undefined && currentCityName !== null) updateBody.currentCityName = currentCityName;
        if (relocate !== undefined && relocate !== null) updateBody.relocate = relocate;
        if (currentCompany !== undefined && currentCompany !== null) updateBody.currentCompany = currentCompany; if (resume) updateBody.resume = resume;
        if (currentCityCoordinates !== undefined && currentCityCoordinates !== null) updateBody.currentCityCoordinates = currentCityCoordinates;

        data = await Cook.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No profile found. Try again" }

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id,
            jobSeeking,
            chefCuisines,
            skills,
            chefExperience,
            currentSalary,
            expectedSalary,
            currentCompany,
            currentCityName,
            relocate,
            currentCityCoordinates,
            resume
        }, 'Profile updated successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updation failed', e))
    }
}

exports.editPartycookProfile = async (req, res) => {
    try {
        let {
            partyCuisines,
            partyExperience,
            speciality,
            partyMaxPlates,
            partyCookAvailability,
            partyCookFoodType,
            partyCookVesselWash,
            id
        } = Object.assign(req.body, req.query, req.params)

        let data = await Cook.findOne({ _id: id, status: { $nin: [0] } })
        if (!data) throw { statusCode: 404, responseCode: 2, msg: "No data found" }
        if (data && data.status == 2) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently disabled." }
        if (data && data.status == 3) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. The Profile is currently suspended." }
        if (data && data.status == 4) throw { statusCode: 403, responseCode: 2, msg: "Profile update failed. Profile has been requested for deletion." }

        let updateBody = {
            partyCookProfileStatus: 1,
            updatedAt: getCurrentDateAndTime()
        }
        if (partyCuisines && partyCuisines.length) {
            await isValidCuisine(partyCuisines);
            updateBody.partyCuisines = partyCuisines;
        }

        if (partyExperience !== null && partyExperience !== undefined) updateBody.partyExperience = partyExperience;
        if (partyCookAvailability !== null && partyCookAvailability !== undefined) updateBody.partyCookAvailability = partyCookAvailability;
        if (partyCookFoodType !== null && partyCookFoodType !== undefined) updateBody.partyCookFoodType = partyCookFoodType;
        if (partyCookVesselWash !== null && partyCookVesselWash !== undefined) updateBody.partyCookVesselWash = partyCookVesselWash;
        if (partyMaxPlates) await isValidPartyPlates(partyMaxPlates), updateBody.partyMaxPlates = partyMaxPlates;
        if (speciality !== null && speciality !== undefined) updateBody.speciality = speciality;

        data = await Cook.findOneAndUpdate({ _id: id }, {
            $set: updateBody
        }
            , { new: true })
        if (!data) throw { statusCode: 404, responseCode: 5, msg: "No profile found. Try again " }

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id,
            partyCuisines,
            partyExperience,
            speciality,
            partyMaxPlates,
            partyCookAvailability,
            partyCookFoodType,
            partyCookVesselWash
        }, 'Profile updated successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updation failed', e))
    }
}


exports.findChefs = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            minimumExperience, maximumExperience,
            minimumSalary, maximumSalary,
            cuisines, nameEmailOrMobile,
            gender, skills,
            cityLongitude, cityLatitude
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        cityLatitude = parseFloat(cityLatitude);
        cityLongitude = parseFloat(cityLongitude);
        minimumExperience = parseFloat(minimumExperience);
        maximumExperience = parseFloat(maximumExperience);
        minimumSalary = parseFloat(minimumSalary);
        maximumSalary = parseFloat(maximumSalary);
        gender = parseFloat(gender);
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilters = { memberType: 1, cookType: 2, status: { $ne: 0 } };
        const userLocation = (latitude && longitude) ? { type: 'Point', coordinates: [longitude, latitude] } : { type: 'Point', coordinates: [cityLongitude, cityLatitude] }
        const maxDistanceMeters = 500 * 1000;  //500 KM RADIUS

        //Filterings
        if (minimumSalary !== null && minimumSalary !== undefined && maximumSalary && maximumSalary != 100000) dbQueryFilters.expectedSalary = { $gte: minimumSalary, $lte: maximumSalary };
        if (minimumSalary !== null && minimumSalary !== undefined && maximumSalary && maximumSalary == 100000) dbQueryFilters.expectedSalary = { $gte: minimumSalary };

        if (minimumExperience && maximumExperience) dbQueryFilters.chefExperience = { $gte: minimumExperience, $lte: maximumExperience };
        if (cuisines) {
            dbQueryFilters.$or = [
                { chefCuisines: { $in: cuisines } },
                { skills: { $elemMatch: { $regex: new RegExp(cuisines, "i") } } }];
        }
        if (nameEmailOrMobile) {
            let filter = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") filter.push({ email: { $regex: nameEmailOrMobile, $options: "i" } }, { fullName: { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") filter.push({ mobile: parseInt(nameEmailOrMobile) });
            dbQueryFilters.$or = filter;
            delete dbQueryFilters.expectedSalary;
        }

        if (gender) dbQueryFilters.gender = gender;
        if (skills) {
            dbQueryFilters.$or = [
                { skills: { $elemMatch: { $regex: new RegExp(skills, "i") } } },
                { about: { $regex: new RegExp(skills, "i") } }];
        }

        let aggregateQuery = [];
        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        }
        if ((latitude && longitude) || (cityLatitude && cityLongitude)) {
            console.log("coming")
            aggregateQuery.push({
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distanceInMeters',
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    key: (latitude && longitude) ? "currentCityCoordinates" : "cityCoordinates"
                }
            },)
        }

        //remaining_pipelines
        aggregateQuery.push(
            {
                $match: dbQueryFilters
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'cookId',
                    as: 'transactions'
                }
            },
            {
                $unwind: {
                    path: '$transactions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: {
                    'transactions.createdAt': -1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    data: { $first: '$$ROOT' },
                    transactions: {
                        $push: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: ['$transactions.paymentStatus', 1] }
                                    ]
                                },
                                then: {
                                    _id: '$transactions._id',
                                    id: '$transactions._id',
                                    transactionNo: '$transactions.transactionNo',
                                    planName: '$transactions.planName',
                                    transactionStartDateTime: '$transactions.transactionStartDateTime',
                                    transactionEndDateTime: '$transactions.transactionEndDateTime',
                                    invoiceUrl: '$transactions.invoiceUrl',
                                    invoiceNo: '$transactions.invoiceNo',
                                    paymentStatus: '$transactions.paymentStatus',
                                    transactionStatus: '$transactions.transactionStatus'
                                },
                                else: '$REMOVE'
                            }
                        }
                    }
                }

            },
        )

        //Fetching the required items
        let projectQuery = {
            id: "$data._id",
            fullName: "$data.fullName",
            email: "$data.email",
            mobile: "$data.mobile",
            dp: "$data.dp",
            chefCuisines: "$data.chefCuisines",
            memberType: "$data.memberType",
            cookType: "$data.cookType",
            createdAt: "$data.createdAt",
            webAccess: "$data.webAccess",
            appAccess: "$data.appAccess",
            userPlan: "$data.userPlan",
            weavyId: "$data.weavyId",
            status: "$data.status",
            chefProfileStatus: "$data.chefProfileStatus",
            basicProfileStatus: "$data.basicProfileStatus",
            lastLoginDateTime: "$data.lastLoginDateTime",
            distanceInMeters: "$data.distanceInMeters",
            transactions: {
                $cond: {
                    if: { $eq: [{ $size: '$transactions' }, 0] },
                    then: {},
                    else: { $arrayElemAt: ['$transactions', 0] }
                }
            }
        };

        //Pushing to facet
        facetQuery.paginatedData.push({
            $project: projectQuery
        },)

        if ((latitude && longitude) || (cityLatitude && cityLongitude)) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    distanceInMeters: 1,
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    chefProfileStatus: -1,
                    userPlan: -1,
                }
            },)
        }
        else if ((!latitude || !longitude) && (!cityLatitude || !cityLongitude)) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    chefProfileStatus: -1,
                    userPlan: -1
                }
            },)
        }

        if (cuisines && cuisines.length) {

            let cuisinesSorting = { matchingCuisines: -1 }
            if ((latitude && longitude) || (cityLatitude && cityLongitude)) cuisinesSorting.distanceInMeters = 1;
            cuisinesSorting.lastLoginDateTime = -1;
            cuisinesSorting.profileBoostRank = -1;

            facetQuery.paginatedData.push({
                $sort: cuisinesSorting
            },)

            projectQuery.matchingCuisines = {
                $size: {
                    $setIntersection: ['$data.chefCuisines', cuisines],
                },
            }

        }

        //applying_pagination
        facetQuery.paginatedData.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        )

        //Combining in all Query
        aggregateQuery.push({
            $facet: facetQuery
        })

        let data = await Cook.aggregate(aggregateQuery);
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length && ((latitude && longitude) || (cityLatitude && cityLongitude))) {
            paginatedData = paginatedData.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, paginatedData, 'Chefs fetched successfully', {}, paginatedDataCount, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Chefs fetching failed', e))
    }
}

exports.findPartyCooks = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            gender,
            minimumSalary, maximumSalary, nameEmailOrMobile,
            cuisines,
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilters = { memberType: 1, partyCook: 1, status: { $ne: 0 } };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 100 * 1000;  //100 KM RADIUS

        //Filterings
        if (cuisines) dbQueryFilters.partyCuisines = { $in: cuisines }
        if (minimumSalary && maximumSalary) dbQueryFilters.expectedSalary = { $gte: minimumSalary, $lte: maximumSalary };
        if (nameEmailOrMobile) {
            let filter = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") filter.push({ email: { $regex: nameEmailOrMobile, $options: "i" } }, { fullName: { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") filter.push({ mobile: parseInt(nameEmailOrMobile) });
            dbQueryFilters.$or = filter;
        }

        let aggregateQuery = [];
        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        }
        if (latitude && longitude) {
            aggregateQuery.push(
                {
                    $geoNear: {
                        near: userLocation,
                        distanceField: 'distanceInMeters',
                        maxDistance: maxDistanceMeters,
                        spherical: true,
                        key: 'cityCoordinates'
                    }
                },
            )
        }

        //Applyong_Filters
        aggregateQuery.push(
            {
                $match: dbQueryFilters
            },
        )
        if (latitude && longitude) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    'distanceInMeters': 1,
                    'lastLoginDateTime': -1

                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    'lastLoginDateTime': -1
                }
            },)
        }

        if (cuisines && cuisines.length) {

            facetQuery.paginatedData.push(
                {
                    $addFields: {
                        matchingCuisines: {
                            $size: {
                                $setIntersection: ["$partyCuisines", cuisines]
                            }
                        }
                    }
                },
            );

            let cuisinesSorting = { matchingCuisines: -1 }
            if (latitude && longitude) cuisinesSorting.distanceInMeters = 1;
            cuisinesSorting.lastLoginDateTime = -1;

            facetQuery.paginatedData.push({
                $sort: cuisinesSorting
            },)

        }

        //applying_pagination
        facetQuery.paginatedData.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            })

        //Combining in all Query
        aggregateQuery.push({
            $facet: facetQuery
        })
        let data = await Cook.aggregate(aggregateQuery);
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length && latitude && longitude) {
            paginatedData = paginatedData.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, paginatedData, 'Party cooks fetched successfully', {}, paginatedDataCount, totalDataCount))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Party cooks fetch failed', e))
    }
}



exports.findCaterings = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            cuisines,
            nameEmailOrMobile
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        //Employer_Points_Validations
        // let employerPlanData = await checkClientValidPartyCateringPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points.Try subscription" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilter = { memberType: 2, status: { $ne: 0 } };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 500 * 1000;  //500 KM RADIUS

        //Filterings
        if (cuisines) dbQueryFilter.cateringCuisines = { $in: cuisines }
        if (nameEmailOrMobile) {
            let filter = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") filter.push({ email: { $regex: nameEmailOrMobile, $options: "i" } }, { fullName: { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") filter.push({ mobile: parseInt(nameEmailOrMobile) });
            dbQueryFilter.$or = filter;
        }
        let aggregateQuery = [];
        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        }
        if (latitude && longitude) {
            aggregateQuery.push(
                {
                    $geoNear: {
                        near: userLocation,
                        distanceField: 'distanceInMeters',
                        maxDistance: maxDistanceMeters,
                        spherical: true,
                        key: 'cityCoordinates'
                    }
                },
            )
        }

        //Applying_Filters
        aggregateQuery.push(
            {
                $match: dbQueryFilter
            },

        )
        if (latitude && longitude) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    'distanceInMeters': 1,
                    'lastLoginDateTime': -1

                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    'lastLoginDateTime': -1
                }
            },)
        }

        if (cuisines && cuisines.length) {

            facetQuery.paginatedData.push(
                {
                    $addFields: {
                        matchingCuisines: {
                            $size: {
                                $setIntersection: ["$cateringCuisines", cuisines]
                            }
                        }
                    }
                },
            );

            let cuisinesSorting = { matchingCuisines: -1 }
            if (latitude && longitude) cuisinesSorting.distanceInMeters = 1;
            cuisinesSorting.lastLoginDateTime = -1;

            facetQuery.paginatedData.push({
                $sort: cuisinesSorting
            },)

        }

        //applying_pagination
        facetQuery.paginatedData.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        )

        //Combining in all Query
        aggregateQuery.push({
            $facet: facetQuery
        })

        let data = await Cook.aggregate(aggregateQuery);
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length && latitude && longitude) {
            paginatedData = paginatedData.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, paginatedData, 'Caterings fetched successfully', {}, paginatedDataCount, totalDataCount))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Catering fetch failed', e))
    }
}


exports.findHouseCooks = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            payment, gender, jobType,
            cuisines,
            nameEmailOrMobile
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        jobType = parseFloat(jobType);
        gender = parseFloat(gender);

        //Employer_Points_Validations
        // let employerPlanData = await checkClientValidHouseCookPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points.Try subscription" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilter = { memberType: 1, cookType: 1, status: { $ne: 0 } };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 20 * 1000;  //25 KM RADIUS

        //Filterings
        if (jobType) dbQueryFilter.jobType = jobType;
        if (gender) dbQueryFilter.gender = gender;
        if (payment) dbQueryFilter.payment = payment;
        if (cuisines) dbQueryFilter.householdCuisines = { $in: cuisines }
        if (nameEmailOrMobile) {
            let filter = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") filter.push({ email: { $regex: nameEmailOrMobile, $options: "i" } }, { fullName: { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") filter.push({ mobile: parseInt(nameEmailOrMobile) });
            delete dbQueryFilter.payment;
            dbQueryFilter.$or = filter;
        }
        if (gender) dbQueryFilter.gender = gender;
        let aggregateQuery = [];
        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        }
        if (latitude && longitude) {
            aggregateQuery.push(
                {
                    $geoNear: {
                        near: userLocation,
                        distanceField: 'distanceInMeters',
                        maxDistance: maxDistanceMeters,
                        spherical: true,
                        key: 'areaCoordinates'
                    }
                },
            )
        }

        //Applying_Filters
        aggregateQuery.push(
            {
                $match: dbQueryFilter
            },
        );

        if (latitude && longitude) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    'distanceInMeters': 1,
                    'lastLoginDateTime': -1

                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    'lastLoginDateTime': -1
                }
            },)
        }

        if (cuisines && cuisines.length) {

            facetQuery.paginatedData.push(
                {
                    $addFields: {
                        matchingCuisines: {
                            $size: {
                                $setIntersection: ["$householdCuisines", cuisines]
                            }
                        }
                    }
                },
            );

            let cuisinesSorting = { matchingCuisines: -1 }
            if (latitude && longitude) cuisinesSorting.distanceInMeters = 1;
            cuisinesSorting.lastLoginDateTime = -1;

            facetQuery.paginatedData.push({
                $sort: cuisinesSorting
            },)

        }

        facetQuery.paginatedData.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        )

        //Combining in all Query
        aggregateQuery.push({
            $facet: facetQuery
        })


        let data = await Cook.aggregate(aggregateQuery);
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length && latitude && longitude) {
            paginatedData = paginatedData.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, paginatedData, 'House cooks fetched successfully', {}, paginatedDataCount, totalDataCount))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'House cooks fetching failed', e))
    }
}

exports.findClients = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            plans,
            nameEmailOrMobile
        } = Object.assign(req.body)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        plans = parseFloat(plans);

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilter = { memberType: 1, status: { $ne: 0 } };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 200 * 1000;  //0 KM RADIUS

        //Filterings
        if (plans == 0 || plans == 1) dbQueryFilter.userPlan = plans;
        if (nameEmailOrMobile) {
            let filter = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") filter.push({ email: { $regex: nameEmailOrMobile, $options: "i" } }, { fullName: { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") filter.push({ mobile: parseInt(nameEmailOrMobile) });
            dbQueryFilter.$or = filter;
        }
        let aggregateQuery = [];
        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        }
        if (latitude && longitude) {
            aggregateQuery.push(
                {
                    $geoNear: {
                        near: userLocation,
                        distanceField: 'distanceInMeters',
                        maxDistance: maxDistanceMeters,
                        spherical: true,
                        key: 'cityCoordinates'
                    }
                },
            )
        }

        //Applying_Filters
        aggregateQuery.push(
            {
                $match: dbQueryFilter
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'employerId',
                    as: 'transactions'
                }
            },
            {
                $unwind: {
                    path: '$transactions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: {
                    lastLoginDateTime: -1,
                    'transactions.createdAt': -1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    data: { $first: '$$ROOT' },
                    transactions: {
                        $push: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: ['$transactions.paymentStatus', 1] }
                                    ]
                                },
                                then: {
                                    _id: '$transactions._id',
                                    id: '$transactions._id',
                                    transactionNo: '$transactions.transactionNo',
                                    planName: '$transactions.planName',
                                    transactionStartDateTime: '$transactions.transactionStartDateTime',
                                    transactionEndDateTime: '$transactions.transactionEndDateTime',
                                    invoiceUrl: '$transactions.invoiceUrl',
                                    invoiceNo: '$transactions.invoiceNo',
                                    paymentStatus: '$transactions.paymentStatus',
                                    transactionStatus: '$transactions.transactionStatus'
                                },
                                else: '$REMOVE'
                            }
                        }
                    }
                }

            },)
        //Pushing to facet
        facetQuery.paginatedData.push({
            $project: {
                id: "$data._id",
                fullName: "$data.fullName",
                email: "$data.email",
                mobile: "$data.mobile",
                dp: "$data.dp",
                memberType: "$data.memberType",
                createdAt: "$data.createdAt",
                webAccess: "$data.webAccess",
                appAccess: "$data.appAccess",
                userPlan: "$data.userPlan",
                weavyId: "$data.weavyId",
                status: "$data.status",
                basicProfileStatus: "$data.basicProfileStatus",
                lastLoginDateTime: "$data.lastLoginDateTime",
                distanceInMeters: "$data.distanceInMeters",
                transactions: {
                    $cond: {
                        if: { $eq: [{ $size: '$transactions' }, 0] },
                        then: {},
                        else: { $arrayElemAt: ['$transactions', 0] }
                    }
                }
            }

        },)

        if (latitude && longitude) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    'distanceInMeters': 1,
                    'lastLoginDateTime': -1

                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    'lastLoginDateTime': -1
                }
            },)
        }

        //applying_pagination
        facetQuery.paginatedData.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        )

        //Combining in all Query
        aggregateQuery.push({
            $facet: facetQuery
        })

        let data = await Employer.aggregate(aggregateQuery);
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length && latitude && longitude) {
            paginatedData = paginatedData.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, paginatedData, 'Clients fetched successfully', {}, paginatedDataCount, totalDataCount))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Clients fetching failed', e))
    }
}

exports.findEmployers = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            plans,
            nameEmailOrMobile
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        plans = parseFloat(plans);

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilter = { memberType: 2, status: { $ne: 0 } };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 200 * 1000;  //0 KM RADIUS

        //Filterings
        if (plans == 0 || plans == 1) dbQueryFilter.userPlan = plans;
        if (nameEmailOrMobile) {
            let filter = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") filter.push({ email: { $regex: nameEmailOrMobile, $options: "i" } }, { fullName: { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") filter.push({ mobile: parseInt(nameEmailOrMobile) });
            dbQueryFilter.$or = filter;
        }
        let aggregateQuery = [];

        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        }
        if (latitude && longitude) {
            aggregateQuery.push({
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distanceInMeters',
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    key: 'cityCoordinates'
                }
            },)
        }

        //remaining_pipelines
        aggregateQuery.push(
            {
                $match: dbQueryFilter
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'employerId',
                    as: 'transactions'
                }
            },
            {
                $unwind: {
                    path: '$transactions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: {
                    'transactions.createdAt': -1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    data: { $first: '$$ROOT' },
                    transactions: {
                        $push: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: ['$transactions.paymentStatus', 1] }
                                    ]
                                },
                                then: {
                                    _id: '$transactions._id',
                                    id: '$transactions._id',
                                    transactionNo: '$transactions.transactionNo',
                                    planName: '$transactions.planName',
                                    transactionStartDateTime: '$transactions.transactionStartDateTime',
                                    transactionEndDateTime: '$transactions.transactionEndDateTime',
                                    invoiceUrl: '$transactions.invoiceUrl',
                                    invoiceNo: '$transactions.invoiceNo',
                                    paymentStatus: '$transactions.paymentStatus',
                                    transactionStatus: '$transactions.transactionStatus'
                                },
                                else: '$REMOVE'
                            }
                        }
                    }
                }

            },
        )

        //Pushing to facet
        facetQuery.paginatedData.push({
            $project: {
                id: "$data._id",
                fullName: "$data.fullName",
                email: "$data.email",
                mobile: "$data.mobile",
                dp: "$data.dp",
                memberType: "$data.memberType",
                createdAt: "$data.createdAt",
                webAccess: "$data.webAccess",
                appAccess: "$data.appAccess",
                userPlan: "$data.userPlan",
                weavyId: "$data.weavyId",
                status: "$data.status",
                basicProfileStatus: "$data.basicProfileStatus",
                lastLoginDateTime: "$data.lastLoginDateTime",
                distanceInMeters: "$data.distanceInMeters",
                transactions: {
                    $cond: {
                        if: { $eq: [{ $size: '$transactions' }, 0] },
                        then: {},
                        else: { $arrayElemAt: ['$transactions', 0] }
                    }
                }
            }

        },)

        if (latitude && longitude) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    'distanceInMeters': 1,
                    'lastLoginDateTime': -1

                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    'lastLoginDateTime': -1
                }
            },)
        }

        //applying_pagination
        facetQuery.paginatedData.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        )

        //Combining in all Query
        aggregateQuery.push({
            $facet: facetQuery
        })

        let data = await Employer.aggregate(aggregateQuery);
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length && latitude && longitude) {
            paginatedData = paginatedData.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, paginatedData, 'Employers fetched successfully', {}, paginatedDataCount, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Employers fetching failed', e))
    }
}

exports.editClientRequirements = async (req, res) => {
    try {
        let {
            cuisines,
            jobType,
            minimumPayment,
            urgency,
            breakfast,
            lunch,
            dinner,
            vesselWash,
            preferredGender,
            status,
            id

        } = Object.assign(req.body)
        if (lunch == 0 && dinner == 0 && breakfast == 0) throw Error("Among Breakfast,lunch,dinner must select one")

        let data = await ClientRequirement.findOne({ _id: id, isDeleted: false });
        if (!data) throw Error("No data found")

        let body = { updatedAt: getCurrentDateAndTime() };
        if (cuisines && cuisines.length) await isValidCuisine(cuisines), body.cuisines = cuisines;
        if (jobType) body.jobType = jobType;
        if (minimumPayment) body.minimumPayment = minimumPayment;
        if (urgency) body.urgency = urgency;
        if (breakfast == 0 || breakfast == 1) body.breakfast = breakfast;
        if (lunch == 0 || lunch == 1) body.lunch = lunch;
        if (dinner == 0 || dinner == 1) body.dinner = dinner;
        if (vesselWash == 0 || vesselWash == 1) body.vesselWash = vesselWash;
        if (status == 0 || status == 1 || status == 2) body.status = status;
        if (preferredGender) body.preferredGender = preferredGender;

        data = await ClientRequirement.findOneAndUpdate({ _id: id }, { $set: body }, { new: true })
        res.status(200).send(responseJson(1, 1, data, 'Requirement updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Requirement updating failed', e))
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
        if (!eventData) throw Error("Invalid id.Try again")
        if (eventType) updateBody.eventType = eventType;
        if (eventDate) updateBody.eventDate = eventDate;
        if (cuisines) updateBody.cuisines = cuisines;
        if (expectedGuest) updateBody.expectedGuest = expectedGuest;
        if (pincode) updateBody.pincode = pincode;
        if (city) updateBody.city = city;
        if (cityCoordinates) updateBody.cityCoordinates = cityCoordinates;
        if (locationCoordinates) updateBody.locationCoordinates = locationCoordinates;
        if (location) updateBody.location = location;
        if (dishes) updateBody.dishes = dishes;
        if (status == 0 || status == 1 || status == 2) updateBody.status = status;

        eventData = await Events.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, eventData, 'Events updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Events edit failed', e))
    }
}


exports.supsendAccount = async (req, res) => {
    try {
        let {
            id,
            modelName,
            role,
            dbQuery
        } = Object.assign(req.body);

        const requiredFields = {
            id, role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role !== "cook" & role !== "employer") throw { statusCode: 400, responseCode: 2, msg: "Please provide valid role" }
        modelName = (role == "cook") ? Cook : Employer;
        let macAddress = [];
        let data = await modelName.findOne({ _id: id, status: { $in: [1, 2, 3, 4] } });
        if (!data) throw { statusCode: 404, responsecode: 0, msg: "No account found. Try again!" }
        if (data.loginMAC) {
            await BlockedMac.findOneAndUpdate({ macAddress: data.loginMAC }, {
                macAddress: data.loginMAC,
                createdAt: getCurrentDateAndTime(),
                createdAt: getCurrentDateAndTime()
            }, { upsert: true })
        }
        if (data.registerMAC) {
            await BlockedMac.findOneAndUpdate({ macAddress: data.registerMAC }, {
                macAddress: data.registerMAC,
                createdAt: getCurrentDateAndTime(),
                createdAt: getCurrentDateAndTime()
            }, { upsert: true })
        }
        await modelName.findOneAndUpdate({ _id: id }, { $set: { status: 3 } }, { new: true })
        if (role == "cook") {
            await DisposalAccounts.findOneAndUpdate({ cookId: id, activity: 1 }, { $set: { cookId: id, activity: 1, previousStatus: data.status, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() } }, { new: true, upsert: true });
        }
        else if (role == "employer") {
            await DisposalAccounts.findOneAndUpdate({ employerId: id, activity: 1 }, { $set: { employerId: id, activity: 1, previousStatus: data.status, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() } }, { new: true, upsert: true });
        }

        res.status(200).send(responseJson(1, 1, {}, 'Account suspended successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account suspension failed', e))
    }
}

exports.getDisposalAccounts = async (req, res) => {
    try {
        let {
            id,
            modelName,
            status,
            role,
            skip, limit, page
        } = Object.assign(req.query);

        const requiredFields = {
            status,
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role !== "cook" & role !== "employer") throw { statusCode: 400, responseCode: 2, msg: "Please provide valid role" }
        if (status != 3 & status != 4) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid status" }
        let sortFilters = (status == 4) ? { deleteRequestedAt: -1 } : { profilePercent: -1, createdAt: -1 };
        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        modelName = (role == "cook") ? Cook : Employer;
        let totalData = await modelName.find({ status });
        let data = await modelName.find({ status }).limit(limit).skip(skip).sort(sortFilters);
        res.status(200).send(responseJson(1, 1, data, 'Accounts fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account fetching failed', e))
    }
}

exports.revokeSuspension = async (req, res) => {
    try {
        let {
            id,
            modelName,
            role, dbQuery
        } = Object.assign(req.body);

        const requiredFields = {
            id,
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role !== "cook" & role !== "employer") throw { statusCode: 400, responseCode: 2, msg: "Please provide valid role" }
        modelName = (role == "cook") ? Cook : Employer;

        if (role == "cook") dbQuery = { cookId: id, activity: 1 };
        else if (role == "employer") dbQuery = { employerId: id, activity: 1 }

        let disposalData = await DisposalAccounts.findOne(dbQuery);
        if (!disposalData) throw { statusCode: 404, responseCode: 0, msg: "No account found. Try again!" }

        let data = await modelName.findOneAndUpdate({ _id: id }, { $set: { status: disposalData.previousStatus } }, { new: true })
        disposalData = await DisposalAccounts.findOneAndDelete({ _id: disposalData._id });
        let macAddresses = [];
        if (data.registerMAC) macAddresses.push(data.registerMAC);
        if (data.loginMAC) macAddresses.push(data.loginMAC);

        await BlockedMac.deleteMany({ macAddress: { $in: macAddresses } });
        res.status(200).send(responseJson(1, 1, {}, 'Suspension revoked successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Suspension revoking failed', e))
    }
}

exports.revokeDeleteRequest = async (req, res) => {
    try {
        let {
            id,
            modelName,
            role, dbQuery
        } = Object.assign(req.body);

        const requiredFields = {
            id,
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role !== "cook" & role !== "employer") throw { statusCode: 400, responseCode: 2, msg: "Please provide valid role" }
        modelName = (role == "cook") ? Cook : Employer;

        if (role == "cook") dbQuery = { cookId: id, activity: 2 };
        else if (role == "employer") dbQuery = { employerId: id, activity: 2 }

        let disposalData = await DisposalAccounts.findOne(dbQuery);
        if (!disposalData) throw { statusCode: 404, responseCode: 0, msg: "No request found. Try again!" }

        let data = await modelName.findOneAndUpdate({ _id: id }, { $set: { status: disposalData.previousStatus }, $unset: { deleteRequestedAt: '' } }, { new: true })
        disposalData = await DisposalAccounts.findOneAndDelete({ _id: disposalData._id });

        res.status(200).send(responseJson(1, 1, {}, 'Delete request revoked successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Delete request revoking failed', e))
    }
}

exports.deleteAccount = async (req, res) => {
    try {
        let {
            id,
            modelName,
            role, dbQuery
        } = Object.assign(req.body);

        const requiredFields = {
            id,
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        if (role !== "cook" & role !== "employer") throw { statusCode: 400, responseCode: 2, msg: "Please provide valid role" }

        let deleteBody = [];
        if (role == "cook") {
            modelName = Cook;
            deleteBody.push(CookActivity.deleteMany({ cookId: id }));
            deleteBody.push(CookApplication.deleteMany({ cookId: id }));
            deleteBody.push(CookPoints.deleteMany({ cookId: id }));
            deleteBody.push(CookShortlist.deleteMany({ cookId: id }));
            deleteBody.push(CookVerify.deleteMany({ cookId: id }));
            deleteBody.push(DisposalAccounts.deleteMany({ cookId: id }));
            deleteBody.push(EmailVerify.deleteMany({ cookId: id }));
            deleteBody.push(EmployerActivity.deleteMany({ cookId: id }));
            deleteBody.push(Transaction.deleteMany({ cookId: id }));
            deleteBody.push(CookReports.deleteMany({ cookId: id }))
            deleteBody.push(EmployerReports.deleteMany({ cookId: id }))
        }
        else if (role == "employer") {
            modelName = Employer;
            deleteBody.push(ClientPoints.deleteMany({ clientId: id }));
            deleteBody.push(ClientRequirement.deleteMany({ clientId: id }));
            deleteBody.push(CookActivity.deleteMany({ employerId: id }));
            deleteBody.push(CookApplication.deleteMany({ employerId: id }));
            deleteBody.push(CookShortlist.deleteMany({ employerId: id }));
            deleteBody.push(DisposalAccounts.deleteMany({ employerId: id }));
            deleteBody.push(EmailVerify.deleteMany({ employerId: id }));
            deleteBody.push(EmployerActivity.deleteMany({ employerId: id }));
            deleteBody.push(EmployerPoints.deleteMany({ employerId: id }));
            deleteBody.push(EmployerVerify.deleteMany({ employerId: id }));
            deleteBody.push(Events.deleteMany({ clientId: id }));
            deleteBody.push(Jobs.deleteMany({ employerId: id }));
            deleteBody.push(Transaction.deleteMany({ employerId: id }));
            deleteBody.push(EmployerReports.deleteMany({ employerId: id }));
        }

        let data = await modelName.findOne({ _id: id });
        if (!data) throw { statusCode: 404, responseCode: 0, msg: "No profile found. Try again!" }

        await Promise.all(deleteBody);
        console.log("All reference tables cleared")
        await modelName.deleteMany({ _id: id });
        res.status(200).send(responseJson(1, 1, {}, 'Account deleted successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account deletion failed', e))
    }
}

exports.createCSExecutive = async (req, res) => {
    try {
        let {
            name,
            password,
            username,
            role,
            houseCookAccess,
            partyCookAccess,
            chefAccess,
            cateringAccess,
            employerAccess,
            clientAccess,
            status

        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            name,
            password,
            username,
            role,
            houseCookAccess,
            partyCookAccess,
            chefAccess,
            cateringAccess,
            employerAccess,
            clientAccess,
            status
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let [roleData, data] = await Promise.all([
            Role.findById(role),
            CSExecutive.findOne({ username: username.trim() })
        ]);
        if (!roleData) throw { statusCode: 404, responseCode: 0, msg: "No role found. Try again!" }
        if (data) throw { statusCode: 409, responseCode: 5, msg: "Username is not available.Try another one" }

        data = await CSExecutive.create({
            name: capitalizeEveryInnerWord(name),
            password: bcrypt.hashSync(password, 8),
            username,
            roleId: roleData._id,
            houseCookAccess,
            partyCookAccess,
            chefAccess,
            cateringAccess,
            employerAccess,
            clientAccess,
            status,
            createdBy: req.user._id,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime()
        })
        if (!data) throw { statusCode: 500, responseCode: 6, msg: "Executive creation failed.Try again" }
        res.status(200).send(responseJson(1, 1, data, 'Executive created successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Executive creation failed', e))
    }
}

exports.fetchCSExecutiveList = async (req, res) => {
    try {

        let {
            page, skip, limit
        } = Object.assign(req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 100;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let totalData = await CSExecutive.find({});
        let data = await CSExecutive.find({}).populate([{ path: 'roleId', select: 'roleName' }]).select('-password -createdBy').sort({ createdAt: -1 }).limit(limit).skip(skip);

        res.status(200).send(responseJson(1, 1, data, 'Executive fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Executive fetching failed', e))
    }
}

exports.getCSExecutiveDetails = async (req, res) => {
    try {

        let {
            id

        } = Object.assign(req.query)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await CSExecutive.findOne({ _id: id }).populate([{ path: 'roleId', select: 'roleName' }]).select('-password -createdBy');
        if (!data) throw { statusCode: 404, responseCode: 0, msg: 'No profile found. Try again!' }

        res.status(200).send(responseJson(1, 1, data, 'Details fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Details fetching failed', e))
    }
}

exports.editCSExecutive = async (req, res) => {
    try {
        let {
            id,
            name,
            password,
            username,
            role,
            houseCookAccess,
            partyCookAccess,
            chefAccess,
            cateringAccess,
            employerAccess,
            clientAccess,
            status

        } = Object.assign(req.body)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await CSExecutive.findOne({ _id: id });
        if (!data) throw { statusCode: 404, responseCode: 0, msg: "No profile found." }


        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (role) {
            let roleData = await Role.findById(role);
            if (!roleData) throw { statusCode: 404, responseCode: 0, msg: "No role found." }
            updateBody.roleId = role;
        }
        if (username) {
            let usernameData = await CSExecutive.findOne({ username: username.trim() })
            if (usernameData && (usernameData._id).toString() != (id).toString()) throw { statusCode: 409, responseCode: 5, msg: "Username is not available.Try another one" }
            updateBody.username = username;
        }
        if (name) updateBody.name = capitalizeEveryInnerWord(name);
        if (password) updateBody.password = bcrypt.hashSync(password, 8);
        if (houseCookAccess != null && houseCookAccess != undefined) updateBody.houseCookAccess = houseCookAccess;
        if (partyCookAccess != null && partyCookAccess != undefined) updateBody.partyCookAccess = partyCookAccess;
        if (chefAccess != null && chefAccess != undefined) updateBody.chefAccess = chefAccess;
        if (cateringAccess != null && cateringAccess != undefined) updateBody.cateringAccess = cateringAccess;
        if (employerAccess != null && employerAccess != undefined) updateBody.employerAccess = employerAccess;
        if (clientAccess != null && clientAccess != undefined) updateBody.clientAccess = clientAccess;
        data = await CSExecutive.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, data, 'Executive updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Executive updation failed', e))
    }
}

exports.deleteCSExecutive = async (req, res) => {
    try {
        let {
            id

        } = Object.assign(req.query)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await CSExecutive.findOne({ _id: id });
        if (!data) throw { statusCode: 404, responseCode: 0, msg: "No profile found." }

        data = await CSExecutive.findOneAndDelete({ _id: id });
        res.status(200).send(responseJson(1, 1, {}, 'Executive deleted successfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Executive deletion failed', e))
    }
}

exports.getActivitiesList = async (req, res) => {
    try {

        let {
            id,
            role,
            date,
            data,
            totalData, limit, page, skip

        } = Object.assign(req.query)

        const requiredFields = {
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let dbQuery = { isDeleted: false };

        if (date) date = moment(date).format('YYYY-MM-DD'), dbQuery.createdAt = { $gte: `${date}T00:00:00.000Z`, $lt: `${date}T23:59:59.999Z` }
        if (id) dbQuery._id = id;
        //Paginations
        limit = limit ? parseInt(limit) : 100;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);


        if (role !== "cook" && role !== "employer") throw { statusCode: 400, responseCode: 0, msg: "Please provide valid role" }
        if (role == "cook") {
            data = await CookActivity.find(dbQuery).populate([
                {
                    path: "jobId", select: 'designation salary openings', populate: [{
                        path: "employerId", select: "fullName email mobile dp mobile memberType weavyId"
                    }]
                },
                {
                    path: "eventId", select: 'eventType eventDate', populate: [{
                        path: "clientId", select: "fullName email mobile dp mobile memberType weavyId"
                    }]
                },
                {
                    path: "requirementId", select: "jobType minimumPayment", populate: [{
                        path: "clientId", select: "fullName email mobile dp mobile memberType weavyId"
                    }]
                },
                { path: "employerId", select: "fullName email mobile dp mobile memberType weavyId" },
                { path: 'cookId', select: 'fullName email mobile dp cookType memberType partyCook weavyId' }
            ]).sort({ createdAt: -1 }).limit(limit).skip(skip);
            totalData = await CookActivity.find(dbQuery);
        }
        if (role == "employer") {
            data = await EmployerActivity.find(dbQuery).populate([
                { path: 'cookId', select: 'fullName email mobile dp cookType memberType partyCook weavyId' },
                { path: "employerId", select: "fullName email mobile dp mobile memberType weavyId" },
                { path: "applicationId" }
            ]).sort({ createdAt: -1 }).limit(limit).skip(skip);
            totalData = await EmployerActivity.find(dbQuery);
        }
        let hourlyWiseData = generateHourlyData(totalData);
        res.status(200).send(responseJson(1, 1, { activitiesData: data, hourlyWiseData }, 'Activities fetched successfully!', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Executive updation failed', e))
    }
}

exports.fetchTickets = async (req, res) => {
    try {

        let {
            id,
            status,
            ticketNumber,
            limit, page, skip

        } = Object.assign(req.query)

        const requiredFields = {
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        //Paginations
        limit = limit ? parseInt(limit) : 100;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = {};
        if (id) dbQuery._id = id;
        if (ticketNumber) dbQuery.ticketNumber = ticketNumber;
        if (status) dbQuery.status = status;
        let data = await Ticket.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await Ticket.find(dbQuery);
        res.status(200).send(responseJson(1, 1, data, 'Ticket fetched successfully!', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching tickets failed', e))
    }
}

exports.addResumeTemplate = async (req, res) => {
    try {

        let template = `<!-- FONTS -->
<link href='https://fonts.googleapis.com/css?family=Open+Sans:300,400,600' rel='stylesheet' type='text/css'>
<link href='https://fonts.googleapis.com/css?family=Raleway:100' rel='stylesheet' type='text/css'>
<link href='https://fonts.googleapis.com/css?family=Montserrat' rel='stylesheet' type='text/css'>
<style>
    * {
  box-sizing: border-box;
  transition: 0.35s ease;
}
.rela-block {
  display: block;
  position: relative;
  margin: auto;
 
}
.rela-inline {
  display: inline-block;
  position: relative;
  margin: auto;
 
}
.floated {
  display: inline-block;
  position: relative;
  margin: false;
  float: left;
}
.abs-center {
  display: false;
  position: absolute;
  margin: false;
  top: 50%;
  left: 50%;
  right: false;
  bottom: false;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 88%;
}
body {
  font-family: 'Open Sans';
  font-size: 18px;
  letter-spacing: 0px;
  font-weight: 400;
  line-height: 28px;
  background: url("http://kingofwallpapers.com/leaves/leaves-016.jpg") right no-repeat;
  background-size: cover;
}
body:before {
  content: "";
  display: false;
  position: fixed;
  margin: 0;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255,255,255,0.92);
}
.caps {
  text-transform: uppercase;
}
.justified {
  text-align: justify;
}
p.light {
  color: #777;
}
h2 {
  font-family: 'Open Sans';
  font-size: 30px;
  letter-spacing: 5px;
  font-weight: 600;
  line-height: 40px;
  color: #000;
}
h3 {
  font-family: 'Open Sans';
  font-size: 21px;
  letter-spacing: 1px;
  font-weight: 600;
  line-height: 28px;
  color: #000;
}
.page {
  width: 100%;
  max-width: 1200px;
  margin: 0;
  background-color: #fff;
  box-shadow: none;
}
.top-bar {
  height: 220px;
  background-color: #848484;
  color: #fff;
}
.name {
  display: false;
  position: absolute;
  margin: false;
  top: false;
  left: calc(350px + 5%);
  right: 0;
  bottom: 0;
  height: 120px;
  text-align: center;
  font-family: 'Raleway';
  font-size: 58px;
  letter-spacing: 8px;
  font-weight: 100;
  line-height: 60px;
}
.name div {
  width: 94%;
}
.side-bar {
  display: false;
  position: absolute;
  margin: false;
  top: 60px;
  left: 5%;
  right: false;
  bottom: 0;
  width: 350px;
  background-color: #f7e0c1;
  padding: 320px 30px 50px;
}
.mugshot {
  display: false;
  position: absolute;
  margin: false;
  top: 50px;
  left: 70px;
  right: false;
  bottom: false;
  height: 210px;
  width: 210px;
}
.mugshot .logo {
  margin: -23px;
}
.logo {
  display: false;
  position: absolute;
  margin: false;
  top: 0;
  left: 0;
  right: false;
  bottom: false;
  z-index: 100;
  margin: 0;
  color: #000;
  height: 200px;
  width: 200px;
  border:solid 1px;
}
.logo .logo-svg {
  height: 100%;
  width: 100%;
  stroke: #000;
  cursor: pointer;
}
.logo .logo-text {
  display: false;
  position: absolute;
  margin: false;
  cursor: pointer;
  font-family: "Montserrat";
  font-size: 55px;
  letter-spacing: 0px;
  font-weight: 400;

}
.social {
  padding-left: 60px;
  margin-bottom: 20px;
  cursor: pointer;
}
.social:before {
  content: "";
  display: false;
  position: absolute;
  margin: false;
  top: -4px;
  left: 10px;
  right: false;
  bottom: false;
  height: 35px;
  width: 35px;
  background-size: cover !important;
}

.side-header {
  font-family: 'Open Sans';
  font-size: 18px;
  letter-spacing: 4px;
  font-weight: 600;
  line-height: 28px;
  margin: 60px auto 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #888;
}
.list-thing {
  padding-left: 25px;
  margin-bottom: 10px;
}
.content-container {
  margin-right: 0;
  width: calc(95% - 350px);
  padding: 25px 40px 50px;
}
.content-container > * {
  margin: 0 auto 25px;
}
.content-container > h3 {
  margin: 0 auto 5px;
}
.content-container > p.long-margin {
  margin: 0 auto 50px;
}
.title {
  width: 80%;
  text-align: center;
}
.separator {
  width: 240px;
  height: 2px;
  background-color: #999;
}
.greyed {
  background-color: #ddd;
  width: 100%;
  max-width: 580px;
  text-align: center;
  font-family: 'Open Sans';
  font-size: 18px;
  letter-spacing: 6px;
  font-weight: 600;
  line-height: 28px;
}
@media screen and (max-width: 1150px) {
  .name {
    color: #fff;
    font-family: 'Raleway';
    font-size: 38px;
    letter-spacing: 6px;
    font-weight: 100;
    line-height: 48px;
  }
}

</style>
<!-- PAGE STUFF -->
<div class="rela-block page">
    <div class="rela-block top-bar">
        <div class="caps name"><div class="abs-center">Kyle J Shanks</div></div>
    </div>
    <div class="side-bar">
        <div class="mugshot">
            <div class="logo">
                
             
            </div>
        </div>
        <p>{{mobile}}</p>
        <p>{address}</p>
        
        <p>{email}</p><br>
    
        <p class="rela-block caps side-header">Skills</p>
        <p class="rela-block list-thing">{skills}</p>
       
        <p class="rela-block caps side-header">Cuisines Known</p>
        <p class="rela-block list-thing">{cuisines}</p>
        
    </div>
    <div class="rela-block content-container">
        <h2 class="rela-block caps title">{designation}</h2>
        <div class="rela-block separator"></div>
        <div class="rela-block caps greyed">Profile</div>
        <p class="long-margin">{about}</p>
        <div class="rela-block caps greyed">Education</div>
        <h3>Education #1</h3>
        <p class="light">First job description</p>
        <p class="justified">Plaid gentrify put a bird on it, pickled XOXO farm-to-table irony raw denim messenger bag leggings. Hoodie PBR&B photo booth, vegan chillwave meh paleo freegan ramps. Letterpress shabby chic fixie semiotics. Meditation sriracha banjo pour-over. Gochujang pickled hashtag mixtape cred chambray. Freegan microdosing VHS, 90's bicycle rights aesthetic hella PBR&B. </p>
        
        <div class="rela-block caps greyed">Experience</div>

        <h3>Job #1</h3>
        <p class="light">First job description</p>
        <p class="justified">Plaid gentrify put a bird on it, pickled XOXO farm-to-table irony raw denim messenger bag leggings. Hoodie PBR&B photo booth, vegan chillwave meh paleo freegan ramps. Letterpress shabby chic fixie semiotics. Meditation sriracha banjo pour-over. Gochujang pickled hashtag mixtape cred chambray. Freegan microdosing VHS, 90's bicycle rights aesthetic hella PBR&B. </p>
        
        <h3>Job #2</h3>
        <p class="light">Second Job Description</p>
        <p class="justified">Beard before they sold out photo booth distillery health goth. Hammock franzen green juice meggings, ethical sriracha tattooed schlitz mixtape man bun stumptown swag whatever distillery blog. Affogato iPhone normcore, meggings actually direct trade lomo plaid franzen shoreditch. Photo booth pug paleo austin, pour-over banh mi scenester vice food truck slow-carb. Street art kogi normcore, vice everyday carry crucifix thundercats man bun raw denim echo park pork belly helvetica vinyl. </p>
        
        <h3>Job #3</h3>
        <p class="light">Third Job Description</p>
        <p class="justified">Next level roof party lo-fi fingerstache skateboard, kogi tumblr. Shabby chic put a bird on it chambray, 3 wolf moon swag beard brooklyn post-ironic taxidermy art party microdosing keffiyeh marfa. Put a bird on it 3 wolf moon cliche helvetica knausgaard. Mumblecore fingerstache lomo, artisan freegan keffiyeh paleo kinfolk kale chips street art blog flannel.</p>
    </div>
</div>`
        let templateUrl;

        const requiredFields = {
            template
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        templateUrl = await storeResumeTemplate(template);
        if (!templateUrl) throw { statusCode: 500, responseCode: 0, msg: "Unable to generate template. Try again!" }

        let data = await ResumeTemplate.create({ template, templateUrl, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() });
        if (!data) throw { statusCode: 500, responseCode: 0, msg: "Unable to store template. Try again!" }
        res.status(200).send(responseJson(1, 1, data, 'Template added successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Storing templates failed', e))
    }
}

exports.getResumeTemplatesList = async (req, res) => {
    try {

        let {
            id, status,
            limit, page, skip

        } = Object.assign(req.query)

        const requiredFields = {
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        //Paginations
        limit = limit ? parseInt(limit) : 100;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = {};
        if (id) dbQuery._id = id;
        if (status) dbQuery.status = status;
        let data = await ResumeTemplate.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        res.status(200).send(responseJson(1, 1, data, 'Templates fetched successfully!', {}, data.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching templates failed', e))
    }
}

exports.storeSecurityKey = async (req, res) => {
    try {
        if (!req.body.securityKey) throw { statusCode: 400, responseCode: 2, msg: "Please provide securityKey" }
        let data = await AdminAuth.findOneAndUpdate({ securityKey: req.body.securityKey }, { $set: { securityKey: req.body.securityKey } }, { new: true, upsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Securities added successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Securities updation failed', e))
    }
}

exports.fetchSecurityKey = async (req, res) => {
    try {
        let data = await AdminAuth.findOne({})
        res.status(200).send(responseJson(1, 1, data, 'Securities fetched successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Securities fetching failed', e))
    }
}

exports.upgradeEmployerPlan = async (req, res) => {
    try {
        let {
            newPlanId,
            employerId,
            transactionId

        } = Object.assign(req.body)

        const requiredFields = {
            newPlanId,
            employerId,
            transactionId
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let [transactionData, newPlanData, employerData] = await Promise.all([
            Transaction.findOne({ _id: transactionId, employerId, paymentStatus: { $nin: [0] } }),
            EmployerPlan.findOne({ _id: newPlanId, isDeleted: false }),
            Employer.findOne({ _id: employerId, memberType: 2, status: { $nin: [0] } })
        ])

        if (!transactionData) throw { statusCode: 404, responseCode: 0, msg: "No transaction found!" }
        if (!newPlanData) throw { statusCode: 404, responseCode: 0, msg: "No plan found!" }
        if (!employerData) throw { statusCode: 404, responseCode: 0, msg: "No employer found!" }
        // if (newPlanId == transactionData.employerPlanId.toString()) throw { statusCode: 404, responseCode: 0, msg: "No transaction found!" }
        let pointsData = await EmployerPoints.findOne({ _id: transactionData.employerPointsId, employerId, isDeleted: false });
        let newExpiryDate = generateExpiryDate(moment(pointsData.createdAt).format('YYYY-MM-DD'), newPlanData.validityInDays);
        let transactionUpdateBody = { updatedAt: getCurrentDateAndTime() };
        transactionUpdateBody.planName = newPlanData.employerPlanName;
        transactionUpdateBody.refundPolicy = newPlanData.refundPolicy;
        transactionUpdateBody.supportAssistance = newPlanData.supportAssistance;
        transactionUpdateBody.assistanceIncluded = (newPlanData.supportAssistance == 1) ? 1 : 0;
        transactionUpdateBody.price = newPlanData.price;
        transactionUpdateBody.amount = newPlanData.price - transactionData.discount;
        transactionUpdateBody.employerPlanId = newPlanId;
        transactionUpdateBody.transactionEndDateTime = generateExpiryDate(moment(pointsData.createdAt).format('YYYY-MM-DD'), newPlanData.validityInDays)
        transactionUpdateBody.paymentDetails = {
            refundPolicy: newPlanData.refundPolicy,
            assistanceIncluded: newPlanData.supportAssistance,
            planPrice: newPlanData.price,
            assistancePrice: newPlanData.assistancePrice,
            discount: transactionData.discount,
            totalPrice: transactionUpdateBody.amount
        }

        let pointsUpdateBody = { updatedAt: getCurrentDateAndTime() };
        pointsUpdateBody.employerPlanId = newPlanId;
        pointsUpdateBody.supportAssistance = newPlanData.supportAssistance;
        pointsUpdateBody.planExpiresAt = generateExpiryDate(moment(pointsData.createdAt).format('YYYY-MM-DD'), newPlanData.validityInDays);
        pointsUpdateBody.totalJobPoints = newPlanData.jobPoints;
        pointsUpdateBody.totalProfileViewPoints = newPlanData.profileViewPoints;
        pointsUpdateBody.totalResponsePoints = newPlanData.responsePoints;
        pointsUpdateBody.currentJobPoints = ((newPlanData.jobPoints) - (pointsData.totalJobPoints - pointsData.currentJobPoints) > 0) ? (newPlanData.jobPoints) - (pointsData.totalJobPoints - pointsData.currentJobPoints) : 0;
        pointsUpdateBody.currentProfileViewPoints = ((newPlanData.profileViewPoints) - (pointsData.totalProfileViewPoints - pointsData.currentProfileViewPoints) > 0) ? (newPlanData.profileViewPoints) - (pointsData.totalProfileViewPoints - pointsData.currentProfileViewPoints) : 0;
        pointsUpdateBody.currentResponsePoints = ((newPlanData.responsePoints) - (pointsData.totalResponsePoints - pointsData.currentResponsePoints) > 0) ? (newPlanData.responsePoints) - (pointsData.totalResponsePoints - pointsData.currentResponsePoints) : 0;
        let jobs = await Jobs.find({ employerId, employerPointsId: transactionData.employerPointsId, isDeleted: false }).distinct("_id");
        await Promise.all([
            Transaction.findOneAndUpdate({ _id: transactionData._id }, { $set: transactionUpdateBody }, { new: true }),
            EmployerPoints.findOneAndUpdate({ _id: pointsData._id }, { $set: pointsUpdateBody }, { new: true }),
            Jobs.updateMany({ _id: { $in: jobs } }, { $set: { expiryDate: newExpiryDate } }, { multi: true }),
            CookApplication.updateMany({ jobId: { $in: jobs } }, { $set: { expiredAt: newExpiryDate } }, { multi: true }),
            CookShortlist.updateMany({ jobId: { $in: jobs } }, { $set: { expiryDate: newExpiryDate } }, { multi: true })
        ]);

        res.status(200).send(responseJson(1, 1, {}, 'Plan upgraded successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Upgrading plan failed', e))
    }
}

exports.getReportsList = async (req, res) => {
    try {

        let {
            role,
            id,
            date,
            limit, page, skip

        } = Object.assign(req.query)

        const requiredFields = {
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role != "employer" && role != "cook") throw { statusCode: 400, msg: "Please provide a valid role!" }
        let modelName = (role == "employer") ? EmployerReports : CookReports;

        let dbQuery = {};
        if (id) dbQuery._id = id;
        if (date) date = moment(date).format('YYYY-MM-DD'), dbQuery.createdAt = { $gte: `${date}T00:00:00.000Z`, $lt: `${date}T23:59:59.999Z` }

        //Paginations
        limit = limit ? parseInt(limit) : 100;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let data = await modelName.find(dbQuery).populate([
            { path: 'cookId', select: 'fullName email mobile dp cookType memberType partyCook weavyId' },
            { path: 'employerId', select: 'fullName email mobile dp memberType weavyId' },
            { path: 'jobId' },
            { path: 'eventId' },
            { path: 'requirementId' }
        ]).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalData = await modelName.find(dbQuery).countDocuments();

        res.status(200).send(responseJson(1, 1, data, 'Reports fetched successfully!', {}, data.length, totalData))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching reports failed', e))
    }
}

exports.triggerJobNotification = async (req, res) => {
    try {

        let {
            jobId

        } = Object.assign(req.body)

        const requiredFields = {
            jobId
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let jobData = await Jobs.findOne({ isDeleted: false, _id: jobId });
        if (!jobData) throw { statusCode: 404, msg: "No job found!" }
        console.log(jobData)
        await sendBulkJobNotificationsToChef({ longitude: jobData.locationCoordinates.coordinates[0], latitude: jobData.locationCoordinates.coordinates[1], location: jobData.location, designation: jobData.designation, jobId });

        res.status(200).send(responseJson(1, 1, {}, 'Job notifications sent successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Sending notifications failed', e))
    }
}

exports.triggerEventNotification = async (req, res) => {
    try {

        let {
            eventId

        } = Object.assign(req.body)

        const requiredFields = {
            eventId
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Events.findOne({ isDeleted: false, _id: eventId });
        if (!data) throw { statusCode: 404, msg: "No event found!" }
        console.log(data)
        await sendBulkEventNotifications({
            longitude: data.locationCoordinates.coordinates[0], latitude: data.locationCoordinates.coordinates[1],
            location: data.location, eventType: data.eventType, eventId: data._id
        })
        res.status(200).send(responseJson(1, 1, {}, 'Event notifications sent successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Sending notifications failed', e))
    }
}

exports.changeRole = async (req, res) => {
    try {
        let {
            memberType,
            cookType,
            partyCook,
            cookId
        } = Object.assign(req.body)

        const requiredFields = {
            memberType,
            cookId
        }

        if (memberType == 1) requiredFields.cookType = cookType, requiredFields.partyCook = partyCook;
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Cook.findOne({ _id: cookId });
        if (!data) throw { statusCode: 404, msg: "No profile found" }
        if (memberType == 2) {
            data = await Cook.findOneAndUpdate({ _id: cookId }, { $unset: { cookType: '', partyCook: '' }, $set: { memberType: 2 } }, { new: true })
            await Promise.all([
                CookActivity.deleteMany({ cookId }),
                CookApplication.deleteMany({ cookId }),
                CookShortlist.deleteMany({ cookId }),
                CookReports.deleteMany({ cookId }),
                CookPoints.findOneAndUpdate({ cookId }, {
                    cookId: data._id,
                    cateringDailyLimit: 10, cateringMonthlyLimit: 50, cateringDailyLimitBalance: 10, cateringMonthlyLimitBalance: 50,
                    planStartDate: getCurrentDateAndTime(), planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                    createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
                }, { new: true })
            ])
        }
        if (memberType == 1) {
            data = await Cook.findOneAndUpdate({ _id: cookId }, { $set: { ...req.body } }, { new: true });
            if (data.cookType == 1) {
                await Promise.all([
                    CookActivity.deleteMany({ cookId, jobId: { $exists: true } }),
                    CookApplication.deleteMany({ cookId, jobId: { $exists: true } }),
                    CookShortlist.deleteMany({ cookId, jobId: { $exists: true } }),
                    CookReports.deleteMany({ cookId, jobId: { $exists: true } })
                ]);
            }
            if (data.cookType == 2) {
                await Promise.all([
                    CookActivity.deleteMany({ cookId, requirementId: { $exists: true } }),
                    CookApplication.deleteMany({ cookId, requirementId: { $exists: true } }),
                    CookShortlist.deleteMany({ cookId, requirementId: { $exists: true } }),
                    CookReports.deleteMany({ cookId, requirementId: { $exists: true } })
                ])

            }
            if (data.partyCook == 0) {
                await Promise.all([
                    CookActivity.deleteMany({ cookId, eventId: { $exists: true } }),
                    CookApplication.deleteMany({ cookId, eventId: { $exists: true } }),
                    CookShortlist.deleteMany({ cookId, eventId: { $exists: true } }),
                    CookReports.deleteMany({ cookId, eventId: { $exists: true } }),
                ])
            }
            await CookPoints.findOneAndUpdate({ cookId }, {
                chefDailyLimit: 10, chefMonthlyLimit: 50, chefDailyLimitBalance: 10, chefMonthlyLimitBalance: 50,
                cookId, partyDailyLimit: 10, partyMonthlyLimit: 50, partyDailyLimitBalance: 10, partyMonthlyLimitBalance: 50,
                houseDailyLimit: 10, houseMonthlyLimit: 50, houseDailyLimitBalance: 10, houseMonthlyLimitBalance: 50,
                chefPlanStartDate: getCurrentDateAndTime(), chefPlanEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, chefPlanRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                planStartDate: getCurrentDateAndTime(), planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            }, { new: true })
        }
        res.status(200).send(responseJson(1, 1, {}, 'Role changed successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Changing role failed', e))
    }
}

exports.getApplicationsList = async (req, res) => {
    try {
        let {
            jobId, eventId, requirementId,
            id, active, expired,
            limit, page, skip,
            status
        } = Object.assign(req.query)

        // const requiredFields = {
        // }

        // let requestDataValid = isRequestDataValid(requiredFields, '1234')
        // if (requestDataValid !== true) throw Error(requestDataValid);

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        if (!jobId && !eventId && !requirementId) throw { statusCode: 400, responseCode: 0, msg: "Please provide jobId,eventId or requirementId" }

        let dbQuery = { isDeleted: false, applicationStatus: { $nin: ["cancelled"] } };
        if (jobId) dbQuery.jobId = jobId;
        if (eventId) dbQuery.eventId = eventId;
        if (requirementId) dbQuery.requirementId = requirementId;
        if (status) dbQuery.applicationStatus = status;
        if (id) dbQuery._id = id;
        if (active == 1) dbQuery.expiredAt = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbQuery.expiredAt = { $lte: getCurrentDateAndTime() }

        let totalData = await CookApplication.find(dbQuery).countDocuments();
        let paginationData = await CookApplication.find(dbQuery).populate([
            { path: "cookId", select: "fullName email mobile dp dob gender memberType cookType partyCook addressLine1 addressLine2 cityName provinceName pincode" },
            { path: "employerId", select: "fullName email mobile dp dob gender memberType propertyType addressLine1 addressLine2 cityName provinceName pincode" },
            { path: "jobId" },
            { path: "eventId" },
            { path: "requirementId" }
        ]).sort({ createdAt: -1 }).limit(limit).skip(skip);
        res.status(200).send(responseJson(1, 1, paginationData, 'Applications list fetched successfully!', {}, paginationData.length, totalData))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching applications list failed', e))
    }
}

exports.getAllUsersGraphData = async (req, res) => {
    try {

        if (!req.query.startDate) throw { statusCode: 400, msg: "Please provide start date" }
        if (!req.query.endDate) throw { statusCode: 400, msg: "Please provide end date" }

        const startDate = new Date(`${req.query.startDate}T00:00:00.000Z`);
        const endDate = new Date(`${req.query.endDate}T23:59:59.999Z`);

        console.log({ startDate, endDate })

        // Generate a sequence of dates between startDate and endDate
        const dateSequence = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dateSequence.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const [cookdata, cateringData, employerData, clientData] = await Promise.all([
            Cook.aggregate([
                {
                    $match: {
                        status: { $nin: [0] },
                        memberType: 1,
                        createdAt: {
                            $gt: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        date: '$_id',
                        count: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { 'date': 1 }
                }
            ]),
            Cook.aggregate([
                {
                    $match: {
                        status: { $nin: [0] },
                        memberType: 2,
                        createdAt: {
                            $gt: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        date: '$_id',
                        count: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { 'date': 1 }
                }
            ]),
            Employer.aggregate([
                {
                    $match: {
                        status: { $nin: [0] },
                        memberType: 2,
                        createdAt: {
                            $gt: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        date: '$_id',
                        count: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { 'date': 1 }
                }
            ]),
            Employer.aggregate([
                {
                    $match: {
                        status: { $nin: [0] },
                        memberType: 1,
                        createdAt: {
                            $gt: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        date: '$_id',
                        count: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { 'date': 1 }
                }
            ])
        ])

        const totalCooksCount = cookdata.reduce((total, currentDate) => total + currentDate.count, 0);
        const totalCateringsCount = cateringData.reduce((total, currentDate) => total + currentDate.count, 0);
        const totalEmployersCount = employerData.reduce((total, currentDate) => total + currentDate.count, 0);
        const totalClientsCount = clientData.reduce((total, currentDate) => total + currentDate.count, 0);
        const totalUsersCount = totalCooksCount + totalCateringsCount + totalEmployersCount + totalClientsCount;

        // Create a map to aggregate counts for each date
        const aggregatedDataMap = new Map();
        let data = [...employerData, ...clientData, ...cookdata, ...cateringData];
        data.forEach(({ date, count }) => {
            if (aggregatedDataMap.has(date)) {
                aggregatedDataMap.set(date, aggregatedDataMap.get(date) + count);
            } else {
                aggregatedDataMap.set(date, count);
            }
        });

        // Convert the aggregated data map to an array of objects
        let result = Array.from(aggregatedDataMap.entries()).map(([date, count]) => ({ date: date, count }));

        // Fill in missing dates with count as zero
        result = dateSequence.map(date => ({
            date: date.toISOString().split('T')[0],
            count: aggregatedDataMap.has(date.toISOString().split('T')[0]) ? aggregatedDataMap.get(date.toISOString().split('T')[0]) : 0
        }));

        res.status(200).send(responseJson(1, 1, { totalUsersCount, totalCooksCount, totalCateringsCount, totalEmployersCount, totalClientsCount, dailywiseData: result }, 'Graph data fetched successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching graphs list failed', e))
    }
}


exports.blockMacAddress = async (req, res) => {
    try {
        let {
            macAddress
        } = Object.assign(req.body)

        const requiredFields = {
            macAddress
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await BlockedMac.findOneAndUpdate({ macAddress }, { macAddress, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { upsert: true, new: true });
        res.status(200).send(responseJson(1, 1, data, 'Mac Address blocked sucessfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Blocking mac address failed', e))
    }
}

exports.unblockMacAddress = async (req, res) => {
    try {
        let {
            macAddress
        } = Object.assign(req.body)

        const requiredFields = {
            macAddress
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await BlockedMac.deleteMany({ macAddress });;
        res.status(200).send(responseJson(1, 1, {}, 'Mac Address unblocked sucessfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Unblocking mac address failed', e))
    }
}

exports.getBlockedMacAddressList = async (req, res) => {
    try {
        let {
            macAddress,
            id,
            limit, page, skip
        } = Object.assign(req.query)

        const requiredFields = {

        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = {};
        if (macAddress) dbQuery.macAddress = macAddress;
        if (id) dbQuery._id = id;

        let data = await BlockedMac.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalDataCount = await BlockedMac.find(dbQuery).countDocuments();
        res.status(200).send(responseJson(1, 1, data, 'Blocked Mac-Address list fetched sucessfully!', {}, data.length, totalDataCount))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching blocked  mac-address list failed', e))
    }
}


exports.allowMacAddress = async (req, res) => {
    try {
        let {
            macAddress
        } = Object.assign(req.body)

        const requiredFields = {
            macAddress
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await AllowedMac.findOneAndUpdate({ macAddress }, { macAddress, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { upsert: true, new: true });
        res.status(200).send(responseJson(1, 1, data, 'Mac Address allowed sucessfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Allowing mac address failed', e))
    }
}

exports.removeAllowedMacAddress = async (req, res) => {
    try {
        let {
            macAddress
        } = Object.assign(req.body)

        const requiredFields = {
            macAddress
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await AllowedMac.deleteMany({ macAddress });;
        res.status(200).send(responseJson(1, 1, {}, 'Mac Address removed sucessfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Removing mac address failed', e))
    }
}

exports.getAllowedMacAddressList = async (req, res) => {
    try {
        let {
            macAddress,
            id,
            limit, page, skip
        } = Object.assign(req.query)

        const requiredFields = {

        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = {};
        if (macAddress) dbQuery.macAddress = macAddress;
        if (id) dbQuery._id = id;

        let data = await AllowedMac.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalDataCount = await AllowedMac.find(dbQuery).countDocuments();
        res.status(200).send(responseJson(1, 1, data, 'Allowed Mac-Address list fetched sucessfully!', {}, data.length, totalDataCount))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching allowed  mac-address list failed', e))
    }
}

exports.updateJobView = async (req, res) => {
    try {
        if (!req.body.jobId) throw { statusCode: 400, msg: "Please provide a valid job" };
        const user = req.user;
        console.log({ user })
        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (req.user.role == "admin") updateBody.isAdminViewed = 1;
        else if (req.user.role == "support") updateBody.isCSViewed = 1;
        console.log({ updateBody })
        let jobData = await Jobs.findOneAndUpdate({ _id: req.body.jobId }, { $set: updateBody }, { new: true })
        if (!jobData) throw { statusCode: 404, msg: "No job found!" }
        res.status(200).send(responseJson(1, 1, jobData, 'Job view updated sucessfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job view updation failed', e))
    }
}

exports.getDashboardData = async (req, res) => {
    try {

        let startDate = req.query.startDate;
        let endDate = req.query.endDate;

        if (!startDate) throw { statusCode: 400, msg: "Please provide start date!" }
        if (!endDate) throw { statusCode: 400, msg: "Please provide end date!" }

        startDate = `${moment(startDate).format("YYYY-MM-DD")}T00:00:00.000Z`;
        endDate = `${moment(endDate).format('YYYY-MM-DD')}T23:59:59.999Z`;

        console.log({ startDate, endDate })

        let [cooksCount, employersCount, jobsCount, salesCount, totalCooksCount, totalEmployersCount, totalClientsCount, totalJobApplicationsCount] = await Promise.all([
            Cook.find({ status: { $nin: [0] }, createdAt: { $gte: startDate, $lt: endDate } }).countDocuments(),
            Employer.find({ status: { $nin: [0] }, createdAt: { $gte: startDate, $lt: endDate } }).countDocuments(),
            Jobs.find({ createdAt: { $gte: startDate, $lt: endDate } }).countDocuments(),
            Transaction.find({ paymentStatus: 1, createdAt: { $gte: startDate, $lt: endDate } }).countDocuments(),
            Cook.find({ status: { $nin: [0] } }).countDocuments(),
            Employer.find({ status: { $nin: [0] }, memberType: 2 }).countDocuments(),
            Employer.find({ status: { $nin: [0] }, memberType: 1 }).countDocuments(),
            CookApplication.find({ jobId: { $exists: true }, createdAt: { $gte: startDate, $lt: endDate } }).countDocuments()
        ]);
        res.status(200).send(responseJson(1, 1, {
            totalUsersCount: cooksCount + employersCount,
            totalJobsCount: jobsCount,
            totalSalesCount: salesCount,
            totalCooksCount,
            totalEmployersCount,
            totalClientsCount,
            totalJobApplicationsCount
        }, 'Admin dashboard fetched successfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Admin dashboard fetching failed!', e))
    }
}

exports.addAdvertisement = async (req, res) => {
    try {
        let {
            usertype,
            image, status
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            usertype,
            image, status
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (usertype !== "chef" && usertype !== "housecook" && usertype !== "partycook" && usertype !== "catering" && usertype !== "employer" && usertype !== "client") throw { statusCode: 400, msg: "Please provide a valid usertype." }

        let data = await Advertisements.create({
            usertype,
            image, status,
            createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
        });
        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to add. Try again" }
        res.status(200).send(responseJson(1, 1, data, 'Advertisement added successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Advertisement adding failed', e))

    }
}

exports.getAdvtList = async (req, res) => {
    try {
        let {
            status,
            usertype,
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        if (usertype && usertype !== "chef" && usertype !== "housecook" && usertype !== "partycook" && usertype !== "catering" && usertype !== "employer" && usertype !== "client") throw { statusCode: 400, msg: "Please provide a valid usertype." }
        let dbQuery = {};
        if (id) dbQuery._id = id;
        if (usertype) dbQuery.usertype = usertype;
        if (status) dbQuery.status = status;

        let data = await Advertisements.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
        let totalDataCount = await Advertisements.find(dbQuery).countDocuments();

        res.status(200).send(responseJson(1, 1, data, 'Advertisement fetched successfully', {}, data.length, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Advertisement fetching failed', e))

    }
}

exports.editAdvertisement = async (req, res) => {
    try {
        let {
            usertype,
            image, status,
            id
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (usertype && usertype !== "chef" && usertype !== "housecook" && usertype !== "partycook" && usertype !== "catering" && usertype !== "employer" && usertype !== "client") throw { statusCode: 400, msg: "Please provide a valid usertype." }
        let data = await Advertisements.findOne({ _id: id });
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No data found!" }

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (image) updateBody.image = image;
        if (usertype) updateBody.usertype = usertype;
        if (status !== undefined && status !== null) updateBody.status = status;

        data = await Advertisements.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, data, 'Advertisements updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Advertisements updation failed', e))

    }
}

exports.deleteAdvertisement = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Advertisements.findOne({ _id: id });
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No data found!" }

        data = await Advertisements.findOneAndDelete({ _id: id });
        res.status(200).send(responseJson(1, 1, {}, 'Advertisements deleted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Advertisements deletion failed', e))
    }
}

exports.getAllCooksList = async (req, res) => {
    try {
        let {
            latitude, longitude,
            limit, page, skip,
            nameEmailOrMobile
        } = Object.assign(req.body, req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        let dbQueryFilters = { status: { $ne: 0 } };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] }
        const maxDistanceMeters = 200 * 1000;  //200 KM RADIUS
        if (nameEmailOrMobile) {
            let filter = [];
            let valueType = checkValueType(nameEmailOrMobile);
            if (valueType != "number") filter.push({ email: { $regex: nameEmailOrMobile, $options: "i" } }, { fullName: { $regex: nameEmailOrMobile, $options: "i" } });
            else if (valueType == "number") filter.push({ mobile: parseInt(nameEmailOrMobile) });
            dbQueryFilters.$or = filter;
        }

        let aggregateQuery = [];
        let facetQuery = {
            paginatedData: [],
            totalCount: [
                {
                    $count: "count",
                }
            ]
        }
        if (latitude && longitude) {
            aggregateQuery.push({
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distanceInMeters',
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    key: "cityCoordinates"
                }
            },)
        }

        //Applyong_Filters
        aggregateQuery.push(
            {
                $match: dbQueryFilters
            },
        )

        if (latitude && longitude) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    'distanceInMeters': 1,
                    'lastLoginDateTime': -1

                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    'lastLoginDateTime': -1
                }
            },)
        }

        //applying_pagination
        facetQuery.paginatedData.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            })

        //Combining in all Query
        aggregateQuery.push({
            $facet: facetQuery
        })


        let data = await Cook.aggregate(aggregateQuery);
        let totalDataCount = (data[0].totalCount.length && data[0].totalCount[0].count) ? data[0].totalCount.length && data[0].totalCount[0].count : 0;
        let paginatedDataCount = data[0].paginatedData.length;
        let paginatedData = data[0].paginatedData;
        if (paginatedData.length && latitude && longitude) {
            paginatedData = paginatedData.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, paginatedData, 'Cooks list fetched successfully', {}, paginatedDataCount, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cooks list fetch failed', e))
    }
}

exports.adminForgotPassword = async (req, res) => {
    try {

        let otp = generateOtp();
        let otpData = await AdminOtp.findOneAndUpdate({ isDeleted: false }, { otp, updatedAt: getCurrentDateAndTime() }, { new: true, upsert: true })

        sendMail({
            to: "ajay@cookandchef.in",
            cc: "sneha.sundrani@cookandchef.in",
            subject: 'Reset Password',
            type: 'adminForgot',
            options: {
                otp
            }
        })
        res.status(200).send(responseJson(1, 1, {}, 'OTP sent successfully to email!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Forgot password failed', e))
    }
}

exports.validateAdminForgotOtp = async (req, res) => {
    try {
        let {
            otp, password
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            otp, password

        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let isOtpValid = await AdminOtp.findOne({ otp });
        if (!isOtpValid) throw { statusCode: 422, msg: "Invalid OTP." }

        password = bcrypt.hashSync(password, 8);
        await Admin.updateMany({}, { password, updatedAt: getCurrentDateAndTime() }, { new: true })
        await AdminOtp.findOneAndDelete({ otp });

        res.status(200).send(responseJson(1, 1, {}, 'Password changed successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Password changing failed', e))
    }
}