let { privateKey, adminEmail, backendUrl, frontendUrl } = require('../config/config')
let appStatic = require('../config/appStatic.js').data
let { isValidDate, sendEmailOtp, generateMemberId, responseJson, sendWhatsappSms, generateWhatsappOtp, sendMail, isRequestDataValid, sendOtp, generateOtp, capitalizeEveryInnerWord, } = require('../utils/appUtils');
let { SharedProfiles, CookRatings, ClientRequirement, Cook, CookVerify, SmsLogs, Employer, EmployerVerify, ClientPoints, EmailVerify, EmployerActivity, EmployerPoints, CookApplication, EmployerReports, DisposalAccounts } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
let { registerOtp, updateMobileOtp, forgotPassword } = require("../utils/smsTemplates");
const { calculateCookAverages, isEmailAvailable, isMobileAvailable, getMobileData, checkRegistrationLimits, assignInitialFreePlan, isValidName, isWhatsappNumberAvailable, checkRegistrationMACLimit, checkLoginMACLimit, checkRegistrationMacAddress, checkLoginMacAddress } = require('../helpers/user');
const { getCurrentDateAndTime, addDaysToDate, isDateExpired } = require('../helpers/dates');
const { checkEmployerValidProfileViewPoints, checkEmployerValidJobPoints, checkClientValidHouseCookPoints, checkClientValidPartyCateringPoints, checkClientValidEventPoints, mergeEmployerDashboardData, mergeClientDashboardData } = require("../helpers/index");
const { isValidProvince, isValidLanguage, isValidQualification, isValidCuisine, checkIsProfileReportedOrNot } = require("../helpers/index")
var mongoose = require('mongoose');
const { getCookProfilePercent, getEmployerProfilePercent, getEmployerValidProfileViewPoints, getEmployerValidJobPoints, getClientValidHouseCookPoints, getClientValidPartyCateringPoints, getClientValidEventPoints,
    getClientValidPartyCateringPointsId, getEmployerValidProfileViewPointsId, getClientValidHouseCookPointsId, getEmployerActivePoints, getClientActivePoints } = require("../helpers/points");
const { sendJobApplicationNotification, sendBulkJobNotificationsToChef, sendBulkHouseJobNotifications } = require("../helpers/notification")

exports.employerRegister = async (req, res) => {
    try {

        let {
            memberType,
            fullName,
            gender,
            mobile,
            email,
            password,
            otp,
            message,
            memberCode,
            registerIP,
            registerMAC,
            loginIP,
            loginMAC,
            deviceToken,
            webAccess,
            appAccess
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            memberType,
            fullName,
            mobile,
            email,
            password,
            registerIP,
            registerMAC
        }

        if (memberType == 1) requiredFields.gender = gender;
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        const checkName = isValidName(fullName, memberType);
        if (checkName == false) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid name" }

        if (!webAccess && !appAccess) throw { statusCode: 400, responseCode: 0, msg: "Please provide appaccess or webaccess." }
        if ((webAccess == 0 && appAccess == 0) || (webAccess == 1 && appAccess == 1)) throw Error("WebAccess and Appaccess values cannot be same")

        await isEmailAvailable(email);
        await isMobileAvailable(mobile);
        await checkRegistrationLimits({ mobile, role: 'employer' })
        // await checkRegistrationMacAddress(registerMAC);
        password = bcrypt.hashSync(password, 8);
        memberCode = (memberType == 1) ? "client" : "employer";

        let dbBody = {
            memberType,
            fullName: capitalizeEveryInnerWord(fullName),
            gender,
            mobile,
            email,
            password,
            employeeMemberId: generateMemberId(memberCode),
            registerIP,
            registerMAC,
            loginIP: registerIP,
            loginMAC: registerMAC,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime(),
            passwordUpdateDateTime: getCurrentDateAndTime(),
            basicProfileStatus: 0
        };
        if (webAccess == 0 || webAccess == 1) dbBody.webAccess = webAccess;
        if (appAccess == 0 || appAccess == 1) dbBody.appAccess = appAccess;

        if (deviceToken) dbBody.deviceToken = deviceToken;

        let data = await Employer.create(dbBody);
        if (!data) throw { statusCode: 500, responseCode: 6, msg: "Unable to signup. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getEmployerProfilePercent(data);
        data = await Employer.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        otp = generateOtp();
        message = registerOtp(otp);
        let smsResponse = await sendOtp({ employerId: data._id, message, otp, type: 1, senderId: 'CKN CHF', templateId: 'Signup Auth', mobile, role: 'employer' })
        let emailResponse = await sendEmailOtp({ employerId: data._id, email, type: 1, sender: 'support@cookandchef.in', subject: 'Account Verification', role: 'employer' })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            email: data.email,
            mobile: data.mobile,
            employeeMemberId: data.employeeMemberId,
            profilePercent: data.profilePercent,
            id: data.id
        }, 'OTP Sent successfully to mobile number'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Signup  Failed', e))
    }
}

exports.changeMobileNumber = async (req, res) => {
    try {
        let {
            employerId,
            mobile,
            otp,
            message
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            employerId,
            mobile
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);


        let empData = await Employer.findOne({ _id: employerId });
        if (!empData) throw { statusCode: 500, responseCode: 6, msg: "Invalid employerId. Try with another!" }
        if (empData && empData.status !== 0) throw { statusCode: 500, responseCode: 3, msg: "Unable to change mobile number as account is already verified earlier" }

        //Change Mobile number validations
        await getMobileData(mobile);

        let data = await Employer.findOneAndUpdate({ _id: employerId }, { $set: { mobile, updatedAt: getCurrentDateAndTime() } }, { new: true });
        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to change mobile number. Try again!" }

        otp = generateOtp();
        message = registerOtp(otp);
        console.log({ otp, message })
        let smsResponse = await sendOtp({ employerId: data._id, message, otp, type: 2, senderId: 'CKNCHF', templateId: 'Signup Auth', mobile, role: 'employer' })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data.id,
            employeeMemberId: data.employeeMemberId,
            newMobile: mobile
        }, 'Mobile number changed and OTP sent successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Changing mobile number failed', e))
    }
}

exports.resendOtp = async (req, res) => {
    try {
        let {
            employerId,
            otp,
            message
        } = Object.assign(req.body, req.query, req.params)

        if (!employerId) throw { statusCode: 400, responseCode: 2, msg: "Please provide employerId" }
        const payload = Object.keys(req.body);
        if (payload.length > 1) throw { statusCode: 400, responseCode: 2, msg: "Invalid keys in payload" }

        let data = await Employer.findOne({ _id: employerId });
        if (!data) throw { statusCode: 500, responseCode: 6, msg: "Invalid employerId. Try with another!" }

        otp = generateOtp();
        message = registerOtp(otp);
        console.log({ otp, message })
        let smsResponse = await sendOtp({ employerId, message, otp, type: 2, senderId: 'CKNCHF', templateId: 'Signup Auth', mobile: data.mobile, role: 'employer' })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data.id,
            employeeMemberId: data.employeeMemberId,
            mobile: data.mobile
        }, 'OTP has been resent to your mobile number'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Failed to resend OTP. Try again!', e))
    }
}

