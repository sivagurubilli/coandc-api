let { privateKey, adminEmail, backendUrl, frontendUrl } = require('../config/config')
let appStatic = require('../config/appStatic.js').data
let { isValidDate, sendEmailOtp, generateMemberId, sendWhatsappSms, responseJson, generateWhatsappOtp, sendMail, isRequestDataValid, sendOtp, generateOtp, capitalizeEveryInnerWord, resumeGen } = require('../utils/appUtils');
let { EmployerRatings, DisposalAccounts, Cook, CookVerify, ResumeBuilder, SmsLogs, CookPoints, Employer, ClientRequirement, ResumeTemplate, EmailVerify, CookActivity, CookApplication, CookShortlist, EmployerVerify, Jobs, Events, CookReports, } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
let { registerOtp, updateMobileOtp, forgotPassword } = require("../utils/smsTemplates");
const { checkRegistrationLimits, isEmailAvailable, isMobileAvailable, getMobileData, isValidName, isWhatsappNumberAvailable, checkRegistrationMACLimit, checkLoginMACLimit, checkRegistrationMacAddress, checkLoginMacAddress, calculateEmployerRatingAverages } = require('../helpers/user');
const { getCurrentDate, getCurrentDateAndTime, addDaysToDate, isDateExpired } = require('../helpers/dates');
const { isValidProvince, isValidLanguage, isValidQualification, isValidPartyPlates, isValidCuisine, isValidCateringPlates, isValidHouseJobPayments } = require("../helpers/index")
const { checkHouseCookValidBalance, checkChefValidBalance, checkIsReportedOrNot, checkPartyCookValidBalance, checkCateringValidBalance } = require("../helpers/cook");
var mongoose = require('mongoose');
const { getCookProfilePercent, getEmployerProfilePercent } = require("../helpers/points");
const { sendJobApplicationNotification, sendEventApplicationNotification, sendHouseJobApplicationNotification } = require("../helpers/notification")
const moment = require("moment");

exports.cookRegister = async (req, res) => {
    try {

        let {
            memberType,
            fullName,
            gender,
            mobile,
            email,
            password,
            cookType,
            partyCook,
            otp,
            message,
            memberCode,
            registerIP,
            registerMAC,
            loginIP,
            loginMAC,
            deviceToken,
            appAccess,
            webAccess
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
        if (memberType == 1 && partyCook != 1) requiredFields.cookType = cookType;
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (!webAccess && !appAccess) throw { statusCode: 400, responseCode: 0, msg: "Please provide appaccess or webaccess." }
        if ((webAccess == 0 && appAccess == 0) || (webAccess == 1 && appAccess == 1)) throw Error("WebAccess and Appaccess values cannot be same")

        await isEmailAvailable(email);
        await isMobileAvailable(mobile);
        await checkRegistrationLimits({ mobile, role: 'cook' })
        // await checkRegistrationMacAddress(registerMAC)
        const checkName = isValidName(fullName, memberType);
        if (checkName == false) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid name" }

        password = bcrypt.hashSync(password, 8);
        memberCode = (memberType == 1) ? "cook" : "catering";
        let dbBody = {
            memberType,
            fullName: capitalizeEveryInnerWord(fullName),
            gender,
            mobile,
            email,
            password,
            partyCook,
            cookType,
            cookMemberId: generateMemberId(memberCode),
            registerIP,
            registerMAC,
            loginIP: registerIP,
            loginMAC: registerMAC,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime(),
            passwordUpdateDateTime: getCurrentDateAndTime()
        };
        if (webAccess == 0 || webAccess == 1) dbBody.webAccess = webAccess;
        if (appAccess == 0 || appAccess == 1) dbBody.appAccess = appAccess;

        if (deviceToken) dbBody.deviceToken = deviceToken;
        if (memberType == 1) dbBody.resumeBuilder = 0, dbBody.resumeBuilderStatus = 0, dbBody.profileBoostRank = 0

        //Creating User
        let data = await Cook.create(dbBody);
        if (!data) throw { statusCode: 500, responseCode: 6, msg: "Unable to signup. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        otp = generateOtp();
        message = registerOtp(otp);

        let smsResponse = await sendOtp({ cookId: data._id, message, otp, type: 1, senderId: 'CKNCHF', templateId: 'Signup Auth', mobile, role: 'cook' })
        let emailResponse = await sendEmailOtp({ cookId: data._id, email, type: 1, sender: 'support@cookandchef.in', subject: 'Account Verification', role: "cook" })

        //Sending Response to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            email: data.email,
            mobile: data.mobile,
            profilePercent: data.profilePercent,
            cookMemberId: data.cookMemberId,
            id: data.id
        }, 'OTP has been sent to your mobile number'))
    }
    catch (e) {
        console.log(e)
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Signup  Failed', e))
    }
}

exports.changeMobileNumber = async (req, res) => {
    try {
        let {
            cookId,
            mobile,
            otp,
            message
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            cookId,
            mobile
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let cookData = await Cook.findOne({ _id: cookId });
        if (!cookData) throw { statusCode: 500, responseCode: 6, msg: "Invalid cookId. Try with another!" }
        if (cookData && cookData.status !== 0) throw { statusCode: 500, responseCode: 3, msg: "Unable to change mobile number as account is already verified earlier" }

        //Change Mobile number validations
        await getMobileData(mobile);

        let data = await Cook.findOneAndUpdate({ _id: cookId }, { $set: { mobile, updatedAt: getCurrentDateAndTime() } }, { new: true });
        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to change mobile number. Try again!" }
        otp = generateOtp();
        message = registerOtp(otp);
        console.log({ otp, message })
        let smsResponse = await sendOtp({ cookId: data._id, message, otp, type: 2, senderId: 'CKNCHF', templateId: 'Signup Auth', mobile, role: 'cook' })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data.id,
            cookMemberId: data.cookMemberId,
            newMobile: mobile
        }, 'OTP has been sent to your edited mobile number'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Changing mobile number failed', e))
    }
}

exports.resendOtp = async (req, res) => {
    try {
        let {
            cookId,
            otp,
            message
        } = Object.assign(req.body, req.query, req.params)

        if (!cookId) throw { statusCode: 400, responseCode: 2, msg: "Please provide cookId" }
        const payload = Object.keys(req.body);
        if (payload.length > 1) throw { statusCode: 400, responseCode: 2, msg: "Invalid keys in payload" }

        let data = await Cook.findOne({ _id: cookId });
        if (!data) throw { statusCode: 500, responseCode: 6, msg: "Invalid cookId. Try with another!" }

        otp = generateOtp();
        message = registerOtp(otp);
        console.log({ otp, message })
        let smsResponse = await sendOtp({ cookId, message, otp, type: 2, senderId: 'CKNCHF', templateId: 'Signup Auth', mobile: data.mobile, role: 'cook' })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data.id,
            cookMemberId: data.cookMemberId,
            mobile: data.mobile
        }, 'OTP has been resent to your mobile number'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Failed to resend OTP. Try again!', e))
    }
}

