let { privateKey, adminEmail, supportEmail } = require('../config/config')
let appStatic = require('../config/appStatic.js').data
let { generateMemberId, responseJson, sendMail, isRequestDataValid, sendOtp, generateOtp, generateTicketNumber } = require('../utils/appUtils');
let { HelpChat, Cuisines, Province, Languages, Qualification, PartyPlates, CateringPlates, Cook, Employer, Role, Ticket } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getCurrentDate, getCurrentDateAndTime, addDaysToDate } = require('../helpers/dates');
const { checkLoginMacAddress } = require('../helpers/user');

exports.genderDropdownValues = async (req, res) => {
    try {
        const data = [
            { id: 1, value: "Male" },
            { id: 2, value: "Female" },
            { id: 3, value: "Other" }
        ]
        res.status(200).send(responseJson(1, 1, data, 'Gender dropdown success'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Gender dropdown failed', e))
    }
}

exports.fetchCuisinesList = async (req, res) => {
    try {

        const data = await Cuisines.find({});
        res.status(200).send(responseJson(1, 1, data, 'Cuisines list fetched successfully', {}, data.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cuisines list fetch failed', e))
    }
}

exports.createCateringPlate = async (req, res) => {
    try {
        const expectedKeys = ['value'];
        const payload = req.body;
        const extraKeys = Object.keys(payload).filter(key => !expectedKeys.includes(key));
        if (extraKeys.length > 0) throw { statusCode: 400, responseCode: 2, msg: "Unexpected keys in payload" }
        if (!req.body.value) throw { statusCode: 400, responseCode: 2, msg: "value is required" }
        const data = await CateringPlates.findOneAndUpdate({ value: req.body.value }, { $set: { value: req.body.value } }, { new: true, upsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Catering Plates created successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Catering Plates creation failed', e))
    }
}

exports.createPartyPlates = async (req, res) => {
    try {
        const expectedKeys = ['value'];
        const payload = req.body;
        const extraKeys = Object.keys(payload).filter(key => !expectedKeys.includes(key));
        if (extraKeys.length > 0) throw { statusCode: 400, responseCode: 2, msg: "Unexpected keys in payload" }
        if (!req.body.value) throw { statusCode: 400, responseCode: 2, msg: "value is required" }
        const data = await PartyPlates.findOneAndUpdate({ value: req.body.value }, { $set: { value: req.body.value } }, { new: true, upsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Party Plates created successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Party Plates Value creation failed', e))
    }
}

exports.createQualification = async (req, res) => {
    try {
        const expectedKeys = ['qualificationName'];
        const payload = req.body;
        const extraKeys = Object.keys(payload).filter(key => !expectedKeys.includes(key));
        if (extraKeys.length > 0) throw { statusCode: 400, responseCode: 2, msg: "Unexpected keys in payload" }
        if (!req.body.qualificationName) throw { statusCode: 400, responseCode: 2, msg: "qualificationName is required" }
        const data = await Qualification.findOneAndUpdate({ qualificationName: req.body.qualificationName }, { $set: { qualificationName: req.body.qualificationName } }, { new: true, upsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Qualification created successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Qualification creation failed', e))
    }
}

exports.createLanguages = async (req, res) => {
    try {
        const expectedKeys = ['languageName'];
        const payload = req.body;
        const extraKeys = Object.keys(payload).filter(key => !expectedKeys.includes(key));
        if (extraKeys.length > 0) throw { statusCode: 400, responseCode: 2, msg: "Unexpected keys in payload" }
        if (!req.body.languageName) throw { statusCode: 400, responseCode: 2, msg: "languageName is required" }
        const data = await Languages.findOneAndUpdate({ languageName: req.body.languageName }, { $set: { languageName: req.body.languageName } }, { new: true, upsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Language created successfully'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Language creation failed', e))
    }
}

exports.createProvince = async (req, res) => {
    try {
        const expectedKeys = ['provinceName'];
        const payload = req.body;
        const extraKeys = Object.keys(payload).filter(key => !expectedKeys.includes(key));
        if (extraKeys.length > 0) throw { statusCode: 400, responseCode: 2, msg: "Unexpected keys in payload" }
        if (!req.body.provinceName) throw { statusCode: 400, responseCode: 2, msg: "provinceName is required" }
        const data = await Province.findOneAndUpdate({ provinceName: req.body.provinceName }, { $set: { provinceName: req.body.provinceName } }, { new: true, upsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Province created successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Province creation failed', e))
    }
}

exports.createCuisine = async (req, res) => {
    try {
        const expectedKeys = ['cuisineName'];
        const payload = req.body;
        const extraKeys = Object.keys(payload).filter(key => !expectedKeys.includes(key));
        if (extraKeys.length > 0) throw { statusCode: 400, responseCode: 2, msg: "Unexpected keys in payload" }
        if (!req.body.cuisineName) throw { statusCode: 400, responseCode: 2, msg: "cuisineName is required" }
        const data = await Cuisines.findOneAndUpdate({ cuisineName: req.body.cuisineName }, { $set: { cuisineName: req.body.cuisineName } }, { new: true, upsert: true, setDefaultsOnInsert: true })
        res.status(200).send(responseJson(1, 1, data, 'Cuisine created successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Cuisine creation failed', e))
    }
}

exports.fetchProvince = async (req, res) => {
    try {

        let data = await Province.find({}).sort({ provinceName: 1 });
        res.status(200).send(responseJson(1, 1, data, 'Province fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Province fetching failed', e))

    }
}

exports.fetchLanguage = async (req, res) => {
    try {

        let data = await Languages.find({}).sort({ languageName: 1 });
        res.status(200).send(responseJson(1, 1, data, 'Languages fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Languages fetching failed', e))

    }
}

exports.fetchQualification = async (req, res) => {
    try {

        let data = await Qualification.find({});
        res.status(200).send(responseJson(1, 1, data, 'Qualification fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Qualification fetching failed', e))

    }
}

exports.fetchPartyPlates = async (req, res) => {
    try {

        let data = await PartyPlates.find({}).sort({ value: 1 });
        res.status(200).send(responseJson(1, 1, data, 'PartyPlates fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'PartyPlates fetching failed', e))

    }
}

exports.fetchCateringPlates = async (req, res) => {
    try {

        let data = await CateringPlates.find({}).sort({ value: 1 });
        res.status(200).send(responseJson(1, 1, data, 'Catering Plates fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Catering Plates fetching failed', e))

    }
}

exports.commonLogin = async (req, res) => {
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

        console.log("Common Login Api Called")

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
        let collectionName = Cook;
        let role = "cook";
        if (!data) {
            data = await Employer.findOneAndUpdate(dbQuery, { $set: updateQuery }, { new: true });
            if (!data) throw { statusCode: 401, responsecode: 5, msg: "No account found.Try signup" }
            if (data && data.status == 3) throw { statusCode: 401, responseCode: 3, msg: "Your account is suspended.Contact support team" }
            data = JSON.parse(JSON.stringify(data));
            role = "employer";
            collectionName = Employer;
        }
        console.log("Account existed")
        if (data && data.status == 3) throw { statusCode: 403, responseCode: 3, msg: "Your account is suspended.Contact support team" }
        if (data && data.status == 0) throw { statusCode: 403, responseCode: 4, msg: "Your account is not verified.Try register again" }

        const isPasswordMatch = bcrypt.compareSync(password, data.password);
        if (!isPasswordMatch) throw { statusCode: 401, responseCode: 6, msg: "Invalid password.Try again" }
        console.log("Account Password matches")

        //Checking MAC address limit
        // await checkLoginMacAddress(loginMAC, data._id);
        data = await collectionName.findOneAndUpdate({ _id: data._id }, { $set: { lastLoginDateTime: getCurrentDateAndTime() } }, { new: true })
        data = JSON.parse(JSON.stringify(data));

        data.token = jwt.sign({ id: data._id }, privateKey, { expiresIn: 60 * 60 * 24 * 365 });
        data.role = role;

        console.log("Login success")
        res.status(200).send(responseJson(1, 1, data, 'Logged in successfully!'))

    }
    catch (e) {
        console.log({ LoginError: e.message })
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Login failed!', e))
    }
}

exports.changeLoginPassword = async (req, res) => {
    try {

        let {
            newPassword,
            oldPassword,
            modelName
        } = Object.assign(req.body, req.query, req.params)

        if (req.user.role == "cook") modelName = Cook;
        if (req.user.role == "employer") modelName = Employer;

        let data = await modelName.findOne({ _id: req.user._id });
        const isOldPasswordMatch = bcrypt.compareSync(oldPassword, data.password);
        if (!isOldPasswordMatch) throw { statusCode: 500, responseCode: 5, msg: "Old password incorrect" }
        const isNewPasswordMatch = bcrypt.compareSync(newPassword, data.password);
        if (isNewPasswordMatch) throw { statusCode: 500, responseCode: 6, msg: "New password cannot be the same as your old password" }

        newPassword = bcrypt.hashSync(newPassword, 8);
        data = await modelName.findOneAndUpdate({ _id: req.user._id }, { $set: { password: newPassword, passwordUpdateDateTime: getCurrentDateAndTime() } }, { new: true });
        res.status(200).send(responseJson(1, 1, {}, 'Account password has been changed successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Changing password failed!', e))
    }
}

exports.editPrivacySettings = async (req, res) => {
    try {

        let {
            modelName,
            smsContact,
            whatsappContact,
            notificationStatus,
            chatContact
        } = Object.assign(req.body, req.query, req.params)

        if (req.user.role == "cook") modelName = Cook;
        if (req.user.role == "employer") modelName = Employer;
        let updateBody = { updatedAt: getCurrentDateAndTime() };

        if (smsContact == 0 || smsContact == 1) updateBody.smsContact = smsContact;
        if (whatsappContact == 0 || whatsappContact == 1) updateBody.whatsappContact = whatsappContact;
        if (chatContact == 0 || chatContact == 1) updateBody.chatContact = chatContact;
        if (notificationStatus == 0 || notificationStatus == 1) updateBody.notificationStatus = notificationStatus;
        console.log({ updateBody })
        data = await modelName.findOneAndUpdate({ _id: req.user._id }, { $set: updateBody }, { new: true });
        res.status(200).send(responseJson(1, 1, updateBody, 'Privacy settings updated succesfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Privacy settings updation failed!', e))
    }
}

exports.createRole = async (req, res) => {
    try {
        let {
            roleName

        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            roleName
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await Role.findOneAndUpdate({ roleName: roleName.trim().toLowerCase() }, { $set: { roleName: roleName.trim().toLowerCase() } }, { new: true, upsert: true });
        res.status(200).send(responseJson(1, 1, data, 'Role created succesfully!'))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Role creation failed!', e))
    }
}

exports.getRoles = async (req, res) => {
    try {

        let {
            id,
            roleName

        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {

        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let dbQuery = {};
        if (id) dbQuery._id = id;
        if (roleName) dbQuery.roleName = roleName;
        let data = await Role.find(dbQuery);
        res.status(200).send(responseJson(1, 1, data, 'Roles fetched succesfully!', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Roles fetching failed!', e))
    }
}

exports.raiseTicket = async (req, res) => {
    try {

        let {
            name, email, subject, message, mobile

        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            name, email, subject, message, mobile
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let requestId = await generateTicketNumber();
        let data = await Ticket.create({
            name, email, subject, message, mobile, ticketNumber: requestId, createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime()
        });
        if (!data) throw { statuCode: 500, responseCode: 0, msg: "Unable to submit the request. Try again" }

        //Sending Mail 
        sendMail({
            to: supportEmail,
            subject,
            type: 'contactUs',
            options: {
                name,
                email,
                mobile,
                message,
                subject,
                requestId
            }
        })

        res.status(200).send(responseJson(1, 1, data, 'Request submitted succesfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Request submission failed!', e))
    }
}

exports.initiateWeavyId = async (req, res) => {
    try {

        let {
            id,
            weavyId,
            role
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            id,
            weavyId,
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role !== "cook" && role !== "employer") throw { statusCode: 400, responseCode: 0, msg: "Please provide a valid role." }
        let modelName = (role == "cook") ? Cook : Employer;
        let data = await modelName.findOneAndUpdate({ _id: id }, { $set: { weavyId, updatedAt: getCurrentDateAndTime() } }, { new: true });
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No profile found" }
        res.status(200).send(responseJson(1, 1, {}, 'Updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'WeavyId updation failed', e))
    }
}