exports.employerLogin = async (req, res) => {
    try {

        let {
            emailOrMobile,
            password,
            loginIP,
            loginMAC,
            deviceToken,
            webAccess,
            appAccess
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            password,
            emailOrMobile,
            loginIP,
            loginMAC
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (!webAccess && !appAccess) throw { statusCode: 400, responseCode: 0, msg: "Please provide appaccess or webaccess." }
        if ((webAccess == 0 && appAccess == 0) || (webAccess == 1 && appAccess == 1)) throw Error("WebAccess and Appaccess values cannot be same")

        let dbQuery = { status: { $in: [1, 2, 3, 4] } };
        const phoneNumberPattern = /^[0-9]{10}$/;
        if (!phoneNumberPattern.test(emailOrMobile)) dbQuery.email = emailOrMobile.toLowerCase();
        else if (phoneNumberPattern.test(emailOrMobile)) dbQuery.mobile = emailOrMobile;

        let updateQuery = {
            loginIP, loginMAC, updatedAt: getCurrentDateAndTime(), lastLoginDateTime: getCurrentDateAndTime()
        };
        if (deviceToken) updateQuery.deviceToken = deviceToken;
        if (webAccess == 0 || webAccess == 1) updateQuery.webAccess = webAccess;
        if (appAccess == 0 || appAccess == 1) updateQuery.appAccess = appAccess;

        let data = await Employer.findOneAndUpdate(dbQuery, { $set: updateQuery }, { new: true });
        data = JSON.parse(JSON.stringify(data));
        if (!data) throw { statusCode: 401, responseCode: 5, msg: "No account found. Try signup!" }
        if (data && data.status == 3) throw { statusCode: 403, responseCode: 3, msg: "Your account is suspended. Contact support!" }
        if (data && data.status == 0) throw { statusCode: 403, responseCode: 4, msg: "Your account is not verified .Try register again!" }

        const isPasswordMatch = bcrypt.compareSync(password, data.password);
        if (!isPasswordMatch) throw { statusCode: 401, responseCode: 6, msg: "Invalid password. Try again!" }

        //Checking MAC address limit
        // await checkLoginMacAddress(loginMAC, data._id);
        data.token = jwt.sign({ id: data._id }, privateKey, { expiresIn: 60 * 60 * 24 * 365 });


        res.status(200).send(responseJson(1, 1, {
            fullName: data.fullName,
            role: (data.memberType == 1) ? "client" : "employer",
            status: data.status,
            profilePercent: data.profilePercent,
            email: data.email,
            mobile: data.mobile,
            employeeMemberId: data.employeeMemberId,
            id: data.id,
            mobileVerified: data.mobileVerified,
            emailVerified: data.emailVerified,
            whatsappNumberVerified: data.whatsappNumberVerified,
            memberType: data.memberType,
            basicProfileStatus: data.basicProfileStatus,
            weavyId: data.weavyId,
            token: data.token
        }, 'Logged in successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Login failed', e))
    }
}



exports.verifyEmployerOtp = async (req, res) => {
    try {

        let {
            employerId,
            otp
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            employerId,
            otp
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Employer.findOne({ _id: employerId, status: 0 });
        data = JSON.parse(JSON.stringify(data));
        if (!data) throw { statusCode: 500, responseCode: 4, msg: "Invalid employerId or account is already verified. Try again!" }

        let otpResp = await EmployerVerify.findOne({ employerId, otp });
        if (!otpResp) throw { statusCode: 422, responseCode: 3, msg: "Invalid OTP" }

        // await checkRegistrationMacAddress(data.registerMAC, employerId);

        data = await Employer.findOneAndUpdate({ _id: employerId }, { $set: { mobileVerified: 1, status: 1, lastLoginDateTime: getCurrentDateAndTime() } }, { new: true })
        if (data.memberType == 1) await assignInitialFreePlan({ userId: data._id, memberType: 1 })

        data.token = jwt.sign({ id: data._id }, privateKey, { expiresIn: 60 * 60 * 24 * 365 });

        sendMail({
            to: data.email,
            subject: 'Welcome to CookandChef!',
            type: "employer",
            options: {
                username: data.fullName
            }
        })


        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            role: (data.memberType == 1) ? "client" : "employer",
            email: data.email,
            fullName: data.fullName,
            mobile: data.mobile,
            employeeMemberId: data.employeeMemberId,
            memberType: data.memberType,
            id: data.id,
            mobileVerified: data.mobileVerified,
            emailVerified: data.emailVerified,
            basicProfileStatus: data.basicProfileStatus,
            token: data.token,
            profilePercent: data.profilePercent,
            weavyId: data.weavyId
        }, 'OTP verified successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'OTP verification failed', e))
    }
}

exports.getEmployerProfile = async (req, res) => {
    try {

        let data = await Employer.findOne({ _id: req.user._id });
        data = JSON.parse(JSON.stringify(data));
        if (data.memberType == 2) {
            let [jobpointsData, profilepointsData] = await Promise.all([
                getEmployerValidJobPoints(req.user._id),
                getEmployerValidProfileViewPoints(req.user._id)]);
            data.pointsData = {
                currentJobPoints: (jobpointsData) ? jobpointsData.currentJobPoints : 0,
                currentProfileViewPoints: (profilepointsData) ? profilepointsData.currentProfileViewPoints : 0
            }
        }
        if (data.memberType == 1) {
            let [eventPoints, houseCookPoints, partyCateringPoints] = await Promise.all([
                getClientValidEventPoints(req.user._id),
                getClientValidHouseCookPoints(req.user._id),
                getClientValidPartyCateringPoints(req.user._id)
            ])

            data.pointsData = {
                currentEventPoints: (eventPoints) ? eventPoints.currentEventPoints : 0,
                currentHouseCookPoints: (houseCookPoints) ? houseCookPoints.currentHouseCookPoints : 0,
                currentPartyCateringPoints: (partyCateringPoints) ? partyCateringPoints.currentPartyCateringPoints : 0
            }
        }
        res.status(200).send(responseJson(1, 1, data, 'Fetched profile successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetch profile failed', e))
    }
}

exports.editEmployer = async (req, res) => {
    try {
        let {
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
        const user = req.user;

        let updateBody = { updatedAt: getCurrentDateAndTime(), basicProfileStatus: 1 };
        if (fullName) {
            const checkName = isValidName(fullName, user.memberType);
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

        if (user.memberType == 2) {
            if (propertyType !== null && propertyType !== undefined) updateBody.propertyType = propertyType;
            if (contactPerson !== null && contactPerson !== undefined) updateBody.contactPerson = contactPerson;
            if (contactPersonMobile !== null && contactPersonMobile !== undefined) updateBody.contactPersonMobile = contactPersonMobile;
            if (fssai !== null && fssai !== undefined) updateBody.fssai = fssai;
            if (website !== null && website !== undefined) updateBody.website = website;
            if (establishmentYear !== null && establishmentYear !== undefined) updateBody.establishmentYear = establishmentYear;
            if (employeesCount !== null && employeesCount !== undefined) updateBody.employeesCount = employeesCount;
        }

        else if (user.memberType == 1) {
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

        let data = await Employer.findOneAndUpdate({ _id: user._id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to update. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        if (data.memberType == 1) {
            requirementsData = await ClientRequirement.findOne({ clientId: req.user._id, isDeleted: false });
            data = { ...data, ...requirementsData }
        }
        let profilePercent = getEmployerProfilePercent(data);
        data = await Employer.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        res.status(200).send(responseJson(1, 1, data, 'Profile updated successfully! '))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updation failed', e))
    }
}

exports.addClientRequirements = async (req, res) => {
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
            status

        } = Object.assign(req.body, req.query, req.params)
        if (lunch == 0 && dinner == 0 && breakfast == 0) throw Error("Among Breakfast,lunch,dinner must select one")
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }
        let body = {
            clientId: req.user._id,
            cuisines,
            jobType,
            minimumPayment,
            urgency,
            breakfast,
            lunch,
            dinner,
            vesselWash,
            expiryDate: addDaysToDate(45),
            updatedAt: getCurrentDateAndTime(),
            preferredGender,
            isDeleted: false,

        };


        let data = await ClientRequirement.findOne({ clientId: req.user._id });
        if (!data) body.createdAt = getCurrentDateAndTime();
        body.status = (status == 1 || status == 2 || status == 0) ? status : 1;
        data = await ClientRequirement.findOneAndUpdate({ clientId: req.user._id }, { $set: body }, { new: true, upsert: true, setDefaultsOnInsert: true });
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to post requirement. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let housejobId = data._id;

        //Profile_Percent_Updation
        if (req.user.memberType == 1) {
            data = { ...req.user._doc, ...data }
        }
        let profilePercent = getEmployerProfilePercent(data);
        data = await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));
        //Sending_notifications
        if (req.user.areaCoordinates && req.user.area) await sendBulkHouseJobNotifications({ longitude: req.user.areaCoordinates.coordinates[0], latitude: req.user.areaCoordinates.coordinates[1], jobAreaName: req.user.area, requirementId: housejobId });
        res.status(200).send(responseJson(1, 1, data, 'Requirement added successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Requirement adding failed', e))
    }
}

exports.getClientRequirement = async (req, res) => {
    try {

        let {
            limit, page, skip,
            id
        } = Object.assign(req.body, req.query, req.params)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbFilters = { clientId: req.user._id };
        if (id) dbFilters._id = mongoose.Types.ObjectId(id);

        // let data = await ClientRequirement.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip);
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

        let totalData = await ClientRequirement.aggregate(aggregateQuery);

        //Applying_pagination
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            })
        let data = await ClientRequirement.aggregate(aggregateQuery)
        res.status(200).send(responseJson(1, 1, data, 'Requirements fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Requirements fetching failed', e))

    }
}