exports.verifyCookOtp = async (req, res) => {
    try {

        let {
            cookId,
            otp
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            cookId,
            otp
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Cook.findOneAndUpdate({ _id: cookId, status: 0 }, {
            $set: {
                partyCookProfileStatus: 0, houseCookProfileStatus: 0,
                basicProfileStatus: 0, cateringProfileStatus: 0, chefProfileStatus: 0, updatedAt: getCurrentDateAndTime()
            }
        }, { new: true });
        data = JSON.parse(JSON.stringify(data));
        if (!data) throw { statusCode: 500, responseCode: 4, msg: "Invalid cookId or account already verified. Try again!" }

        //Otp Verification
        let otpResp = await CookVerify.findOne({ cookId, otp });
        if (!otpResp) throw { statusCode: 422, responseCode: 3, msg: "Invalid OTP" }

        //MAC Checking
        // await checkRegistrationMacAddress(data.registerMAC, cookId);

        data = await Cook.findOneAndUpdate({ _id: cookId }, { $set: { mobileVerified: 1, status: 1, lastLoginDateTime: getCurrentDateAndTime() } }, { new: true })

        //Default Points Allocation
        let pointsData;
        if (data.memberType == 1) {
            pointsData = await CookPoints.create({
                chefDailyLimit: 10, chefMonthlyLimit: 50, chefDailyLimitBalance: 10, chefMonthlyLimitBalance: 50,
                cookId, partyDailyLimit: 10, partyMonthlyLimit: 50, partyDailyLimitBalance: 10, partyMonthlyLimitBalance: 50,
                houseDailyLimit: 10, houseMonthlyLimit: 50, houseDailyLimitBalance: 10, houseMonthlyLimitBalance: 50,
                chefPlanStartDate: getCurrentDateAndTime(), chefPlanEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, chefPlanRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                planStartDate: getCurrentDateAndTime(), planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            }
            );
        }
        else if (data.memberType == 2) {
            pointsData = await CookPoints.create({
                cookId,
                cateringDailyLimit: 10, cateringMonthlyLimit: 50, cateringDailyLimitBalance: 10, cateringMonthlyLimitBalance: 50,
                planStartDate: getCurrentDateAndTime(), planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            });
        }

        //Token_Generation
        data.token = jwt.sign({ id: data._id }, privateKey, { expiresIn: 60 * 60 * 24 * 365 });// 1 year in seconds

        sendMail({
            to: data.email,
            subject: 'Welcome to CookandChef!',
            type: 'cook',
            options: {
                username: data.fullName
            }
        })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            role: "cook",
            email: data.email,
            mobile: data.mobile,
            fullName: data.fullName,
            cookMemberId: data.cookMemberId,
            id: data.id,
            mobileVerified: data.mobileVerified,
            emailVerified: data.emailVerified,
            partyCookProfileStatus: data.partyCookProfileStatus,
            houseCookProfileStatus: data.houseCookProfileStatus,
            cateringProfileStatus: data.cateringProfileStatus,
            chefProfileStatus: data.chefProfileStatus,
            profilePercent: data.profilePercent,
            weavyId: data.weavyId,
            basicProfileStatus: data.basicProfileStatus,
            token: data.token
        }, 'OTP verified successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'OTP verification failed', e))
    }
}


exports.cookLogin = async (req, res) => {
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
        if (!phoneNumberPattern.test(emailOrMobile)) dbQuery.email = (emailOrMobile).toLowerCase();
        else if (phoneNumberPattern.test(emailOrMobile)) dbQuery.mobile = emailOrMobile;

        let updateQuery = { loginIP, loginMAC, updatedAt: getCurrentDateAndTime() };
        if (webAccess == 0 || webAccess == 1) updateQuery.webAccess = webAccess;
        if (appAccess == 0 || appAccess == 1) updateQuery.appAccess = appAccess;

        if (deviceToken) updateQuery.deviceToken = deviceToken;
        let data = await Cook.findOneAndUpdate(dbQuery, { $set: updateQuery }, { new: true });
        data = JSON.parse(JSON.stringify(data));
        if (!data) throw { statusCode: 401, responsecode: 5, msg: "No account found. Try signup!" }
        if (data && data.status == 3) throw { statusCode: 403, responseCode: 3, msg: "Your account is suspended. Contact support!" }
        if (data && data.status == 0) throw { statusCode: 403, responseCode: 4, msg: "Your account is not verified. Try register again!" }

        const isPasswordMatch = bcrypt.compareSync(password, data.password);
        if (!isPasswordMatch) throw { statusCode: 401, responseCode: 6, msg: "Invalid password. Try again!" }

        //Checking MAC limits
        // await checkLoginMacAddress(loginMAC, data._id);
        data.token = jwt.sign({ id: data._id }, privateKey, { expiresIn: 60 * 60 * 24 * 365 });
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            role: "cook",
            fullName: data.fullName,
            userPlan: data.userPlan,
            actionPerDay: data.actionPerDay,
            dayActionBalance: data.dayActionBalance,
            actionPerMonth: data.actionPerMonth,
            userCredits: data.userCredits,
            monthActionBalance: data.monthActionBalance,
            profilePercent: data.profilePercent,
            memberId: data.memberId,
            memberType: data.memberType,
            cookType: data.cookType,
            partyCook: data.partyCook,
            email: data.email,
            mobile: data.mobile,
            cookMemberId: data.cookMemberId,
            id: data.id,
            mobileVerified: data.mobileVerified,
            emailVerified: data.emailVerified,
            whatsappNumberVerified: data.whatsappNumberVerified,
            partyCookProfileStatus: data.partyCookProfileStatus,
            houseCookProfileStatus: data.houseCookProfileStatus,
            cateringProfileStatus: data.cateringProfileStatus,
            chefProfileStatus: data.chefProfileStatus,
            basicProfileStatus: data.basicProfileStatus,
            weavyId: data.weavyId,
            token: data.token
        }, 'Logged in successfully!'))
    }
    catch (e) {
        console.log({ e })
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Login failed', e))
    }
}

