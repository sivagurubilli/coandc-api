let { isValidDate, responseJson, sendMail, isRequestDataValid, invoiceGen, capitalizeEveryInnerWord, checkValueType, storeResumeTemplate } = require("../utils/appUtils");
let { HelpChat } = require('../models/index')
let { getCurrentDateAndTime } = require("../helpers/dates");
const crypto = require("crypto");


exports.addHelpChat = async (req, res) => {
    try {
        let {
            link,
            question,
            answer,
            role
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            link,
            question,
            role
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role !== "cook" && role !== "employer" && role !== "client" && role !== "website") throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid role" }
        let data = await HelpChat.create({ role, question, answer, link, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() })
        if (!data) throw { statusCode: 500, responseCode: 7, msg: "Unable to add. Try again" }
        res.status(200).send(responseJson(1, 1, data, 'Helpchat added successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Helpchat adding failed', e))

    }
}

exports.getHelpChatList = async (req, res) => {
    try {
        let {
            link,
            question,
            answer,
            role,
            limit, page, skip,
            id
        } = Object.assign(req.query)

        limit = limit ? parseInt(limit) : 50
        page = page ? parseInt(page) : 1
        skip = parseInt(limit) * parseInt(page - 1)

        if (role && role !== "cook" && role !== "employer" && role !== "client" && role !== "website") throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid role" }
        let dbQuery = {};
        if (id) dbQuery._id = id;
        if (role) dbQuery.role = role;

        let data = await HelpChat.find(dbQuery).sort({ createdAt: 1 }).limit(limit).skip(skip);
        let totalDataCount = await HelpChat.find(dbQuery).countDocuments();

        res.status(200).send(responseJson(1, 1, data, 'Helpchat fetched successfully', {}, data.length, totalDataCount))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Helpchat fetching failed', e))

    }
}

exports.editHelpChat = async (req, res) => {
    try {
        let {
            link,
            question,
            answer,
            role,
            id
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (role && role !== "cook" && role !== "employer" && role !== "client" && role !== "website") throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid role" }
        let data = await HelpChat.findOne({ _id: id });
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No data found!" }

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        if (link) updateBody.link = link;
        if (question) updateBody.question = question;
        if (role) updateBody.role = role;
        if (answer && answer !== undefined && answer !== null) updateBody.answer = answer;

        data = await HelpChat.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
        res.status(200).send(responseJson(1, 1, data, 'Helpchat updated successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Helpchat updation failed', e))

    }
}

exports.deleteHelpChat = async (req, res) => {
    try {
        let {
            id
        } = Object.assign(req.body, req.query)

        const requiredFields = {
            id
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let data = await HelpChat.findOne({ _id: id });
        if (!data) throw { statusCode: 400, responseCode: 0, msg: "No data found!" }

        data = await HelpChat.findOneAndDelete({ _id: id });
        res.status(200).send(responseJson(1, 1, {}, 'Helpchat deleted successfully'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Helpchat deletion failed', e))
    }
}