exports.fetchChefs = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            minimumExperience, maximumExperience, cuisines,
            minimumSalary, maximumSalary, skills
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        minimumExperience = parseFloat(minimumExperience);
        maximumExperience = parseFloat(maximumExperience);
        minimumSalary = parseFloat(minimumSalary);
        maximumSalary = parseFloat(maximumSalary);

        //Employer_Points_Validations
        // let employerPlanData = await checkEmployerValidProfileViewPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Try subscription!" }
        if (cuisines && cuisines.length) await isValidCuisine(cuisines);
        if (!cuisines || !cuisines.length) cuisines = [];

        //Paginations
        limit = limit ? parseInt(limit) : 5;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilters = { memberType: 1, cookType: 2, status: 1, chefProfileStatus: 1 };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 500 * 1000;  //500 KM RADIUS

        //Filterings
        if (minimumSalary !== null && minimumSalary !== undefined && maximumSalary && maximumSalary != 100000) dbQueryFilters.expectedSalary = { $gte: minimumSalary, $lte: maximumSalary };
        if (minimumSalary !== null && minimumSalary !== undefined && maximumSalary && maximumSalary == 100000) dbQueryFilters.expectedSalary = { $gte: minimumSalary };
        if (minimumExperience !== null && minimumSalary !== undefined && maximumExperience) dbQueryFilters.chefExperience = { $gte: minimumExperience, $lte: maximumExperience };
        console.log(dbQueryFilters)
        if (cuisines) dbQueryFilters.$or = [
            { chefCuisines: { $in: cuisines } },
            { skills: { $elemMatch: { $regex: new RegExp(cuisines, "i") } } }];
        if (skills) dbQueryFilters.$or = [
            { skills: { $elemMatch: { $regex: new RegExp(skills, "i") } } },
            { about: { $regex: new RegExp(skills, "i") } }];


        //Aggregation_Staging_Process   
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
            aggregateQuery.push({
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distanceInMeters',
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    key: 'currentCityCoordinates'
                }
            },)
        }

        //remaining_pipelines
        aggregateQuery.push(
            {
                $lookup: {
                    from: "employerreports",
                    let: { cookId: "$_id" },
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
                    ...dbQueryFilters,
                    "reportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'viewed'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'chef'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'activitiesData'
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'shortlisted'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'chef'] },
                                        { $gt: ['$expiresAt', getCurrentDateAndTime()] }
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
                    shortlistData: {
                        $cond: {
                            if: { $gt: [{ $size: '$shortlistData' }, 0] },
                            then: { $arrayElemAt: ['$shortlistData', 0] },
                            else: null
                        }
                    },
                    isViewed: {
                        $cond: {
                            if: { $gt: [{ $size: '$activitiesData' }, 0] },
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
                },
            },
        );

        //Pushing to facet
        facetQuery.paginatedData.push({
            $project: {
                _id: 1,
                fullName: 1,
                dp: 1,
                chefCuisines: 1,
                currentCityName: 1,
                chefExperience: 1,
                expectedSalary: 1,
                lastLoginDateTime: 1,
                distanceInMeters: 1,
                isViewed: 1,
                isShortlisted: 1,
                shortlistData: 1,
                currentCityCoordinates: 1,
                profilePercent: 1,
                profileBoostRank: 1,
                chefProfileStatus: 1,
                userPlan: 1,
                matchingCuisines: {
                    $size: {
                        $setIntersection: ['$chefCuisines', cuisines],
                    },
                }
            }
        },)

        if (latitude && longitude) {
            //Sorting By distance
            facetQuery.paginatedData.push({
                $sort: {
                    distanceInMeters: 1,
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1,
                }
            },)
        }

        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            facetQuery.paginatedData.push({
                $sort: {
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1
                }
            },)
        }

        if (cuisines && cuisines.length) {
            let cuisinesSorting = { matchingCuisines: -1 }
            if (latitude && longitude) cuisinesSorting.distanceInMeters = 1;
            cuisinesSorting.lastLoginDateTime = -1;
            cuisinesSorting.profileBoostRank = -1;

            facetQuery.paginatedData.push({
                $sort: cuisinesSorting
            },)
        }

        //applying_pagination
        facetQuery.paginatedData.push(
            {
                $skip: skip,
            },
            {
                $limit: limit,
            })

        aggregateQuery.push({
            $facet: facetQuery
        })

        let data = await Cook.aggregate(aggregateQuery);
        data = JSON.parse(JSON.stringify(data));
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
        res.status(200).send(responseJson(1, 1, paginatedData, 'Chefs fetched successfully', {}, paginatedDataCount, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Chefs fetching failed', e))
    }
}

exports.fetchPartyCooks = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            cuisines
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        //Employer_Points_Validations
        // let employerPlanData = await checkClientValidPartyCateringPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Please purchase plan to continue!" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }


        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilters = { memberType: 1, partyCook: 1, status: 1, partyCookProfileStatus: 1 };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 100 * 1000;  //100 KM RADIUS

        //Filterings
        if (cuisines) dbQueryFilters.partyCuisines = { $in: cuisines }

        let aggregateQuery = [];
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
                $lookup: {
                    from: "employerreports",
                    let: { cookId: "$_id" },
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
                    ...dbQueryFilters,
                    "reportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'viewed'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'partycook'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'activitiesData'
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'shortlisted'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'partycook'] },
                                        { $gt: ['$expiresAt', getCurrentDateAndTime()] }
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
                    shortlistData: {
                        $cond: {
                            if: { $gt: [{ $size: '$shortlistData' }, 0] },
                            then: { $arrayElemAt: ['$shortlistData', 0] },
                            else: null
                        }
                    },
                    isViewed: {
                        $cond: {
                            if: { $gt: [{ $size: '$activitiesData' }, 0] },
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
                },
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    dp: 1,
                    partyCuisines: 1,
                    currentCityName: 1,
                    chefExperience: 1,
                    partyCookFoodType: 1,
                    partyExperience: 1,
                    lastLoginDateTime: 1,
                    distanceInMeters: 1,
                    isViewed: 1,
                    isShortlisted: 1,
                    shortlistData: 1,
                    profilePercent: 1,
                    userPlan: 1,
                    profileBoostRank: 1,
                    partyCookProfileStatus: 1,
                    cityName: 1

                }
            },
        )
        let totalData = await Cook.aggregate(aggregateQuery);

        if (latitude && longitude) {
            //Sorting By distance
            aggregateQuery.push({
                $sort: {
                    distanceInMeters: 1,
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1
                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            aggregateQuery.push({
                $sort: {
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1
                }
            },)
        }

        //Applying_Pagination
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        );

        let data = await Cook.aggregate(aggregateQuery);
        data = JSON.parse(JSON.stringify(data));
        if (latitude && longitude) {
            data = data.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, data, 'Party cooks fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Party cooks fetch failed', e))
    }
}



exports.fetchCaterings = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            cuisines
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        //Employer_Points_Validations
        // let employerPlanData = await checkClientValidPartyCateringPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Please purchase plan to continue!" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilter = { memberType: 2, status: 1, cateringProfileStatus: 1 };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 500 * 1000;  //100 KM RADIUS

        //Filterings
        if (cuisines) dbQueryFilter.cateringCuisines = { $in: cuisines }
        let aggregateQuery = [];
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
                $lookup: {
                    from: "employerreports",
                    let: { cookId: "$_id" },
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
                    ...dbQueryFilter,
                    "reportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'viewed'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'catering'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'activitiesData'
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'shortlisted'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'catering'] },
                                        { $gte: ['$expiresAt', getCurrentDateAndTime()] }
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
                    shortlistData: {
                        $cond: {
                            if: { $gt: [{ $size: '$shortlistData' }, 0] },
                            then: { $arrayElemAt: ['$shortlistData', 0] },
                            else: null
                        }
                    },
                    isViewed: {
                        $cond: {
                            if: { $gt: [{ $size: '$activitiesData' }, 0] },
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
                },
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    dp: 1,
                    cateringCuisines: 1,
                    currentCityName: 1,
                    cateringFoodType: 1,
                    lastLoginDateTime: 1,
                    distanceInMeters: 1,
                    isViewed: 1,
                    isShortlisted: 1,
                    shortlistData: 1,
                    cateringProfileStatus: 1,
                    userPlan: 1,
                    profileBoostRank: 1,
                    profilePercent: 1,
                    cityName: 1
                }
            },
        )
        let totalData = await Cook.aggregate(aggregateQuery);

        if (latitude && longitude) {
            //Sorting By distance
            aggregateQuery.push({
                $sort: {
                    distanceInMeters: 1,
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1
                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            aggregateQuery.push({
                $sort: {
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1
                }
            },)
        }

        //Applying_Paginations
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        );


        let data = await Cook.aggregate(aggregateQuery);
        data = JSON.parse(JSON.stringify(data));
        if (latitude && longitude) {
            data = data.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, data, 'Caterings fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Catering fetch failed', e))
    }
}