exports.getCookProfile = async (req, res) => {
    try {

        let data = await Cook.findOne({ _id: req.user._id });
        res.status(200).send(responseJson(1, 1, data, 'Get profile success'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Get profile failed', e))
    }
}

exports.editCookProfile = async (req, res) => {
    try {
        let {
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
        const user = req.user;

        let updateBody = { updatedAt: getCurrentDateAndTime(), basicProfileStatus: 1 };
        if (fullName) {
            const checkName = isValidName(fullName, user.memberType);
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


        if (user.memberType == 2) {
        }

        else if (user.memberType == 1) {
            if (gender) updateBody.gender = gender;
            if (qualification) {
                await isValidQualification(qualification);
                updateBody.qualification = qualification;
            }
            if (qualification !== null && qualification !== undefined) updateBody.qualification = qualification;
            if (dob) updateBody.dob = isValidDate(dob);
            if (dob == "") updateBody.dob = null;
        }

        let data = await Cook.findOneAndUpdate({ _id: user._id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to update profile. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));


        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            fullName: data.fullName,
            userPlan: data.userPlan,
            actionPerDay: data.actionPerDay,
            dayActionBalance: data.dayActionBalance,
            actionPerMonth: data.actionPerMonth,
            userCredits: data.userCredits,
            monthActionBalance: data.monthActionBalance,
            profilePercent: data.profilePercent,
            memberId: data.memberId,
            memberType: data.memberType,
            cookType: data.cookType,
            partyCook: data.partyCook,
            email: data.email,
            mobile: data.mobile,
            cookMemberId: data.cookMemberId,
            id: data.id,
            mobileVerified: data.mobileVerified,
            emailVerified: data.emailVerified,
            whatsappNumberVerified: data.whatsappNumberVerified,
            qualification: data.qualification,
            areaCoordinates: data.areaCoordinates,
            cityCoordinates: data.cityCoordinates,
            smsContact: data.smsContact,
            whatsappContact: data.whatsappContact,
            emailContact: data.emailContact,
        }, 'Profile updated successfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updation failed', e))
    }
}

exports.edithouseCookProfile = async (req, res) => {
    try {

        let {
            householdVesselWash,
            householdCuisines,
            payment,
            jobType,
            name, email, mobile, gender
        } = Object.assign(req.body, req.query, req.params)

        //Validating_Cuisines
        if (householdCuisines && householdCuisines.length) {
            await isValidCuisine(householdCuisines);
        }


        let updateBody = {
            householdVesselWash,
            householdCuisines,
            jobType,
            houseCookProfileStatus: 1,
            updatedAt: getCurrentDateAndTime()
        }
        if (payment !== null && payment !== undefined) updateBody.payment = payment;
        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, {
            $set: updateBody
        }, { new: true })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to edit. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: req.user._id,
            householdVesselWash,
            householdCuisines,
            payment,
            jobType
        }, 'Profile updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updated failed', e))
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
            website
        } = Object.assign(req.body, req.query, req.params)

        await isValidCateringPlates(cateringMinPlates);
        //Validating_Cuisines
        if (cateringCuisines && cateringCuisines.length) {
            await isValidCuisine(cateringCuisines);
        }

        const updateBody = {
            cateringMinPlates,
            cateringCuisines,
            cateringFoodType,
            cateringProfileStatus: 1,
            updatedAt: getCurrentDateAndTime()
        }
        if (teamSize !== null && teamSize !== undefined) updateBody.teamSize = teamSize;
        if (website !== null && website !== undefined) updateBody.website = website;
        if (fssai !== null && fssai !== undefined) updateBody.fssai = fssai;

        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, {
            $set: updateBody
        }, { new: true })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to edit. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: req.user._id,
            cateringMinPlates,
            cateringCuisines,
            cateringFoodType,
            fssai, website, teamSize
        }, 'Profile updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updated failed', e))
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
            resume
        } = Object.assign(req.body, req.query, req.params)

        if (chefCuisines && chefCuisines.length) {
            await isValidCuisine(chefCuisines);
        }

        let updateBody = {
            chefCuisines,
            skills,
            chefExperience,
            currentSalary,
            expectedSalary,
            currentCompany,
            currentCityName,
            resume,
            chefProfileStatus: 1,
            currentCityCoordinates,
            updatedAt: getCurrentDateAndTime()
        }
        if (resume !== null && resume !== undefined) updateBody.resume = resume;
        if (skills !== null && skills !== undefined) updateBody.skills = skills;
        if (currentCompany !== null && currentCompany !== undefined) updateBody.currentCompany = currentCompany;
        if (jobSeeking == 0 || jobSeeking == 1) updateBody.jobSeeking = jobSeeking;
        if (relocate == 0 || relocate == 1) updateBody.relocate = relocate;


        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to edit. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: req.user._id,
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
        }, 'Profile updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updated failed', e))
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
            partyCookVesselWash
        } = Object.assign(req.body, req.query, req.params)


        if (partyCuisines && partyCuisines.length) {
            await isValidCuisine(partyCuisines);
        }
        let updateBody = {
            partyCuisines,
            partyExperience,
            partyCookAvailability,
            partyCookVesselWash,
            partyCookProfileStatus: 1,
            updatedAt: getCurrentDateAndTime()
        }
        if (partyCookFoodType) updateBody.partyCookFoodType = partyCookFoodType;
        if (partyMaxPlates) {
            await isValidPartyPlates(partyMaxPlates);
            updateBody.partyMaxPlates = partyMaxPlates;
        }
        if (partyMaxPlates == "") updateBody.partyMaxPlates = partyMaxPlates;
        if (speciality) updateBody.speciality = speciality;

        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, {
            $set: updateBody
        }
            , { new: true })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to edit. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: req.user._id,
            partyCuisines,
            partyExperience,
            speciality,
            partyMaxPlates,
            partyCookAvailability,
            partyCookFoodType,
            partyCookVesselWash
        }, 'Profile updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Profile updated failed', e))
    }
}

exports.findHouseCookJobs = async (req, res) => {
    try {

        let {
            latitude, longitude,
            limit, page, skip,
            payment,
            cuisines, gender, jobType, sortingByCreatedAt
        } = Object.assign(req.body)

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        //Employer_Points_Validations
        // let employerPlanData = await checkClientValidPartyCateringPoints(req.user._id);
        // if (!employerPlanData) throw { statusCode: 500, responseCode: 5, msg: "Insufficient points. Please purchase plan to continue!" }
        if (cuisines && cuisines.length) {
            await isValidCuisine(cuisines);
        }
        if (payment) isValidHouseJobPayments(payment);

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        //Filterings
        let dbFilters = { status: 1, 'jobsData.isDeleted': false, 'jobsData.status': 1, 'jobsData.expiryDate': { $gte: getCurrentDateAndTime() } };
        if (cuisines) dbFilters['jobsData.cuisines'] = { $in: cuisines };
        if (jobType == 1 || jobType == 2) dbFilters['jobsData.jobType'] = jobType;
        if (jobType == 3) dbFilters['jobsData.jobType'] = { $in: [1, 2, 3] };
        if (gender && gender != 4) dbFilters['jobsData.preferredGender'] = gender;
        if (gender && gender == 4) dbFilters['jobsData.preferredGender'] = { $in: [1, 2, 3] };
        if (payment) dbFilters['jobsData.minimumPayment'] = payment;


        //Sorting_filters
        let sortFilters = { distanceInMeters: 1 }
        sortFilters.createdAt = (sortingByCreatedAt) ? parseInt(sortingByCreatedAt) : -1;

        let aggregateQuery = [];
        if (latitude && longitude) {
            //DB_Query
            const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
            const maxDistanceMeters = 25 * 1000;  //25 KM RADIUS
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

        aggregateQuery.push(
            {
                $lookup: {
                    from: "clientrequirements",
                    foreignField: "clientId",
                    localField: "_id",
                    as: "jobsData"
                }
            },
            {
                $unwind: "$jobsData"
            },
            {
                $lookup: {
                    from: "cookreports",
                    let: { requirementId: '$jobsData._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [{ $eq: ["$requirementId", "$$requirementId"] }, { $eq: ["$cookId", mongoose.Types.ObjectId(req.user._id)] }] }
                            }
                        }
                    ],
                    as: "reportsData"
                }
            },
            {
                $lookup: {
                    from: "employerreports",
                    let: { employerId: "$jobsData.clientId" },
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
                    ...dbFilters,
                    "reportsData": { $size: 0 },
                    "employerreportsData": { $size: 0 }
                }
            },
            {
                $lookup: {
                    from: 'cookactivities',
                    let: { requirementId: '$jobsData._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$requirementId', '$$requirementId'] },
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
                    let: { requirementId: '$jobsData._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$requirementId', '$$requirementId'] },
                                        { $eq: ['$cookId', mongoose.Types.ObjectId(req.user._id)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'cookApplications'
                }
            },
            {
                $lookup: {
                    from: 'cookshortlists',
                    let: { requirementId: '$jobsData._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$requirementId', '$$requirementId'] },
                                        { $eq: ['$cookId', mongoose.Types.ObjectId(req.user._id)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'cookShortlists'
                }
            },
            {
                $addFields: {
                    applicationData: {
                        $cond: {
                            if: { $gt: [{ $size: '$cookApplications' }, 0] },
                            then: { $arrayElemAt: ['$cookApplications', 0] },
                            else: null
                        }
                    },
                    shortlistData: {
                        $cond: {
                            if: { $gt: [{ $size: '$cookShortlists' }, 0] },
                            then: { $arrayElemAt: ['$cookShortlists', 0] },
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
                            if: { $gt: [{ $size: '$cookApplications' }, 0] },
                            then: true,
                            else: false
                        }
                    },
                    isShortlisted: {
                        $cond: {
                            if: { $gt: [{ $size: '$cookShortlists' }, 0] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    _id: '$jobsData._id',
                    clientId: {
                        _id: '$_id',
                        fullName: '$fullName',
                        area: '$area',
                        cityName: '$cityName',
                        provinceName: '$provinceName',
                        dp: '$dp'
                    },
                    cuisines: '$jobsData.cuisines',
                    preferredGender: '$jobsData.preferredGender',
                    jobType: '$jobsData.jobType',
                    minimumPayment: '$jobsData.minimumPayment',
                    urgency: '$jobsData.urgency',
                    breakfast: '$jobsData.breakfast',
                    lunch: '$jobsData.lunch',
                    dinner: '$jobsData.dinner',
                    vesselWash: '$jobsData.vesselWash',
                    expiryDate: '$jobsData.expiryDate',
                    status: '$jobsData.status',
                    createdAt: '$jobsData.createdAt',
                    updatedAt: '$jobsData.updatedAt',
                    distanceInMeters: 1,
                    isViewed: 1,
                    isApplied: 1,
                    applicationData: 1,
                    isShortlisted: 1,
                    shortlistData: 1
                }
            },
            {
                $sort: sortFilters
            },
        )
        let totalData = await Employer.aggregate(aggregateQuery);
        //Pagination
        aggregateQuery.push(
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            });
        let data = await Employer.aggregate(aggregateQuery);
        data = JSON.parse(JSON.stringify(data));
        if (latitude && longitude) {
            data = data.map((x) => {
                x.distanceInMeters = Math.round(x.distanceInMeters);
                x.distanceInKilometers = Math.round((x.distanceInMeters) / 1000);
                return x;
            })
        }
        let isNew = totalData.some(job => !job.isViewed);
        res.status(200).send(responseJson(1, 1, data, 'House cook jobs fetched successfully', {}, data.length, totalData.length, isNew))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'House cook jobs fetching failed', e))
    }
}

