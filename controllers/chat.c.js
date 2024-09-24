let { chat } = require('../config/config')
let { isValidDate, responseJson, sendMail, isRequestDataValid, invoiceGen, capitalizeEveryInnerWord, checkValueType, storeResumeTemplate } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Admin, Role, Events, Transaction, Cook, CookPlan, Employer, ClientPlan, EmployerPlan, ClientPoints, ClientRequirement, EmployerPoints, Jobs, CSExecutive, DisposalAccounts,
    CookActivity, CookApplication, CookPoints, CookShortlist, CookVerify, EmailVerify, EmployerActivity, EmployerVerify,
    CookReports, EmployerReports, Ticket, ResumeTemplate, AdminAuth } = require('../models/index')
const moment = require("moment");
const axios = require("axios");

exports.createChatUser = async (req, res) => {
    try {
        let {
            uid,
            name,
            picture

        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            uid,
            name,
            picture
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let fetch;

        try {
            // Use dynamic import to load the 'node-fetch' module
            fetch = (await import('node-fetch')).default;
        } catch (error) {
            console.error('Error during dynamic import:', error);
        }

        // const apiUrl = "https://009c9ffe18594d13bacdea6dd57d3b41.weavy.io/api/users/classic012/tokens";
        // const headers = {
        //     'Authorization': "Bearer wys_9Xq10KMQQrFJXzhhNO8QTUuz49pBcB1NN1tQ",
        //     'Content-Type': 'application/json',
        // };
        // console.log({ apiUrl, headers, body: req.body });
        let response = await fetch(new URL(`/api/users/sic12/tokens`, "https://009c9ffe18594d13bacdea6dd57d3b41.weavy.io"), {
            method: "POST",
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer wys_9Xq10KMQQrFJXzhhNO8QTUuz49pBcB1NN1tQ`,
            },
            body: JSON.stringify({ name: "classic012", expires_in: 3600 }),
        });

        response = response.json()
        res.status(201).send(responseJson(1, 1, response, 'User creation success'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'User creation failed', e))
    }
}