exports.fetchHouseCooks = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            payment, gender, jobType,
            cuisines
        } = Object.assign(req.body, req.query)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        jobType = parseFloat(jobType);
        gender = parseFloat(gender);

        //Employer_Points_Validations
        // let employerPlanData = await checkClientValidHouseCookPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Please purchase plan to continue!" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //DB_Query
        let dbQueryFilter = { memberType: 1, cookType: 1, status: 1, houseCookProfileStatus: 1 };
        const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
        const maxDistanceMeters = 20 * 1000;  //20 KM RADIUS

        //Filterings
        if (jobType == 1 || jobType == 2) dbQueryFilter.jobType = jobType;
        if (jobType == 3) dbQueryFilter.jobType = { $in: [1, 2, 3] };
        if (gender && gender != 4) dbQueryFilter.gender = gender;
        if (gender && gender == 4) dbQueryFilter.gender = { $in: [1, 2, 3] };
        if (payment) dbQueryFilter.payment = payment;
        if (cuisines) dbQueryFilter.householdCuisines = { $in: cuisines }

        console.log({ dbQueryFilter })
        let aggregateQuery = [];
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
                $lookup: {
                    from: "employerreports",
                    let: { cookId: "$_id" },
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
                    ...dbQueryFilter,
                    "reportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'viewed'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'housecook'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'activitiesData'
                }
            },
            {
                $lookup: {
                    from: 'employeractivities',
                    let: { cookId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                        { $eq: ['$activity', 'shortlisted'] },
                                        { $eq: ['$cookId', '$$cookId'] },
                                        { $eq: ['$cookType', 'housecook'] },
                                        { $gte: ['$expiresAt', getCurrentDateAndTime()] }
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
                    shortlistData: {
                        $cond: {
                            if: { $gt: [{ $size: '$shortlistData' }, 0] },
                            then: { $arrayElemAt: ['$shortlistData', 0] },
                            else: null
                        }
                    },
                    isViewed: {
                        $cond: {
                            if: { $gt: [{ $size: '$activitiesData' }, 0] },
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
                },
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    dp: 1,
                    householdCuisines: 1,
                    currentCityName: 1,
                    area: 1,
                    payment: 1,
                    gender: 1,
                    lastLoginDateTime: 1,
                    distanceInMeters: 1,
                    isViewed: 1,
                    isShortlisted: 1,
                    shortlistData: 1,
                    profilePercent: 1,
                    profileBoostRank: 1,
                    userPlan: 1,
                    houseCookProfileStatus: 1,
                    cityName: 1,
                    provinceName: 1
                }
            },
        );
        let totalData = await Cook.aggregate(aggregateQuery);

        if (latitude && longitude) {
            //Sorting By distance
            aggregateQuery.push({
                $sort: {
                    distanceInMeters: 1,
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1
                }
            },)
        }
        else if (!latitude || !longitude) {

            //Sorting for Non-Location Payload
            aggregateQuery.push({
                $sort: {
                    profileBoostRank: -1,
                    lastLoginDateTime: -1,
                    profilePercent: -1,
                    userPlan: -1
                }
            },)
        }

        //Applying_Paginations
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            }
        );


        let data = await Cook.aggregate(aggregateQuery);
        data = JSON.parse(JSON.stringify(data));
        if (latitude && longitude) {
            data = data.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        res.status(200).send(responseJson(1, 1, data, 'House cooks fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'House cooks fetching failed', e))
    }
}


exports.updateWhatsappNumber = async (req, res) => {
    try {

        let {
            whatsappNumber
        } = Object.assign(req.body, req.query)


        // await isWhatsappNumberAvailable(whatsappNumber);
        let otp = generateWhatsappOtp();
        let whatsappNumberSmsData = await sendWhatsappSms({
            role: "employer",
            otp,
            employerId: req.user._id,
            countryCode: "+91",
            phoneNumber: whatsappNumber,
            type: "Template",
            template: {
                name: "verify_number",
                languageCode: "en",
                bodyValues: [
                    `${req.user.fullName}`,
                    "whatsapp verification OTP",
                    `${otp}`
                ]
            }
        })
        if (whatsappNumberSmsData == false) throw { statusCode: 500, responseCode: 6, msg: "Unable to send OTP to whatsapp. Try again!" }
        if (whatsappNumberSmsData == true) {
            res.status(200).send(responseJson(1, 1, { whatsappNumber }, 'OTP sent successfully to whatsapp number'))
        }
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Unable to send OTP to whatsapp', e))
    }
}

exports.verifyWhatsappOtp = async (req, res) => {
    try {

        let {
            whatsappNumber,
            otp,
            requirementsData
        } = Object.assign(req.body, req.query)


        let otpData = await EmployerVerify.findOne({ whatsapp: whatsappNumber, otp, employerId: req.user._id });
        if (!otpData) throw { statusCode: 422, responseCode: 5, msg: "Invalid OTP" };

        await Cook.updateMany({ whatsappNumber }, { $unset: { whatsappNumber: "" }, $set: { whatsappNumberVerified: 0 } }, { multi: true })
        await Employer.updateMany({ whatsappNumber }, { $unset: { whatsappNumber: "" }, $set: { whatsappNumberVerified: 0 } }, { multi: true })

        let data = await Employer.findOneAndUpdate({ _id: req.user._id }, { whatsappNumber, whatsappNumberVerified: 1 }, { new: true });
        data = JSON.parse(JSON.stringify(data));
        if (data.memberType == 1) {
            requirementsData = await ClientRequirement.findOne({ clientId: req.user._id, isDeleted: false });
            requirementsData = JSON.parse(JSON.stringify(requirementsData));
            data = { ...data, ...requirementsData }
        }
        let profilePercent = getEmployerProfilePercent(data);
        data = await Employer.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        res.status(200).send(responseJson(1, 1, { whatsappNumber, employerId: req.user._id, whatsappNumberVerified: 1 }, 'Whatsapp number updated succesfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Unable to update whatsapp number', e))

    }
}

exports.updateLoginTime = async (req, res) => {
    try {

        const user = req.user;
        let data = await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { lastLoginDateTime: getCurrentDateAndTime() } }, { new: true });
        res.status(200).send(responseJson(1, 1, { id: req.user._id, lastLoginDateTime: data.lastLoginDateTime }, 'Last login time updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Unable to update logintime', e))

    }
}


exports.updateMobileNumber = async (req, res) => {
    try {
        let {
            mobile
        } = Object.assign(req.body, req.query, req.params)

        let cookMobileData = await Cook.findOne({ mobile: mobile, status: { $ne: 0 } })
        let empMobileData = await Employer.findOne({ mobile: mobile, status: { $ne: 0 } })
        if (empMobileData && (empMobileData._id).toString() == (req.user._id).toString()) throw { statusCode: 400, responseCode: 2, msg: "Please provide new mobile number to update" }
        if (cookMobileData || (empMobileData && (empMobileData._id).toString() != (req.user._id).toString())) throw { statusCode: 409, responseCode: 4, msg: "This phone number is associated with an account.  Please try with another!" }

        otp = generateOtp();
        message = updateMobileOtp(otp);
        console.log({ otp, message })
        let smsResponse = await sendOtp({ employerId: req.user._id, message, otp, type: 5, senderId: 'CKNCHF', templateId: 'Verify Number', mobile, role: 'employer' })

        res.status(200).send(responseJson(1, 1, {
            status: req.user.status,
            id: req.user._id,
            employeeMemberId: req.user.employeeMemberId,
            newMobile: mobile
        }, 'OTP has been sent to your updated mobile number'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Changing mobile number failed', e))
    }
}

exports.verifyNewMobileNumberOtp = async (req, res) => {
    try {
        let {
            mobile,
            otp
        } = Object.assign(req.body, req.query, req.params)

        let cookMobileData = await EmployerVerify.findOne({ mobile, otp, employerId: req.user._id })
        if (!cookMobileData) throw { statusCode: 422, responseCode: 4, msg: "Invalid OTP" }

        let data = await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { mobile } }, { new: true })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data._id,
            employeeMemberId: data.employeeMemberId,
            mobile: data.mobile
        }, 'OTP verified and new mobile number updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Updating mobile number failed', e))
    }
}