exports.viewHouseCookJob = async (req, res) => {
    try {

        let {
            id
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ requirementId: id, cookId: req.user._id });

        let jobData = await ClientRequirement.findOne({ _id: id, isDeleted: false }).populate(
            [{ path: 'clientId', select: 'gender languages occupation fullName weavyId email mobile whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages dp whatsappContact emailContact smsContact chatContact notificationStatus' }]
        )
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No house cook job found" }
        jobData = JSON.parse(JSON.stringify(jobData));

        

        let [logData, applicationData, shortlistData] = await Promise.all([
            CookActivity.create({ cookId: req.user._id, employerId: jobData.clientId._id, requirementId: id, activity: "viewed", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }),
            CookApplication.findOne({ cookId: req.user._id, requirementId: id, isDeleted: false }),
            CookShortlist.findOne({ cookId: req.user._id, requirementId: id, isDeleted: false })
        ])
        let ratingsData = await EmployerRatings.find({ employerId: jobData.clientId._id }).select({ _id: 0, createdAt: 0, updatedAt: 0, cookId: 0, employerId: 0 });
        ratingsData = JSON.parse(JSON.stringify(ratingsData));
        jobData.ratingsData = calculateEmployerRatingAverages(ratingsData);
        jobData.ratingsList = await EmployerRatings.find({ employerId: jobData.clientId._id }).populate([{ path: 'cookId', select: 'fullName dp' }, { path: 'employerId', select: 'fullName dp' }]).sort({ createdAt: -1 });

        jobData.isViewed = true;
        jobData.isApplied = (applicationData) ? true : false;
        jobData.isShortlisted = (shortlistData) ? true : false;
        res.status(200).send(responseJson(1, 1, {
            jobData,
            applicationData,
            shortlistData
        }, 'House cook job viewed successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'House cook job view failed', e))
    }
}

exports.applyHouseJob = async (req, res) => {
    try {
        let {
            id, pointsData, updateBody, cookData
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ requirementId: id, cookId: req.user._id });

        const jobData = await ClientRequirement.findOne({ _id: id, isDeleted: false });
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No house cook job found" }

        const applicationLogData = await CookApplication.findOne({ cookId: req.user._id, requirementId: id }).sort({ 'createdAt': -1 });
        if (applicationLogData) {
            if (!isDateExpired(applicationLogData.expiryDate)) throw { statusCode: 500, resposeCode: 5, msg: "Job is already applied earlier." }
        }

        let activityLogQuery = {
            isDeleted: false,
            cookId: req.user._id,
            activity: {
                $in: ['applied', 'mobileinteraction', 'chatinteraction', 'whatsappinteraction', 'cancelled']
            },
            requirementId: id
        }
        let activityLogsData = await CookActivity.find(activityLogQuery);
        if (!activityLogsData.length) {
            pointsData = await checkHouseCookValidBalance(req.user._id), updateBody = { houseDailyLimitBalance: -1, houseMonthlyLimitBalance: -1 }
            if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points. Please check tomorrow!" }
            cookData = await CookPoints.findOneAndUpdate({ _id: pointsData._id }, { $inc: updateBody }, { new: true })
        }

        let [data, logData, eventsData] = await Promise.all([
            CookApplication.create({
                cookId: req.user._id, requirementId: id, applicationStatus: 'applied',
                appliedAt: getCurrentDateAndTime(), employerId: jobData.clientId,
                expiredAt: jobData.expiryDate,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            }),
            CookActivity.create({ cookId: req.user._id, employerId: jobData.clientId, requirementId: id, activity: "applied", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }),
            ClientRequirement.findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { totalApplications: 1 } }, { new: true }).populate([{ path: "clientId" }])
        ])

        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to apply job. Try again!" }


        //Sending Push Notifications
        if (eventsData.clientId.deviceToken && eventsData.clientId.notificationStatus == 1) {
            await sendHouseJobApplicationNotification({ designation: 'your requirement', deviceToken: eventsData.clientId.deviceToken, employerId: eventsData.clientId._id, applicationId: data._id });
        }
        //For Email Message
        sendMail({
            to: eventsData.clientId.email,
            type: "houseRequirement",
            subject: `New application received for your requirement`,
            options: {
                username: eventsData.clientId.fullName
            }
        })
        res.status(200).send(responseJson(1, 1, data, 'Job Applied successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job applying failed', e))

    }
}

exports.applyHoseJobShortlist = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.body, req.query)

        if (!id) throw { statusCode: 400, responseCode: 2, msg: "Please provide id" }
        await checkIsReportedOrNot({ requirementId: id, cookId: req.user._id });

        const jobData = await ClientRequirement.findOne({ _id: id, isDeleted: false });
        if (!jobData) throw { statusCode: 400, responseCode: 2, msg: "No job found" }

        const shortistedLogData = await CookShortlist.findOne({ cookId: req.user._id, requirementId: id, isDeleted: false }).sort({ 'createdAt': -1 })
        if (shortistedLogData) {
            if (!isDateExpired(shortistedLogData.expiryDate)) throw { statusCode: 403, resposeCode: 5, msg: "Job is already shortlisted earlier." }
        }

        let [data, logData] = await Promise.all([
            CookShortlist.create({
                cookId: req.user._id,
                requirementId: id,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime(),
                expiryDate: jobData.expiryDate,
                employerId: jobData.clientId
            }),
            CookActivity.create({ cookId: req.user._id, employerId: jobData.clientId, requirementId: id, activity: "shortlisted", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        ])

        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to shortlist job. Try again!" }
        res.status(200).send(responseJson(1, 1, data, 'Job Shortlisted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Job shortlisting failed', e))

    }
}