exports.forgotPassword = async (req, res) => {
    try {

        let {
            email,
            mobile,
            message
        } = Object.assign(req.body, req.query, req.params)

        let data = await Employer.findOne({ mobile, email, status: { $in: [1, 2, 3, 4] } });
        if (!data) throw { statusCode: 500, responseCode: 6, msg: "No account found" }
        if (data.status == 3) throw { status: 403, responseCode: 0, msg: "Your account has been suspended. Contact support." }

        otp = generateOtp();
        message = forgotPassword(otp);
        console.log({ otp, message })
        let smsResponse = await sendOtp({ cookId: data._id, message, otp, type: 4, senderId: 'CKNCHF', templateId: 'Reset Password CookandChef', mobile: mobile, role: 'employer' })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data._id,
            cookMemberId: data.cookMemberId,
            mobile: data.mobile
        }, 'OTP sent successfully to mobile number'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Unable to send OTP', e))
    }
}

exports.verifyOtpAndUpdatePassword = async (req, res) => {
    try {

        let {
            mobile,
            otp,
            newPassword
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            mobile,
            otp,
            newPassword
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        //Otp Verification
        let otpResp = await EmployerVerify.findOne({ mobile, otp });
        if (!otpResp) throw { statusCode: 422, responseCode: 3, msg: "Invalid OTP " }
        newPassword = await bcrypt.hashSync(newPassword, 8);

        let data = await Employer.findOneAndUpdate({ _id: otpResp.employerId }, {
            $set: {
                updatedAt: getCurrentDateAndTime(),
                passwordUpdateDateTime: getCurrentDateAndTime(),
                password: newPassword
            }
        }, { new: true })
        res.status(200).send(responseJson(1, 1, {}, 'Password changed successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Password changing failed', e))
    }
}

exports.changeEmail = async (req, res) => {
    try {

        let {
            email
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            email
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        await isEmailAvailable(email, 1);
        await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { email, emailVerified: 0 } }, { new: true })
        let data = await EmailVerify.create({
            email,
            employerId: req.user._id,
            status: 1,
            updatedAt: getCurrentDateAndTime(),
            createdAt: getCurrentDateAndTime()
        })

        sendMail({
            to: email,
            subject: 'Email verification',
            type: 'emailverification',
            options: {
                id: data._id,
                email,
                role: 'employer',
                verificationLink: `${backendUrl}/api/v1/cook/login/updateEmailVerificationStatus?id=${data._id}&role=employer`
            }
        })
        res.status(200).send(responseJson(1, 1, { email, userId: req.user._id }, 'Verification link has been sent to your email'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Email changing failed', e))
    }
}

exports.verifyEmail = async (req, res) => {
    try {

        let data = await EmailVerify.create({
            email: req.user.email,
            employerId: req.user._id,
            status: 1,
            updatedAt: getCurrentDateAndTime(),
            createdAt: getCurrentDateAndTime()
        })

        sendMail({
            to: req.user.email,
            subject: 'Email verification',
            type: 'emailverification',
            options: {
                id: data._id,
                email: req.user.email,
                role: 'employer',
                verificationLink: `${backendUrl}/api/v1/cook/login/updateEmailVerificationStatus?id=${data._id}&role=employer`
            }
        })
        res.status(200).send(responseJson(1, 1, {
            email: req.user.email,
            cookId: req.user._id
        }, 'Verification link has been sent to your email'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Email verification failed', e))
    }
}

exports.getCookDetails = async (req, res) => {
    try {

        let {
            id,
            cookType,
            pointsData,
            activePoints,
            pointsUpdateBody,
            updateModelName,
            dbBody,
            pointsKey,
            logData
        } = Object.assign(req.query)

        let requiredFields = {
            id
        }

        console.log({ _id: req.user._id })

        if (req.user.memberType == 1) requiredFields.cookType = cookType;
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        await checkIsProfileReportedOrNot({ cookId: id, employerId: req.user._id });
        dbBody = { _id: id, status: 1 }
        if (req.user.memberType == 2) dbBody.cookType = 2, cookType = "chef";
        if (req.user.memberType == 1) {
            if (cookType !== "catering" && cookType != "housecook" && cookType != "partycook") throw { statusCode: 500, responseCode: 2, msg: "Please provide valid value for cookType" }
            if (cookType == "housecook") dbBody.cookType = 1;
            if (cookType == "partycook") dbBody.partyCook = 1;
            if (cookType == "catering") dbBody.memberType = 2;
        }

        let currentPoints = 0;
        let data = await Cook.findOne(dbBody);
        if (!data) throw { statusCode: 400, reponseCode: 5, msg: "Invalid id" }
        data = JSON.parse(JSON.stringify(data));
        let body = { cookId: id, employerId: req.user._id, activity: 'viewed', isDeleted: false }

        //Desiging Body
        if (data.memberType == 1 && req.user.memberType == 1 && cookType == "housecook") {
            pointsData = await getClientValidHouseCookPointsId(req.user._id);
            activePoints = await getClientActivePoints(req.user._id);
            body.clientPointsId = (pointsData) ? pointsData._id : null;
            body.cookType = "housecook";
            pointsUpdateBody = { currentHouseCookPoints: -1 };
            updateModelName = ClientPoints;
            currentPoints = (pointsData) ? pointsData.currentHouseCookPoints : 0
        }
        if (data.memberType == 2 && req.user.memberType == 1 && cookType == "catering") {
            pointsData = await getClientValidPartyCateringPointsId(req.user._id);
            activePoints = await getClientActivePoints(req.user._id);
            body.clientPointsId = (pointsData) ? pointsData._id : null;
            body.cookType = "catering";
            pointsUpdateBody = { currentPartyCateringPoints: -1 };
            updateModelName = ClientPoints;
            currentPoints = (pointsData) ? pointsData.currentPartyCateringPoints : 0
        }
        if (data.memberType == 1 && req.user.memberType == 1 && cookType == "partycook") {
            pointsData = await getClientValidPartyCateringPointsId(req.user._id);
            activePoints = await getClientActivePoints(req.user._id);
            body.clientPointsId = (pointsData) ? pointsData._id : null;
            body.cookType = "partycook";
            pointsUpdateBody = { currentPartyCateringPoints: -1 };
            updateModelName = ClientPoints;
            currentPoints = (pointsData) ? pointsData.currentPartyCateringPoints : 0
        }
        if (data.memberType == 1 && req.user.memberType == 2 && data.cookType == 2) {
            pointsData = await getEmployerValidProfileViewPointsId(req.user._id);
            activePoints = await getEmployerActivePoints(req.user._id);
            body.employerPointsId = (pointsData) ? pointsData._id : null;
            body.cookType = "chef";
            pointsUpdateBody = { currentProfileViewPoints: -1 };
            updateModelName = EmployerPoints;
            currentPoints = (pointsData) ? pointsData.currentProfileViewPoints : 0
        }

        //Initial Count setting
        let previousViewedCount = 0;
        if (activePoints.length) {
            let initialDbQuery = JSON.parse(JSON.stringify(body));
            if (req.user.memberType == 2) initialDbQuery.employerPointsId = { $in: activePoints };
            if (req.user.memberType == 1) initialDbQuery.clientPointsId = { $in: activePoints };
            initialDbQuery = JSON.parse(JSON.stringify(initialDbQuery))
            let previousViewedData = await EmployerActivity.find(initialDbQuery).sort({ createdAt: -1 });
            previousViewedCount = previousViewedData.length;
            if (previousViewedCount > 0 && req.user.memberType == 2) body.employerPointsId = previousViewedData[0].employerPointsId;
            if (previousViewedCount > 0 && req.user.memberType == 1) body.clientPointsId = previousViewedData[0].clientPointsId;

        }
        if ((!activePoints.length) || (activePoints.length && previousViewedCount <= 0)) {
            logData = await EmployerActivity.findOne(body);
            if (!logData && !pointsData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Try subscription!" }
            if (!logData && pointsData && currentPoints <= 0) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Please purchase plan to continue!" }
            if (!logData && pointsData && currentPoints > 0) await updateModelName.findOneAndUpdate({ _id: pointsData._id }, { $inc: pointsUpdateBody }, { new: true })
            logData = await EmployerActivity.create({ ...body, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), expiresAt: pointsData.planExpiresAt, cookType: (cookType) ? cookType : "chef" });
        }
        body.activity = "shortlisted";
        let shortlistData = await EmployerActivity.findOne(body);
        let ratingsData = await CookRatings.find({ cookId: id }).select({ _id: 0, createdAt: 0, updatedAt: 0, cookId: 0, employerId: 0 });
        ratingsData = JSON.parse(JSON.stringify(ratingsData));
        data.ratingsData = calculateCookAverages(ratingsData);
        data.ratingsList = await CookRatings.find({ cookId: id }).populate([{ path: 'employerId', select: 'fullName dp' }]).sort({ createdAt: -1 });
        data.isViewed = true;
        data.isShortlisted = (shortlistData) ? true : false;
        data.shortlistData = (shortlistData) ? shortlistData : null;
        res.status(200).send(responseJson(1, 1, data, 'Cook details fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cook details fetching failed', e))
    }
}

exports.shortlistCookProfile = async (req, res) => {
    try {

        let {
            id,
            cookType,
            pointsData,
            pointsUpdateBody,
            updateModelName,
            dbBody
        } = Object.assign(req.body)

        let requiredFields = {
            id
        }

        if (req.user.memberType == 1) requiredFields.cookType = cookType;
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        await checkIsProfileReportedOrNot({ cookId: id, employerId: req.user._id });

        dbBody = { _id: id, status: 1 }
        if (req.user.memberType == 2) dbBody.cookType = 2, cookType = "chef";
        if (req.user.memberType == 1) {
            if (cookType !== "catering" && cookType != "housecook" && cookType != "partycook") throw { statusCode: 500, responseCode: 2, msg: "Please provide valid value for cookType" }
            if (cookType == "housecook") dbBody.cookType = 1;
            if (cookType == "partycook") dbBody.partyCook = 1;
            if (cookType == "catering") dbBody.memberType = 2;
        }

        console.log({ dbBody })

        let data = await Cook.findOne(dbBody);
        if (!data) throw { statusCode: 400, reponseCode: 5, msg: "Invalid id" }
        let body = { cookId: id, employerId: req.user._id, activity: 'shortlisted' }

        if (data.memberType == 1 && req.user.memberType == 1 && cookType == "housecook") pointsData = await checkClientValidHouseCookPoints(req.user._id), body.clientPointsId = (pointsData) ? pointsData._id : null, body.cookType = "housecook", pointsUpdateBody = { currentHouseCookPoints: -1 }, updateModelName = ClientPoints;
        if (data.memberType == 2 && req.user.memberType == 1 && cookType == "catering") pointsData = await checkClientValidPartyCateringPoints(req.user._id), body.clientPointsId = (pointsData) ? pointsData._id : null, body.cookType = "catering", pointsUpdateBody = { currentPartyCateringPoints: -1 }, updateModelName = ClientPoints;
        if (data.memberType == 1 && req.user.memberType == 1 && cookType == "partycook") pointsData = await checkClientValidPartyCateringPoints(req.user._id), body.clientPointsId = (pointsData) ? pointsData._id : null, body.cookType = "partycook", pointsUpdateBody = { currentPartyCateringPoints: -1 }, updateModelName = ClientPoints;
        if (data.memberType == 1 && req.user.memberType == 2 && data.cookType == 2) pointsData = await checkEmployerValidProfileViewPoints(req.user._id), body.employerPointsId = (pointsData) ? pointsData._id : null, body.cookType = "chef", pointsUpdateBody = { currentProfileViewPoints: -1 }, updateModelName = EmployerPoints;

        if (!pointsData) throw { statusCode: 402, responseCode: 5, msg: "Insufficient points. Please purchase plan to continue!" }
        let logData = await EmployerActivity.findOne(body);
        if (logData) throw Error("Already shortlisted this profile earlier")
        logData = await EmployerActivity.create({ ...body, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), expiresAt: pointsData.planExpiresAt, cookType: (cookType) ? cookType : "chef" });
        res.status(200).send(responseJson(1, 1, logData, 'Profile shortlisted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile shortlisting failed', e))
    }
}

exports.removeShortlistedProfile = async (req, res) => {
    try {
        let {
            cookId,
            cookType
        } = Object.assign(req.body)

        let requiredFields = {
            cookId,
            cookType
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (cookType !== "catering" && cookType != "housecook" && cookType != "partycook" && cookType != "chef") throw { statusCode: 500, responseCode: 2, msg: "Please provide valid value for cookType" }

        let data = await EmployerActivity.findOne({ cookType, cookId, activity: 'shortlisted', employerId: req.user._id, expiresAt: { $gte: getCurrentDateAndTime() } });
        if (!data) throw { statusCode: 500, responseCode: 0, msg: "No data found" }

        data = await EmployerActivity.deleteMany({ cookType, cookId, activity: 'shortlisted', employerId: req.user._id });
        res.status(200).send(responseJson(1, 1, {}, 'Shortlist removed successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Shortlist removing failed', e))
    }
}

exports.fetchViewedProfiles = async (req, res) => {
    try {

        let {
            id, limit, page, skip
        } = Object.assign(req.query)

        let requiredFields = {

        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let aggregateQuery = [];
        if (id) {
            aggregateQuery.push({
                $match: {
                    cookId: mongoose.Types.ObjectId(id)
                }
            },)
        }

        aggregateQuery.push(
            {
                $match: {
                    cookId: { $exists: true },
                    activity: "viewed",
                    employerId: mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $group: {
                    _id: '$cookId',
                    details: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$details' }
            },
            {
                $lookup: {
                    from: 'cooks',
                    localField: 'cookId',
                    foreignField: '_id',
                    as: 'cookDetails'
                }
            },
            {
                $unwind: '$cookDetails'
            },
            {
                $replaceRoot: { newRoot: '$cookDetails' },
            }
        )

        let totalData = await EmployerActivity.aggregate(aggregateQuery);
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            }
        );
        let data = await EmployerActivity.aggregate(aggregateQuery);
        res.status(200).send(responseJson(1, 1, data, 'Viewed profiles fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Viewed profiles fetching  failed', e))

    }
}

exports.fetchShortlistedProfiles = async (req, res) => {
    try {

        let {
            id, limit, page, skip, shortlistId, cookType
        } = Object.assign(req.query)

        let requiredFields = {

        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (cookType && cookType != "partycook" && cookType != "housecook" && cookType != "catering" && cookType != "chef") throw { statusCode: 400, msg: "Please provide a valid cooktype." }

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let aggregateQuery = [];
        if (id) {
            aggregateQuery.push({
                $match: {
                    cookId: mongoose.Types.ObjectId(id)
                }
            },)
        }
        if (shortlistId) {
            aggregateQuery.push({
                $match: {
                    _id: mongoose.Types.ObjectId(shortlistId)
                }
            },)
        }
        if (cookType) {
            aggregateQuery.push({
                $match: {
                    cookType
                }
            },)
        }


        aggregateQuery.push(
            {
                $match: {
                    cookId: { $exists: true },
                    activity: "shortlisted",
                    employerId: mongoose.Types.ObjectId(req.user._id),
                    expiresAt: { $gte: getCurrentDateAndTime() }
                }
            },
            {
                $group: {
                    _id: "$cookId",
                    shortlistId: { $first: "$_id" },
                    details: {
                        $first: "$$ROOT"
                    }
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": {
                        "$mergeObjects": ["$details", { "shortlistId": "$shortlistId" }]
                    }
                }
            },
            {
                $lookup: {
                    from: 'cooks',
                    localField: 'cookId',
                    foreignField: '_id',
                    as: 'cookDetails'
                }
            },
            {
                $unwind: '$cookDetails'
            },
            {
                $addFields: {
                    shortlistId: "$shortlistId"
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$cookDetails", { "shortlistId": "$shortlistId" }]
                    }
                }
            },
        )

        let totalData = await EmployerActivity.aggregate(aggregateQuery);
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            }
        );
        let data = await EmployerActivity.aggregate(aggregateQuery);
        res.status(200).send(responseJson(1, 1, data, 'Shortlisted profiles fetched successfully', {}, data.length, totalData.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Shortlisted profiles fetching  failed', e))

    }
}

exports.fetchHouseJobApplications = async (req, res) => {
    try {

        let {
            id, limit, skip, page, applicationStatus, requirementId, cookId
        } = Object.assign(req.body, req.query)

        let matchingFilters = { employerId: mongoose.Types.ObjectId(req.user._id), isDeleted: false, expiredAt: { $gte: getCurrentDateAndTime() } }
        if (cookId) matchingFilters.cookId = mongoose.Types.ObjectId(cookId);
        if (requirementId) matchingFilters.requirementId = mongoose.Types.ObjectId(cookId);
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
                    from: "clientrequirements",
                    localField: "requirementId",
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
        let isNew = totalData.some(application => !application.isViewed);
        res.status(200).send(responseJson(1, 1, data, 'Applications fetched successfully', {}, data.length, totalData.length, isNew))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching applications failed', e))
    }
}

exports.viewHouseJobApplication = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.query)

        const requiredFields = {
            id
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        // let pointsData = await checkClientValidHouseCookPoints(req.user._id);
        // if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points. Please purchase plan to continue!" }

        let data = await CookApplication.findOne({ _id: id }).populate([{ path: "requirementId" }, { path: "cookId" }]);
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

exports.updateHouseJobApplication = async (req, res) => {
    try {
        let {
            id, applicationStatus
        } = Object.assign(req.body)

        const requiredFields = {
            id, applicationStatus
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        // let pointsData = await checkClientValidHouseCookPoints(req.user._id);
        // if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points. Please purchase plan to continue!" }

        let data = await CookApplication.findOneAndUpdate({ _id: id }, { $set: { applicationStatus } }, { new: true });
        if (!data) throw { statusCode: 500, responseCode: 2, msg: "No application found" }

        res.status(200).send(responseJson(1, 1, data, 'Application updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Application updation failed', e))

    }
}

exports.storeActivityLog = async (req, res) => {
    try {
        let {
            cookId,
            employerId,
            activity
        } = Object.assign(req.body)

        const requiredFields = {
            cookId,
            activity
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await EmployerActivity.create({
            cookId,
            employerId: req.user._id,
            activity,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime()
        });
        res.status(200).send(responseJson(1, 1, data, 'Activity added successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Activity adding failed', e))

    }
}

exports.fetchActivityLogs = async (req, res) => {
    try {

        let {
            id,
            cookId,
            limit, skip, page,
            activity
        } = Object.assign(req.body)

        const requiredFields = {
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = { isDeleted: false };
        if (id) dbQuery._id = id;
        if (cookId) dbQuery.cookId = cookId;

        let data = await EmployerActivity.find(dbQuery).populate([
            { path: "cookId" }
        ]).sort({ 'createdAt': -1 }).limit(limit).skip(skip);

        let totalData = await EmployerActivity.find(dbQuery).populate([
            { path: "cookId" }
        ])

        res.status(200).send(responseJson(1, 1, data, 'Activity logs fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Activity logs fetching failed', e))
    }
}

exports.disableAccount = async (req, res) => {
    try {
        await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { status: 2 } }, { new: true });
        res.status(200).send(responseJson(1, 1, {}, 'Account disabled successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account disabling failed', e))
    }
}

exports.enableAccount = async (req, res) => {
    try {

        if (req.user.status == 4) throw { statusCode: 500, responseCode: 0, msg: "Account deletion request under review. Apologies for any inconvenience." }
        if (req.user.status != 2) throw { statusCode: 500, responseCode: 0, msg: "Account is already enabled. No further action required" }
        await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { status: 1 } }, { new: true });
        res.status(200).send(responseJson(1, 1, {}, 'Account enabled successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account enabling failed', e))
    }
}

exports.raiseDeleteRequest = async (req, res) => {
    try {

        let disposalData = await DisposalAccounts.findOne({ employerId: req.user._id, activity: 2 });
        if (disposalData && req.user.status == 4) throw { statusCode: 500, responseCode: 0, msg: "Your previous delete request is in-progress" }

        await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { status: 4, deleteRequestedAt: getCurrentDateAndTime() } }, { new: true });
        await DisposalAccounts.create({ employerId: req.user._id, activity: 2, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), previousStatus: req.user.status });

        res.status(200).send(responseJson(1, 1, {}, 'Account delete request raised successfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account delete requesting failed', e))
    }
}