exports.fetchShortlistedHousejobsByCook = async (req, res) => {
    try {
        let {
            id, limit, skip, page
        } = Object.assign(req.body, req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let dbQuery = { cookId: req.user._id, requirementId: { $exists: true }, isDeleted: false };
        if (id) dbQuery._id = id;

        let [data, totalData] = await Promise.all([
            CookShortlist.find(dbQuery).populate([
                { path: 'requirementId' },
                { path: 'employerId', select: 'fullName email mobile whatsappNumber dp weavyId area addressLine1 addressLine2 cityName provinceName pincode languages' }
            ]).sort({ 'appliedAt': -1 }).limit(limit).skip(skip),
            CookShortlist.find(dbQuery)
        ])

        res.status(200).send(responseJson(1, 1, data, 'Shortlisted jobs fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Shortlisted jobs fetching failed', e))
    }
}

exports.fetchAppliedHouseJobsByCook = async (req, res) => {
    try {
        let {
            id, limit, skip, page
        } = Object.assign(req.body, req.query)

        //Paginations
        limit = limit ? parseInt(limit) : 50;
        page = page ? parseInt(page) : 1;
        skip = parseInt(limit) * parseInt(page - 1);

        let [data, totalData] = await Promise.all([
            CookApplication.find({ cookId: req.user._id, requirementId: { $exists: true }, isDeleted: false, applicationStatus: { $nin: ["cancelled"] } }).populate([{
                path: 'requirementId', populate: [{ path: 'clientId', select: 'fullName email mobile whatsappNumber area addressLine1 addressLine2 cityName provinceName pincode languages dp whatsappContact emailContact smsContact chatContact notificationStatus' }]
            }]).sort({ 'appliedAt': -1 }).limit(limit).skip(skip),
            CookApplication.find({ cookId: req.user._id, requirementId: { $exists: true }, isDeleted: false, applicationStatus: { $nin: ["cancelled"] } })
        ])

        res.status(200).send(responseJson(1, 1, data, 'House cook jobs fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'House cook job fetching failed', e))
    }
}

exports.checkWhatsappNumber = async (req, res) => {
    try {
        let {
            whatsappNumber
        } = Object.assign(req.body, req.query)

        if (!whatsappNumber) throw { statusCode: 400, msg: "Please provide whatsapp number" }
        await isWhatsappNumberAvailable(whatsappNumber, (req.user._id).toString());
        res.status(200).send(responseJson(1, 1, { isNumberAvailable: true }, 'Whatsapp number checking success'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Whatsapp number checking failed', e))
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
            role: "cook",
            otp,
            cookId: req.user._id,
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
            otp
        } = Object.assign(req.body, req.query)


        let otpData = await CookVerify.findOne({ whatsapp: whatsappNumber, otp, cookId: req.user._id });
        if (!otpData) throw { statusCode: 422, responseCode: 5, msg: "Invalid otp" };

        await Cook.updateMany({ whatsappNumber }, { $unset: { whatsappNumber: "" }, $set: { whatsappNumberVerified: 0 } }, { multi: true })
        await Employer.updateMany({ whatsappNumber }, { $unset: { whatsappNumber: "" }, $set: { whatsappNumberVerified: 0 } }, { multi: true })

        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { whatsappNumber, whatsappNumberVerified: 1 }, { new: true });
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        res.status(200).send(responseJson(1, 1, { whatsappNumber, cookId: req.user._id, whatsappNumberVerified: 1 }, 'Whatsapp number updated succesfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Unable to update whatsapp number', e))

    }
}

exports.updateLoginTime = async (req, res) => {
    try {

        const user = req.user;
        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { lastLoginDateTime: getCurrentDateAndTime() } }, { new: true });
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
        if (cookMobileData && (cookMobileData._id).toString() == (req.user._id).toString()) throw { statusCode: 400, responseCode: 2, msg: "Please provide new mobile number to update" }
        if (empMobileData || (cookMobileData && (cookMobileData._id).toString() != (req.user._id).toString())) throw { statusCode: 409, responseCode: 4, msg: "This phone number is associated with an account. Please try with another!" }

        otp = generateOtp();
        message = updateMobileOtp(otp);
        console.log({ otp, message })
        let smsResponse = await sendOtp({ cookId: req.user._id, message, otp, type: 5, senderId: 'CKNCHF', templateId: 'Verify Number', mobile, role: 'cook' })

        res.status(200).send(responseJson(1, 1, {
            status: req.user.status,
            id: req.user._id,
            cookMemberId: req.user.cookMemberId,
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

        let cookMobileData = await CookVerify.findOne({ mobile, otp, cookId: req.user._id })
        if (!cookMobileData) throw { statusCode: 422, responseCode: 4, msg: "Invalid OTP" }

        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { mobile } }, { new: true })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data._id,
            cookMemberId: data.cookMemberId,
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
            message,
            role
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            email,
            mobile,
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Cook.findOne({ mobile, email, status: { $in: [1, 2, 3, 4] } });
        if (data) role = "cook";
        if (!data) {
            data = await Employer.findOne({ mobile, email, status: { $in: [1, 2, 3, 4] } });
            if (!data) throw { statusCode: 500, responsecode: 6, msg: "No account found. Try signup!" }
            role = "employer";
        }
        data = JSON.parse(JSON.stringify(data));
        if (data.status == 3) throw { status: 403, responseCode: 0, msg: "Your account has been suspended. Contact support." }

        otp = generateOtp();
        message = forgotPassword(otp);
        console.log({ otp, message })
        let smsResponse;
        if (role == "cook") smsResponse = await sendOtp({ cookId: data._id, message, otp, type: 4, senderId: 'CKNCHF', templateId: 'Reset Password CookandChef', mobile: mobile, role: 'cook' })
        if (role == "employer") smsResponse = await sendOtp({ employerId: data._id, message, otp, type: 4, senderId: 'CKNCHF', templateId: 'Reset Password CookandChef', mobile: mobile, role: 'employer' })

        res.status(200).send(responseJson(1, 1, {
            status: data.status,
            id: data._id,
            mobile: data.mobile,
            email,
            role
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
            newPassword,
            modelName,
            userId
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            mobile,
            otp,
            newPassword
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        //Otp Verification
        let otpResp = await CookVerify.findOne({ mobile, otp });
        if (!otpResp) {
            otpResp = await EmployerVerify.findOne({ mobile, otp });
            if (!otpResp) throw { statusCode: 422, responseCode: 3, msg: "Invalid OTP" }
            modelName = Employer;
            userId = otpResp.employerId;
        }
        console.log({ otpResp })
        modelName = (modelName) ? modelName : Cook;
        userId = (userId) ? userId : otpResp.cookId;
        newPassword = await bcrypt.hashSync(newPassword, 8);
        console.log({
            updatedAt: getCurrentDateAndTime(),
            passwordUpdateDateTime: getCurrentDateAndTime(),
            password: newPassword
        })
        let data = await modelName.findOneAndUpdate({ _id: userId }, {
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
        await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { email, emailVerified: 0 } }, { new: true })
        let data = await EmailVerify.create({
            email,
            cookId: req.user._id,
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
                role: 'cook',
                verificationLink: `${backendUrl}/api/v1/cook/login/updateEmailVerificationStatus?id=${data._id}&role=cook`
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
            cookId: req.user._id,
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
                role: 'cook',
                verificationLink: `${backendUrl}/api/v1/cook/login/updateEmailVerificationStatus?id=${data._id}&role=cook`
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

exports.updateEmailVerificationStatus = async (req, res) => {
    try {
        let {
            id,
            role,
            modelName
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            id,
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);


        let data = await EmailVerify.findOne({ _id: id, status: 1 });
        if (!data) throw Error("Invalid id")

        let dbQuery = {};
        if (role == "cook") modelName = Cook, dbQuery = { _id: data.cookId }
        if (role == "employer") modelName = Employer, dbQuery = { _id: data.employerId }

        data = await modelName.findOneAndUpdate(dbQuery, { $set: { email: data.email, emailVerified: 1 } }, { new: true })
        res.redirect(`${frontendUrl}/success-email`);
    }
    catch (e) {
        res.redirect(`${frontendUrl}/fail-email`);
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

        let data = await Cook.findOne({ _id: id, status: 1 });
        if (!data) throw { statusCode: 400, reponseCode: 5, msg: "Invalid id" }
        data = JSON.parse(JSON.stringify(data));
        res.status(200).send(responseJson(1, 1, data, 'Cook details fetched successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cook details fetching failed', e))
    }
}

exports.storeActivityLog = async (req, res) => {
    try {
        let {
            jobId,
            eventId,
            requirementId,
            activity,
            pointsData
        } = Object.assign(req.body)

        const requiredFields = {
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        let incrementBody, jobDbQuery, modelName;
        let type = "job";


        if (!jobId && !eventId && !requirementId) throw { statusCode: 500, responseCode: 2, msg: "Job,event or requirement is required" }
        if (jobId) pointsData = await checkChefValidBalance(req.user._id), incrementBody = { chefDailyLimitBalance: -1, chefMonthlyLimitBalance: -1 }, modelName = Jobs, jobDbQuery = { _id: jobId };
        if (eventId && req.user.memberType == 2) pointsData = await checkCateringValidBalance(req.user._id), incrementBody = { cateringDailyLimitBalance: -1, cateringMonthlyLimitBalance: -1 }, modelName = Events, jobDbQuery = { _id: eventId }, type = "event";
        if (eventId && req.user.memberType == 1) pointsData = await checkPartyCookValidBalance(req.user._id), incrementBody = { partyMonthlyLimitBalance: -1, partyDailyLimitBalance: -1 }, modelName = Events, jobDbQuery = { _id: eventId }, type = "event";
        if (requirementId) pointsData = await checkHouseCookValidBalance(req.user._id), incrementBody = { houseDailyLimitBalance: -1, houseMonthlyLimitBalance: -1 }, modelName = ClientRequirement, jobDbQuery = { _id: requirementId };
        if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points. Purchase plan to continue!" }
        console.log({ jobDbQuery })
        let jobData = await modelName.findOne(jobDbQuery);
        if (!jobData) throw { statusCode: 404, msg: `No ${type} found!` }
        if (jobData && jobData.status == 0) throw { statusCode: 403, msg: `This ${type} is already expired.` }

        let dbQuery = {
            activity,
            isDeleted: false,
            cookId: req.user._id
        };
        let filterQuery = {
            isDeleted: false,
            cookId: req.user._id,
            activity: {
                $in: ['applied', 'mobileinteraction', 'chatinteraction', 'whatsappinteraction']
            }
        }
        if (jobId) dbQuery.jobId = jobId, filterQuery.jobId = jobId;
        if (eventId) dbQuery.eventId = eventId, filterQuery.eventId = eventId;
        if (requirementId) dbQuery.requirementId = requirementId, filterQuery.requirementId = requirementId;

        let activityLogsData = await CookActivity.find(filterQuery);
        if (!activityLogsData.length) {
            console.log({ incrementBody })
            await CookPoints.findOneAndUpdate({ _id: pointsData._id }, { $inc: incrementBody }, { new: true })
        }
        dbQuery.createdAt = getCurrentDateAndTime();
        dbQuery.updatedAt = getCurrentDateAndTime();
        data = await CookActivity.create(dbQuery);
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
            jobId,
            eventId,
            requirementId,
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
        if (jobId) dbQuery.jobId = jobId;
        if (eventId) dbQuery.eventId = eventId;
        if (requirementId) dbQuery.requirementId = requirementId;
        dbQuery.cookId = (cookId) ? cookId : req.user._id;

        let data = await CookActivity.find(dbQuery).populate([
            { path: "jobId" },
            { path: 'eventId' },
            { path: 'requirementId' }
        ]).sort({ 'createdAt': -1 }).limit(limit).skip(skip);

        let totalData = await CookActivity.find(dbQuery).populate([
            { path: "jobId" },
            { path: 'eventId' },
            { path: 'requirementId' }
        ])

        res.status(200).send(responseJson(1, 1, data, 'Activity logs fetched successfully', {}, data.length, totalData.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Activity logs fetching failed', e))
    }
}

exports.viewEmployerDetails = async (req, res) => {
    try {
        let {
            employerId
        } = Object.assign(req.query)

        const requiredFields = {
            employerId
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let pointsData = await checkChefValidBalance(req.user._id);
        if (!pointsData) throw { statusCode: 402, responseCode: 3, msg: "Insufficient points. Purchase plan to continue" }

        let dbQuery = {
            isDeleted: false,
            cookId: req.user._id,
            activity: "viewed",
            employerId
        };

        let data = await Employer.findOne({ _id: employerId })
        if (!data) throw { statusCode: 500, responseCode: 2, msg: "No employer found" }

        let activityLogsData = await CookActivity.find(dbQuery);
        if (!activityLogsData.length) {
            await CookPoints.findOneAndUpdate({ _id: pointsData._id }, { $inc: { chefDailyLimitBalance: -1, chefMonthlyLimitBalance: -1 } }, { new: true })
        }
        dbQuery.createdAt = getCurrentDateAndTime();
        dbQuery.updatedAt = getCurrentDateAndTime();
        activityLogsData = await CookActivity.create(dbQuery);
        res.status(200).send(responseJson(1, 1, data, 'Employer fetched successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Employer fetching failed', e))

    }
}

exports.cancelApplication = async (req, res) => {
    try {

        let {
            id,
            modelName,
            updateId,
            updateBody
        } = Object.assign(req.body)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        let data = await CookApplication.findOne({ _id: id, cookId: req.user._id, isDeleted: false });
        if (!data) throw { statusCode: 400, responseCode: 2, msg: 'No application found' }
        if (data && data.applicationStatus !== "applied") throw { statusCode: 403, responseCode: 7, msg: "Application cannot be cancelled as the application status has been changed" }
        if (data && data.expiredAt) {
            let jobType = (data.jobId || data.requirementId) ? cookType = "job" : cookType = "event";
            if (isDateExpired(data.expiredAt)) throw { statusCode: 403, resposeCode: 5, msg: `Cancellation is failed as ${jobType} has already expired.` }
        }
        let Query = { cookId: req.user._id, activity: "applied" };
        let findBody = {};
        if (data.jobId) Query.jobId = data.jobId, modelName = Jobs, findBody._id = data.jobId, findBody.currentResponsesCount = { $gt: 0 }, updateBody = { $inc: { currentResponsesCount: - 1 }, $set: { updatedAt: getCurrentDateAndTime() } };
        if (data.eventId) Query.eventId = data.eventId, modelName = Events, findBody._id = data.eventId, updateBody = { $inc: { totalInterestsReceived: -1 } };
        if (data.requirementId) Query.requirementId = data.requirementId, findBody._id = data.requirementId, modelName = ClientRequirement, updateBody = { $inc: { totalApplications: - 1 } };
        let jobsData = await modelName.findOneAndUpdate(findBody, updateBody, { new: true });
        if (!jobsData) throw { statusCode: 500, responseCode: 0, msg: "Current responses count cannot be zero" }
        console.log(Query)
        await Promise.all([
            CookApplication.findOneAndDelete({ _id: id }),
            CookActivity.deleteMany(Query),
            delete Query.activity,
            CookActivity.create({ ...Query, activity: "cancelled", createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        ])
        res.status(200).send(responseJson(1, 1, {}, 'Application cancelled successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Application cancellation failed', e))
    }
}

exports.removeShortlistedApplication = async (req, res) => {
    try {

        let {
            jobId,
            eventId,
            requirementId
        } = Object.assign(req.body)

        const requiredFields = {
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);
        if (!jobId && !eventId && !requirementId) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid job or eventId" }

        let dbQuery = { cookId: req.user._id };
        if (jobId) dbQuery.jobId = jobId;
        if (eventId) dbQuery.eventId = eventId;
        if (requirementId) dbQuery.requirementId = requirementId;

        let data = await CookShortlist.findOne(dbQuery);
        if (!data) throw { statusCode: 400, msg: 'No data found' }

        data = await CookShortlist.deleteMany(dbQuery);
        res.status(200).send(responseJson(1, 1, {}, 'Removed successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Failed to remove', e))
    }
}

exports.disableAccount = async (req, res) => {
    try {
        await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { status: 2 } }, { new: true });
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
        await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { status: 1 } }, { new: true });
        res.status(200).send(responseJson(1, 1, {}, 'Account enabled successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account enabling failed', e))
    }
}

exports.raiseDeleteRequest = async (req, res) => {
    try {

        let disposalData = await DisposalAccounts.findOne({ cookId: req.user._id, activity: 2 });
        if (disposalData && req.user.status == 4) throw { statusCode: 500, responseCode: 0, msg: "Your previous delete request is in-progress" }

        await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { status: 4, deleteRequestedAt: getCurrentDateAndTime() } }, { new: true });
        await DisposalAccounts.create({ cookId: req.user._id, activity: 2, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), previousStatus: req.user.status });
        res.status(200).send(responseJson(1, 1, {}, 'Account delete request raised successfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Account delete request failed', e))
    }
}

exports.reportSubmit = async (req, res) => {
    try {

        let {
            jobId,
            eventId,
            requirementId,
            reason,
            comment
        } = Object.assign(req.body)

        const requiredFields = {
            reason
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (!jobId && !eventId && !requirementId) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid job or eventId" }

        let modelName;
        let findQuery, errorMessage, createQuery;
        if (jobId) modelName = Jobs, findQuery = { _id: jobId }, createQuery = { jobId }, errorMessage = 'No job found';
        if (eventId) modelName = Events, findQuery = { _id: eventId }, createQuery = { eventId }, errorMessage = 'No event found';
        if (requirementId) modelName = ClientRequirement, findQuery = { _id: requirementId }, createQuery = { requirementId }, errorMessage = 'No job found';
        let data = await modelName.findOne(findQuery);
        if (!data) throw { statusCode: 500, responsecode: 0, msg: errorMessage }

        let reportData = await CookReports.findOne({ ...createQuery, cookId: req.user._id });
        if (reportData) throw { statusCode: 500, responsecode: 0, msg: "Already reported earlier." }
        reportData = await CookReports.create({ ...createQuery, cookId: req.user._id, reason, comment, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        await Promise.all([
            CookApplication.deleteMany({ ...createQuery, cookId: req.user._id }),
            CookShortlist.deleteMany({ ...createQuery, cookId: req.user._id }),
            CookActivity.deleteMany({ ...createQuery, cookId: req.user._id })
        ]);
        res.status(200).send(responseJson(1, 1, {}, 'Reported successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Reporting failed', e))
    }
}

exports.generateResume = async (req, res) => {
    try {
        let {
            name, email, mobile, currentDesignation, profile, hobbies, awards, cuisines,
            additionalInfo, workExperience, skills, education, templateId, address, profileImage
        } = Object.assign(req.body)

        const requiredFields = {
            name, email, mobile, templateId
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let templateData = await ResumeTemplate.findOne({ _id: templateId });
        if (!templateData) throw { statusCode: 404, responseCode: 0, msg: "No template found. Try again!" }
        // if (req.user.resumeBuilder == 0) throw { statusCode: 402, responseCode: 0, msg: 'You don`t have active plan to generate resume. Please purchase plan to continue!' }

        let resume = await resumeGen({
            name, email, mobile, currentDesignation, profile, hobbies, awards, cuisines,
            additionalInfo, workExperience, skills, education, address, profileImage, template: templateData.template
        });

        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { resume, resumeBuilder: 0, resumeBuilderStatus: 1 } }, { new: true })
        let profilePercent = getCookProfilePercent(data);
        await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { profilePercent } }, { new: true });
        await ResumeBuilder.create({ cookId: req.user._id, templateId, resumeUrl: resume, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        res.status(200).send(responseJson(1, 1, { resume }, 'Resume generated successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Resume generation failed', e))
    }
}

exports.getDashboardData = async (req, res) => {
    try {

        // let [totalAppliedCount, totalViewedCount, totalMobileInteractionsCount, totalWhatsappInteractionscount] = await Promise.all([
        //     CookApplication.find({ cookId: req.user._id }).countDocuments(),
        //     CookActivity.find({ cookId: req.user._id, activity: 'viewed' }).countDocuments(),
        //     CookActivity.find({ cookId: req.user._id, activity: 'mobileinteraction' }).countDocuments(),
        //     CookActivity.find({ cookId: req.user._id, activity: 'whatsappinteraction' }).countDocuments(),
        // ]);
        let pointsData = await CookPoints.findOne({ cookId: req.user._id })
        let points = {};
        if (req.user.memberType == 1 && req.user.cookType == 2) {
            points.chefTotalDailyPointsBalance = pointsData.chefDailyLimit;
            points.chefTotalMonthlyPointsBalance = pointsData.chefMonthlyLimit;
            points.chefCurrentDailyPointsBalance = pointsData.chefDailyLimitBalance;
            points.chefCurrentMonthlyPointsBalance = pointsData.chefMonthlyLimitBalance;
        }
        if (req.user.memberType == 1 && req.user.cookType == 1) {
            points.houseCookTotalDailyPointsBalance = pointsData.houseDailyLimit;
            points.houseCookTotalMonthlyPointsBalance = pointsData.houseMonthlyLimit;
            points.houseCookCurrentDailyPointsBalance = pointsData.houseDailyLimitBalance;
            points.houseCookCurrentMonthlyPointsBalance = pointsData.houseMonthlyLimitBalance;
        }
        if (req.user.partyCook == 1) {
            points.partyCookTotalDailyPointsBalance = pointsData.partyDailyLimit;
            points.partyCookTotalMonthlyPointsBalance = pointsData.partyMonthlyLimit;
            points.partyCookCurrentDailyPointsBalance = pointsData.partyDailyLimitBalance;
            points.partyCookCurrentMonthlyPointsBalance = pointsData.partyMonthlyLimitBalance;
        }
        if (req.user.memberType == 2) {
            points.cateringTotalDailyPointsBalance = pointsData.cateringDailyLimit;
            points.cateringTotalMonthlyPointsBalance = pointsData.cateringMonthlyLimit;
            points.cateringCurrentDailyPointsBalance = pointsData.cateringDailyLimitBalance;
            points.cateringCurrentMonthlyPointsBalance = pointsData.cateringMonthlyLimitBalance;
        }
        res.status(200).send(responseJson(1, 1, points, 'Dashboard fetched successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Dashboard fetching failed', e))
    }
}

exports.revokeDeleteRequest = async (req, res) => {
    try {


        let disposalData = await DisposalAccounts.findOne({ cookId: req.user._id, activity: 2 });
        if (!disposalData) throw { statusCode: 500, responseCode: 0, msg: "No request found" }

        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { status: disposalData.previousStatus }, $unset: { deleteRequestedAt: '' } }, { new: true })
        disposalData = await DisposalAccounts.findOneAndDelete({ _id: disposalData._id });

        res.status(200).send(responseJson(1, 1, {}, 'Delete request revoked successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Delete request revoking failed', e))
    }
}

exports.updateWeavyId = async (req, res) => {
    try {
        if (!req.body.weavyId) throw { statusCode: 400, responseCode: 2, msg: "Please provide weavyId." }
        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { weavyId: req.body.weavyId } }, { new: true });
        res.status(200).send(responseJson(1, 1, data, 'Updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Updated successfully!', e))
    }
}

exports.changeRole = async (req, res) => {
    try {
        let {
            memberType,
            cookType,
            partyCook,
            password
        } = Object.assign(req.body)

        const requiredFields = {
            memberType,
            password
        }

        if (memberType == 1) requiredFields.cookType = cookType, requiredFields.partyCook = partyCook;
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        const isPasswordMatch = bcrypt.compareSync(password, req.user.password);
        if (!isPasswordMatch) throw { statusCode: 400, responseCode: 6, msg: "Invalid password. Try again!" }
        delete req.body.password;

        let data;
        if (memberType == 2) {
            data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $unset: { cookType: '', partyCook: '' }, $set: { memberType: 2 } }, { new: true })
            await Promise.all([
                CookActivity.deleteMany({ cookId: req.user._id }),
                CookApplication.deleteMany({ cookId: req.user._id }),
                CookShortlist.deleteMany({ cookId: req.user._id }),
                CookReports.deleteMany({ cookId: req.user._id }),
                CookPoints.findOneAndUpdate({ cookId: data._id }, {
                    cookId: data._id,
                    cateringDailyLimit: 10, cateringMonthlyLimit: 50, cateringDailyLimitBalance: 10, cateringMonthlyLimitBalance: 50,
                    planStartDate: getCurrentDateAndTime(), planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                    createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
                }, { new: true })
            ])
        }
        if (memberType == 1) {
            data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: { ...req.body } }, { new: true });
            if (data.cookType == 1) {
                await Promise.all([
                    CookActivity.deleteMany({ cookId: req.user._id, jobId: { $exists: true } }),
                    CookApplication.deleteMany({ cookId: req.user._id, jobId: { $exists: true } }),
                    CookShortlist.deleteMany({ cookId: req.user._id, jobId: { $exists: true } }),
                    CookReports.deleteMany({ cookId: req.user._id, jobId: { $exists: true } })
                ]);
            }
            if (data.cookType == 2) {
                await Promise.all([
                    CookActivity.deleteMany({ cookId: req.user._id, requirementId: { $exists: true } }),
                    CookApplication.deleteMany({ cookId: req.user._id, requirementId: { $exists: true } }),
                    CookShortlist.deleteMany({ cookId: req.user._id, requirementId: { $exists: true } }),
                    CookReports.deleteMany({ cookId: req.user._id, requirementId: { $exists: true } })
                ])

            }
            if (data.partyCook == 0) {
                await Promise.all([
                    CookActivity.deleteMany({ cookId: req.user._id, eventId: { $exists: true } }),
                    CookApplication.deleteMany({ cookId: req.user._id, eventId: { $exists: true } }),
                    CookShortlist.deleteMany({ cookId: req.user._id, eventId: { $exists: true } }),
                    CookReports.deleteMany({ cookId: req.user._id, eventId: { $exists: true } }),
                ])
            }
            await CookPoints.findOneAndUpdate({ cookId: data._id }, {
                chefDailyLimit: 10, chefMonthlyLimit: 50, chefDailyLimitBalance: 10, chefMonthlyLimitBalance: 50,
                cookId: data._id, partyDailyLimit: 10, partyMonthlyLimit: 50, partyDailyLimitBalance: 10, partyMonthlyLimitBalance: 50,
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



exports.storeEmployerRating = async (req, res) => {
    try {

        let {
            employerId,
            workculture,
            behaviour,
            salary,
            facilities,
            comment
        } = Object.assign(req.body)

        const requiredFields = {
            employerId,
            workculture,
            behaviour,
            salary,
            facilities
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let cookData = await Employer.findOne({ _id: employerId, status: { $nin: [0] } });
        if (!cookData) throw { statusCode: 404, responseCode: 0, msg: "No employer found" }

        if (typeof workculture != "number" || workculture > 5 || workculture < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid workculture value" }
        if (typeof behaviour != "number" || behaviour > 5 || behaviour < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid behaviour value" }
        if (typeof salary != "number" || salary > 5 || salary < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid salary value" }
        if (typeof facilities != "number" || facilities > 5 || facilities < 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide valid facilities value" }

        let data = await EmployerRatings.findOneAndUpdate({ cookId: req.user._id, employerId }, {
            $set: {
                employerId,
                workculture,
                behaviour,
                salary,
                facilities,
                comment,
                cookId: req.user._id,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            }
        }, { new: true, upsert: true })
        if (!data) throw { statusCode: 500, responseCode: 0, msg: "Unable to add rating. Try again" }
        res.status(200).send(responseJson(1, 1, data, 'Rating submitted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cook rating failed', e))
    }
}


exports.updateJobSeeking = async (req, res) => {
    try {
        let {
            jobSeeking
        } = Object.assign(req.body)

        const requiredFields = {
            jobSeeking
        }

        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);


        let updateBody = {
            updatedAt: getCurrentDateAndTime()
        }

        if (jobSeeking !== 0 && jobSeeking !== 1) throw { statusCode: 400, msg: "Please provide a valid job seeking value!" }
        if (jobSeeking != null && jobSeeking != undefined) updateBody.jobSeeking = jobSeeking;

        let data = await Cook.findOneAndUpdate({ _id: req.user._id }, { $set: updateBody }, { new: true })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to edit. Try again!" }
        data = JSON.parse(JSON.stringify(data));
        let profilePercent = getCookProfilePercent(data);
        data = await Cook.findOneAndUpdate({ _id: data._id }, { $set: { profilePercent: profilePercent } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        //Sending to frontend
        res.status(200).send(responseJson(1, 1, {}, 'Jobseeking updated successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Jobseeking updating failed!', e))
    }
}