exports.reportSubmit = async (req, res) => {
    try {

        let {
            cookId,
            reason,
            comment
        } = Object.assign(req.body)

        const requiredFields = {
            reason,
            cookId
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Cook.findOne({ _id: cookId });
        if (!data) throw { statusCode: 500, responsecode: 0, msg: 'No cook found' }

        let reportData = await EmployerReports.findOne({ cookId, employerId: req.user._id });
        if (reportData) throw { statusCode: 500, responsecode: 0, msg: "This profile is already reported earlier" }

        reportData = await EmployerReports.create({ cookId, employerId: req.user._id, reason, comment, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        await Promise.all([
            EmployerActivity.deleteMany({ cookId, employerId: req.user._id })
        ]);
        res.status(200).send(responseJson(1, 1, {}, 'Reported successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Reporting failed', e))
    }
}

exports.getDashboardData = async (req, res) => {
    try {
        let aggregateQuery;

        //For Clients Dashboard Query
        if (req.user.memberType == 1) {
            modelName = ClientPoints;
            aggregateQuery = [
                {
                    $match: {
                        clientId: mongoose.Types.ObjectId(req.user._id),
                        planExpiresAt: { $gte: new Date() },
                    },
                },
                {
                    $lookup: {
                        from: 'events',
                        let: { clientPointsId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$clientPointsId', '$$clientPointsId'] },
                                            { $eq: ['$clientId', mongoose.Types.ObjectId(req.user._id)] }
                                        ],
                                    },
                                },
                            },
                            {
                                $count: 'totalEventsCount',
                            },
                        ],
                        as: 'eventsCount',
                    },
                },
                {
                    $lookup: {
                        from: 'cookapplications',
                        let: { clientPointsId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                            { $eq: ['$clientPointsId', '$$clientPointsId'] },
                                            { $ne: ['$eventId', null] }
                                        ],
                                    },
                                },
                            },
                            {
                                $count: 'totalEventsInterestsCount'
                            },
                        ],
                        as: 'eventInterestsCount',
                    },
                },
                {
                    $lookup: {
                        from: 'clientrequirements',
                        let: { clientId: mongoose.Types.ObjectId(req.user._id) },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$clientId', mongoose.Types.ObjectId(req.user._id)] }
                                        ],
                                    },
                                },
                            },
                            {
                                $count: 'totalRequirementsCount'
                            },
                        ],
                        as: 'requirementsCount',
                    },
                },
                {
                    $lookup: {
                        from: 'cookapplications',
                        let: { employerId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$employerId', '$$employerId'] },
                                            { $ne: ['$requirementId', null] }
                                        ],
                                    },
                                },
                            },
                            {
                                $count: 'totalRequirementApplicationsCount'
                            },
                        ],
                        as: 'requirementApplicationsCount',
                    },
                },
                {
                    $unwind: {
                        path: '$eventsCount',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$eventInterestsCount',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$requirementsCount',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$requirementApplicationsCount',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'clientplans',
                        localField: 'clientPlanId',
                        foreignField: '_id',
                        as: 'clientPlanDetails',
                    },
                },
                {
                    $unwind: {
                        path: '$clientPlanDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $sort: {
                        planExpiresAt: -1
                    }
                },
                {
                    $group: {
                        _id: {
                            planName: '$clientPlanDetails.clientPlanName',
                            planType: '$planType',
                            clientPointsId: '$_id',
                            currentEventPoints: '$currentEventPoints',
                            currentHouseCookPoints: '$currentHouseCookPoints',
                            currentPartyCateringPoints: '$currentPartyCateringPoints',
                            planExpiryDate: '$planExpiresAt',
                            totalActiveEvents: { $sum: { $ifNull: ['$eventsCount.totalEventsCount', 0] } },
                            totalEventInterestReceived: { $sum: { $ifNull: ['$eventInterestsCount.totalEventsInterestsCount', 0] } },
                            totalRequirements: { $sum: { $ifNull: ['$requirementsCount.totalRequirementsCount', 0] } },
                            totalRequirementApplicationsReceived: { $sum: { $ifNull: ['$requirementApplicationsCount.totalRequirementApplicationsCount', 0] } }
                        },
                    },
                }
            ]
        }

        //For Employers Dashboard Query
        if (req.user.memberType == 2) {
            modelName = EmployerPoints;
            aggregateQuery = [
                {
                    $match: {
                        employerId: mongoose.Types.ObjectId(req.user._id),
                        planExpiresAt: { $gte: new Date() },
                    },
                },
                {
                    $lookup: {
                        from: 'jobs',
                        let: { employerPointsId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$employerPointsId', '$$employerPointsId'] },
                                            { $gte: ['$expiryDate', getCurrentDateAndTime()] }
                                        ],
                                    },
                                },
                            },
                            {
                                $count: 'totalJobs',
                            },
                        ],
                        as: 'jobsCount',
                    },
                },
                {
                    $lookup: {
                        from: 'cookapplications',
                        let: { employerPointsId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$employerId', mongoose.Types.ObjectId(req.user._id)] },
                                            { $eq: ['$employerPointsId', '$$employerPointsId'] }
                                        ],
                                    },
                                },
                            },
                            {
                                $count: 'totalApplications'
                            },
                        ],
                        as: 'applicationsCount',
                    },
                },
                {
                    $lookup: {
                        from: 'employeractivities',
                        let: { employerPointsId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$employerPointsId', '$$employerPointsId'] },
                                            { $eq: ['$activity', 'shortlisted'] },
                                        ],
                                    },
                                },
                            },
                            {
                                $count: 'totalShortlists'
                            },
                        ],
                        as: 'shortlistedCount',
                    },
                },
                {
                    $unwind: {
                        path: '$jobsCount',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$shortlistedCount',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$applicationsCount',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'employerplans',
                        localField: 'employerPlanId',
                        foreignField: '_id',
                        as: 'employerPlanDetails',
                    },
                },
                {
                    $unwind: {
                        path: '$employerPlanDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $sort: {
                        planExpiresAt: -1
                    }
                },
                {
                    $group: {
                        _id: {
                            planName: '$employerPlanDetails.employerPlanName',
                            employerPointsId: '$_id',
                            currentJobPoints: '$currentJobPoints',
                            currentProfileViewPoints: '$currentProfileViewPoints',
                            currentResponsePoints: '$currentResponsePoints',
                            planExpiryDate: '$planExpiresAt',
                            totalActiveJobs: { $sum: { $ifNull: ['$jobsCount.totalJobs', 0] } },
                            totalJobApplications: { $sum: { $ifNull: ['$applicationsCount.totalApplications', 0] } },
                            totalProfileShortlists: { $sum: { $ifNull: ['$shortlistedCount.totalShortlists', 0] } },
                        },
                    },
                }
            ]
        }
        let data = await modelName.aggregate(aggregateQuery)

        data = JSON.parse(JSON.stringify(data));
        let dashboardData = [];
        data.map((x) => {
            if (x._id) dashboardData.push(x._id)
        })
        if (dashboardData.length) dashboardData = dashboardData.sort((a, b) => new Date(b.planExpiryDate) - new Date(a.planExpiryDate));
        if (req.user.memberType == 2 && dashboardData.length) {
            let sum = mergeEmployerDashboardData(dashboardData);
            console.log({ sum })
            const firstObject = dashboardData[0];
            Object.keys(sum).forEach(key => {
                if (firstObject.hasOwnProperty(key)) {
                    firstObject[key] = sum[key];
                }
            });
        }
        if (req.user.memberType == 1 && dashboardData.length) {
            let sum = mergeClientDashboardData(dashboardData);
            console.log({ sum })
            const firstObject = dashboardData[0];
            Object.keys(sum).forEach(key => {
                if (firstObject.hasOwnProperty(key)) {
                    firstObject[key] = sum[key];
                }
            });
        }

        res.status(200).send(responseJson(1, 1, [dashboardData[0]], 'Dashboard fetched successfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Dashbaord fetching failed', e))
    }
}


exports.revokeDeleteRequest = async (req, res) => {
    try {

        let disposalData = await DisposalAccounts.findOne({ employerId: req.user._id, activity: 2 });
        if (!disposalData) throw { statusCode: 500, responseCode: 0, msg: "No request found" }

        let data = await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { status: disposalData.previousStatus }, $unset: { deleteRequestedAt: '' } }, { new: true })
        disposalData = await DisposalAccounts.findOneAndDelete({ _id: disposalData._id });

        res.status(200).send(responseJson(1, 1, {}, 'Delete request revoked successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Delete request revoking failed', e))
    }
}

exports.storeCookRating = async (req, res) => {
    try {

        let {
            cookId,
            hygiene,
            behaviour,
            punctuality,
            taste,
            comment
        } = Object.assign(req.body)

        const requiredFields = {
            cookId,
            hygiene,
            behaviour,
            punctuality,
            taste
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let cookData = await Cook.findById(cookId);
        if (!cookData) throw { statusCode: 404, responseCode: 0, msg: "No cook found" }

        if (typeof hygiene != "number" || hygiene > 5 || hygiene < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid hygiene value" }
        if (typeof behaviour != "number" || behaviour > 5 || behaviour < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid behaviour value" }
        if (typeof punctuality != "number" || punctuality > 5 || punctuality < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid punctuality value" }
        if (typeof taste != "number" || taste > 5 || taste < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid taste value" }

        let data = await CookRatings.findOneAndUpdate({ cookId, employerId: req.user._id }, {
            $set: {
                cookId,
                hygiene,
                behaviour,
                punctuality,
                taste,
                comment,
                employerId: req.user._id,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            }
        }, { new: true, upsert: true })
        console.log({ data })
        if (!data) throw { statusCode: 500, responseCode: 0, msg: "Unable to add rating. Try again" }
        res.status(200).send(responseJson(1, 1, data, 'Rating submitted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cook rating failed', e))
    }
}

exports.updateWeavyId = async (req, res) => {
    try {
        if (!req.body.weavyId) throw { statusCode: 400, responseCode: 2, msg: "Please provide weavyId." }
        let data = await Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { weavyId: req.body.weavyId } }, { new: true });
        console.log({ data })
        res.status(200).send(responseJson(1, 1, data, 'Updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Updated successfully!', e))
    }
}


exports.getSharedCookProfiles = async (req, res) => {
    try {

        let {
            cookId,
            jobId,
            requirementId,
            eventId,
            date,
            status,
            id, limit, page, skip
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        let dbQuery = { employerId: req.user._id };
        if (id) dbQuery._id = id;
        if (cookId) dbQuery.cookId = cookId;
        if (jobId) dbQuery.jobId = jobId;
        if (eventId) dbQuery.eventId = eventId;
        if (requirementId) dbQuery.requirementId = requirementId;
        if (status == 1) dbQuery.expiryDate = { $gte: getCurrentDateAndTime() };
        if (status == 0) dbQuery.expiryDate = { $lt: getCurrentDateAndTime() };

        let totalDataCount = await SharedProfiles.find(dbQuery).countDocuments();
        let paginatedData = await SharedProfiles.find(dbQuery).populate([
            { path: "cookId", select: "fullName memberType cookType partyCook email mobile dp addressLine1 addressLine2 weavyId cityName provinceName area pincode status" },
            { path: "jobId" },
            { path: "eventId" },
            { path: "requirementId" }
        ]).sort({ createdAt: -1 }).limit(limit).skip(skip);

        paginatedData = JSON.parse(JSON.stringify(paginatedData));
        paginatedData = paginatedData.map((x) => {
            x.status = (isDateExpired(x.expiryDate)) ? 0 : 1;
            return x;
        })
        res.status(200).send(responseJson(1, 1, paginatedData, 'Shared profiles fetched successfully', {}, paginatedData.length, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching shared profiles failed', e))
    }
}

exports.viewSharedCookDetails = async (req, res) => {
    try {

        if (!req.query.cookId || !mongoose.isValidObjectId(req.query.cookId)) throw { statusCode: 400, msg: "Please provide a valid cookId." }
        let data = await Cook.findById(req.query.cookId);
        if (!data) throw { statusCode: 400, msg: "No cook profile found!" }
        res.status(200).send(responseJson(1, 1, data, 'Cook profile fetched successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cook profile fetching failed', e))
    }
}
