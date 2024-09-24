
let { responseJson, sendMail, convertDateFormat, generateMemberId, isRequestDataValid, invoiceGen, sendNotice, resumeGen, capitalizeEveryInnerWord } = require("../utils/appUtils.js");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { CookApplication, Admin, Role, EmployerPoints, Jobs, Transaction, CookPlan, Employer, ClientPlan, EmployerPlan, Province, Qualification, Cook, CookPoints, ClientRequirement, ClientPoints } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans.js");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate } = require("../helpers/dates.js");
const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require('bcryptjs')
const path = require("path");
const xlsx = require('xlsx');
const fs = require('fs');
const { getCookProfilePercent, getEmployerProfilePercent } = require("../helpers/points.js");
const axios = require('axios');

exports.importJobs = async (req, res) => {
    try {

        const excelFileName = 'oldjobs.xls';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        jsonData = jsonData.map((x) => {
            if (x.createdAt) {
                const timestamp = (x.createdAt - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.createdAt = formattedDate
            }
            if (x.expiryDate) {
                const timestamp = (x.expiryDate - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.expiryDate = formattedDate
            }
            if (x.locationCoordinates) {
                let coordinates = (x.locationCoordinates).split(',');
                coordinates = coordinates.map(Number);
                coordinates = coordinates.reverse();
                x.locationCoordinates = { type: "Point", coordinates }
            }
            x.cuisines = (x.cuisines && typeof x.cuisines == 'string') ? (x.cuisines).split(',') : [];
            x.updatedAt = getCurrentDateAndTime();
            x.employerUid = x["empUid "];
            return x;
        });
        let i = 0;
        let nonUsers = [];
        let mainData = [];
        for (let x of jsonData) {
            i++;
            let employer = await Employer.findOne({ oldUid: x.employerUid }).select('_id');
            // let points = await EmployerPoints.findOneAndUpdate({ _id: x.employerPointsId }, { $inc: { currentJobPoints: -1 }, $set: { updatedAt: getCurrentDateAndTime() } }, { new: true });
            // x.maximumResponsesCount = points.totalResponsePoints;
            if (employer) x.employerId = employer._id, mainData.push(x);
            else if (!employer) nonUsers.push(x.employerUid);
            console.log({ i })
        }
        // await Jobs.insertMany(mainData);
        res.status(200).send({ success: true, jsonlength: jsonData.length, nonUsers, nonUsersLength: nonUsers.length, totalength: mainData.length, jsonData: mainData })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.importJobApplications = async (req, res) => {
    try {

        const excelFileName = 'applications.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        let jobs = [];

        jsonData = jsonData.map((x) => {
            if (x.date) {
                const timestamp = (x.date - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.createdAt = formattedDate
                x.updatedAt = formattedDate

            }
            x.applicationStatus = (x.status).toLowerCase();
            if (x.applicationStatus == 'on hold') x.applicationStatus = 'onhold';
            jobs.push(x.jobId);
            return x;
        });
        let i = 0;
        for (let x of jsonData) {
            i++;
            console.log({ i })
            let jobs = await Jobs.findOne({ _id: x.jobId });
            x.employerId = jobs.employerId;
            x.employerPointsId = jobs.employerPointsId;
            x.expiredAt = jobs.expiryDate;
            let cook = await Cook.findOne({ oldUid: x.cookOldUid });
            x.cookId = cook._id;
            await Jobs.findOneAndUpdate({ _id: x.jobId }, { $inc: { currentResponsesCount: 1 } }, { new: true })
        }
        await CookApplication.insertMany(jsonData);
        res.status(200).send({ success: true })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.importClients = async (req, res) => {
    try {

        const excelFileName = 'clients.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        jsonData = jsonData.map((x) => {

            if (x.lastLoginDateTime) {
                const timestamp = (x.lastLoginDateTime - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.lastLoginDateTime = formattedDate

            }
            if (x.createdAt) {
                const timestamp = (x.createdAt - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.createdAt = formattedDate
            }
            if (x.dob) {
                const timestamp = (x.dob - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.dob = formattedDate
            }
            if (x.cityCoordinates) {
                let coordinates = (x.cityCoordinates).split(',');
                coordinates = coordinates.map(Number);
                x.cityCoordinates = { type: "Point", coordinates }
            }
            if (x.areaCoordinates) {
                let coordinates = (x.areaCoordinates).split(',');
                coordinates = coordinates.map(Number);
                x.areaCoordinates = { type: "Point", coordinates }
            }

            x.languages = (x.languages && typeof x.languages == 'string') ? (x.languages).split(',') : [];
            x.updatedAt = getCurrentDateAndTime();
            x.basicProfileStatus = x.profile_complete;
            x.loginIP = "127.0.0.1";
            x.loginMAC = "127.0.0.1";
            x.registerIP = "127.0.0.1";
            x.registerMAC = "127.0.0.1";
            x.profilePercent = Math.round(getEmployerProfilePercent(x));
            x.memberType = 1;
            x.employeeMemberId = (x.memberType == 1) ? generateMemberId("client") : generateMemberId("employer");
            x.password = bcrypt.hashSync((x.password).toString(), 8);
            return x;
        });
        for (let x of jsonData) {
            let clientData = await Employer.create({ ...x });
            let data = await ClientPoints.create({
                clientId: clientData._id,
                planType: 'free', planStartsAt: clientData.createdAt, planExpiresAt: `${(moment(addDaysToDate(178)).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                totalEventPoints: 2, totalHouseCookPoints: 20, totalPartyCateringPoints: 2,
                currentEventPoints: 2, currentHouseCookPoints: 20, currentPartyCateringPoints: 2,
                createdAt: clientData.createdAt, updatedAt: clientData.createdAt
            })
        }
        res.status(200).send({ success: true, jsonlength: jsonData.length, data: jsonData })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.importHouseJobs = async (req, res) => {
    try {

        const excelFileName = 'clients.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        let jobData = [];
        jsonData = jsonData.map((x) => {
            if (x.reqCreatedAt) {
                const timestamp = (x.reqCreatedAt - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.reqCreatedAt = formattedDate
            }
            if (x.expiryDate) {
                const timestamp = (x.expiryDate - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.expiryDate = formattedDate
            }
            if (typeof x.breakfast == "string" && (x.breakfast).toLowerCase() == "yes") x.breakfast = 1;
            if (typeof x.breakfast == "string" && (x.breakfast).toLowerCase() == "no") x.breakfast = 0;
            if (typeof x.lunch == "string" && (x.lunch).toLowerCase() == "yes") x.lunch = 1;
            if (typeof x.lunch == "string" && (x.lunch).toLowerCase() == "no") x.lunch = 0;
            if (typeof x.dinner == "string" && (x.dinner).toLowerCase() == "yes") x.dinner = 1;
            if (typeof x.dinner == "string" && (x.dinner).toLowerCase() == "no") x.dinner = 0;

            x.cuisines = (x.cuisines && typeof x.cuisines == 'string') ? (x.cuisines).split(',') : [];
            x.cuisines = (x.cuisines).map((y) => { y = y.trim(); return y; })
            if (x.jobType && x.minimumPayment && x.expiryDate) {
                jobData.push({
                    cuisines: x.cuisines, preferredGender: x.preferredGender, status: x.status, jobType: x.jobType, minimumPayment: x.minimumPayment,
                    urgency: x.urgency, breakfast: x.breakfast, lunch: x.lunch, dinner: x.dinner, vesselWash: x.vesselWash, createdAt: x.reqCreatedAt, updatedAt: getCurrentDateAndTime(),
                    expiryDate: x.expiryDate, oldUid: x.oldUid
                })
            }
            return x;
        });
        let i = 0;
        for (let x of jobData) {
            i++;
            console.log({ i });
            let clientId = await Employer.findOne({ oldUid: x.oldUid, memberType: 1 });
            await ClientRequirement.create({ ...x, clientId: clientId._id });
        }
        res.status(200).send({ success: true, jsonlength: jobData.length, data: jobData })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.bcryptPassword = async (req, res) => {
    try {

        let data = await Employer.find({ memberType: 1 }).lean();
        console.log({ total: data.length })
        let i = 0;
        for (let x of data) {
            i++;
            console.log({ i })
            let data = await ClientPoints.create({
                clientId: x._id,
                planType: 'free', planStartsAt: getCurrentDateAndTime(), planExpiresAt: `${(moment(addDaysToDate(180)).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                totalEventPoints: 2, totalHouseCookPoints: 20, totalPartyCateringPoints: 2,
                currentEventPoints: 2, currentHouseCookPoints: 20, currentPartyCateringPoints: 2,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            })
        }
        res.send({ status: 1, data: {} })
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.importChefs = async (req, res) => {
    try {

        const excelFileName = 'chef.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        let cookData = [];
        jsonData = jsonData.map((x) => {
            let obj = {};
            if (x.citycoordinate) {
                let coordinates = (x.citycoordinate).split(',');
                coordinates = coordinates.map(Number);
                obj.cityCoordinates = { type: "Point", coordinates }
                // cookData.push({ cityCoordinates: x.cityCoordinates })
            }
            if (x.areacoordinate) {
                let coordinates = (x.areacoordinate).split(',');
                coordinates = coordinates.map(Number);
                obj.areaCoordinates = { type: "Point", coordinates }
                // cookData.push({ areaCoordinates: x.areaCoordinates })
            }
            if (x.currentcitycoordinate) {
                let coordinates = (x.currentcitycoordinate).split(',');
                coordinates = coordinates.map(Number);
                obj.currentCityCoordinates = { type: "Point", coordinates }
                // cookData.push({ currentCityCoordinates: x.currentCityCoordinates })
            }
            if (obj.currentCityCoordinates || obj.areaCoordinates || obj.cityCoordinates) cookData.push({ ...obj, oldUid: x.oldUid })
            // cookData.push({ oldUid: x.oldUid, currentCityCoordinates: x.currentCityCoordinates, areaCoordinates: x.areaCoordinates, cityCoordinates: x.cityCoordinates })
            return x;
        });

        // let i = 0;
        // for (let x of cookData) {
        //     i++;
        //     console.log({ i })
        //     let updateBody = {};
        //     if (x.currentCityCoordinates) updateBody.currentCityCoordinates = x.currentCityCoordinates;
        //     if (x.areaCoordinates) updateBody.areaCoordinates = x.areaCoordinates;
        //     if (x.cityCoordinates) updateBody.cityCoordinates = x.cityCoordinates;
        //     await Cook.findOneAndUpdate({ oldUid: x.oldUid }, { $set: updateBody }, { new: true })
        // }
        let resp = await Cook.updateMany({ profilePercent: { $in: ["10"] } },
            [
                {
                    $set: {
                        profilePercent: {
                            $toInt: { $ifNull: ['$profilePercent', '10'] }
                        }
                    }
                }
            ])
        res.status(200).send({ success: true, jsonlength: cookData.length, data: resp })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}


exports.importTransactions = async (req, res) => {
    try {

        const excelFileName = 'transactions.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        let jobData = [];
        let i = 0;
        jsonData = jsonData.map((x) => {
            i++;
            x.transactionNo = (x.transactionNo) ? x.transactionNo : `order_230324${i}`;
            x.transactionPaymentNo = (x.transactionPaymentNo) ? x.transactionPaymentNo : `pay_230324${i}`;
            x.transactionSignature = (x.transactionSignature) ? x.transactionSignature : `sig_230324${i}`;
            x.transactionType = 1;
            x.transactionBy = 2;
            x.paymentStatus = 1;
            x.transactionStatus = 1;
            x.employerPlanId = x.planId;
            if (x.date) {

                const timestamp = (x.date - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.createdAt = formattedDate;
                x.updatedAt = formattedDate
                x.transactionStartDateTime = formattedDate

            }
            if (x.expiryDate) {
                const timestamp = (x.expiryDate - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.transactionEndDateTime = formattedDate
            }
            x.amount = parseInt(x.price);
            return x;
        });
        let z = 0;
        let transactions = [];
        for (let x of jsonData) {

            z++;
            console.log({ z })
            let invoiceNo;
            let lastRecord = await Transaction.find({ invoiceNo: { $exists: true } }).sort({ _id: -1 }).limit(1);
            //Calculating Current Invoice Number
            let lastInvoiceNumber;
            let invoiceCode = `CNCINV${new Date().getFullYear()}`;
            if (lastRecord.length && lastRecord[0]['invoiceNo']) {
                invoiceCode = (lastRecord[0].invoiceNo).substring(0, 10);
                lastInvoiceNumber = (lastRecord[0].invoiceNo).substring(10);
            }
            else {
                lastInvoiceNumber = 0;
            }
            if (lastInvoiceNumber == undefined) throw Error("Unable to generate invoice number.Try again")
            invoiceNo = parseInt(lastInvoiceNumber) + 1;
            invoiceNo = invoiceNo.toString().padStart(8, "0")
            invoiceNo = `${invoiceCode}${invoiceNo}`;
            console.log({ invoiceNo })
            x.invoiceNo = invoiceNo;
            let employer = await Employer.findOne({ oldUid: x.oldUid, memberType: 2 });
            // let employer = await Employer.findOneAndUpdate({ oldUid: x.oldUid, memberType: 2 }, { $set: { userPlan: 1 } }, { new: true });
            x.employerId = employer._id;
            x.categoryType = 'plan'
            x.paymentDetails = {
                planPrice: x.price,
                assistancePrice: 0,
                discount: 0,
                totalPrice: x.amount
            }
            let tid = await Transaction.create({ ...x });
            let plan = await EmployerPlan.findOne({ _id: x.employerPlanId });
            let obj = {
                employerId: x.employerId,
                employerPlanId: x.employerPlanId,
                planTransactionId: tid._id,
                supportAssistance: x.assistanceIncluded,
                planType: "paid",
                planStartsAt: `${(moment(tid.transactionStartDateTime).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                planExpiresAt: `${(moment(tid.transactionEndDateTime).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                totalJobPoints: plan.jobPoints,
                totalProfileViewPoints: plan.profileViewPoints,
                totalResponsePoints: plan.responsePoints,
                currentJobPoints: plan.jobPoints,
                currentProfileViewPoints: plan.profileViewPoints,
                currentResponsePoints: plan.responsePoints,
                createdAt: x.createdAt,
                updatedAt: x.updatedAt
            };
            let pointsData = await EmployerPoints.create({ ...obj });
            await Transaction.findOneAndUpdate({ _id: tid._id }, { $set: { employerPointsId: pointsData._id } }, { new: true })
        }
        res.status(200).send({ success: true, length: jsonData.length, jsonData })
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.splitAndTrim = (str) => {
    return str.split(',').map(item => item.trim()).filter(item => item !== '');
}

exports.updateCook = async (req, res) => {
    try {

        const excelFileName = 'chef.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const updates = [];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        jsonData = jsonData.map((x) => {
            if (x.resume) {
                let updateBody = {
                    filter: { oldUid: x.oldUid }, update: { $set: { resume: x.resume } }
                }
                updates.push(updateBody)
            }
        });

        // let data = await Cook.find({ skills: { $exists: true, $ne: [] } }).lean();
        // data = JSON.parse(JSON.stringify(data));


        // data = data.map((x) => {
        //     x.skills = (x.skills).flatMap(item => exports.splitAndTrim(item))
        //     let updateBody = {
        //         filter: { _id: x._id }, update: { $set: { skills: x.skills } }
        //     }
        //     updates.push(updateBody)
        //     return x;
        // })

        // Construct bulk write operations
        const bulkWriteOperations = updates.map(({ filter, update }) => ({
            updateOne: {
                filter,
                update,
            },
        }));

        // let resp = await Cook.bulkWrite(bulkWriteOperations);
        // console.log({ resp })
        res.status(200).send({ length: updates.length })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.importCooks = async (req, res) => {
    try {

        const excelFileName = 'cooks.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        jsonData = jsonData.map((x) => {

            if (x.createdAt) {
                const timestamp = (x.createdAt - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.createdAt = formattedDate
            }
            if (x.dob) {
                const timestamp = (x.dob - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.dob = formattedDate
            }
            if (x.lastLoginDateTime) {
                const timestamp = (x.lastLoginDateTime - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.lastLoginDateTime = formattedDate
            }
            if (x.partyCookVesselWash == "Yes" || x.partyCookVesselWash == "yes") {
                x.partyCookVesselWash = 1
            }
            if (x.partyCookVesselWash == "No" || x.partyCookVesselWash == "no") {
                x.partyCookVesselWash = 0
            }
            if (x.jobSeeking == "Yes") {
                x.jobSeeking = 1
            }
            if (x.jobSeeking == "No") {
                x.jobSeeking = 0
            }
            if (x.relocate == "Yes" || x.relocate == "yes") {
                x.relocate = 1
            }
            if (x.relocate == "No" || x.relocate == "no") {
                x.relocate = 0
            }
            if (x.jobType == "Full Time" || x.jobType == "Full time" || x.jobType == "full time") {
                x.jobType = 1
            }
            if (x.jobType == "Part Time" || x.jobType == "Part time" || x.jobType == "part time") {
                x.jobType = 2
            }
            if (x.jobType == "Any" || x.jobType == "any") {
                x.jobType = 3
            }
            if (x.partyExperience = "10+++") {
                x.partyExperience = 10;
            }
            x.mobileVerified = 1;
            x.emailVerified = 1;
            if (x.dob) {
                const parts = (x.dob).split('-');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    x.dob = `${year}-${month}-${day}`
                }
            }
            if (x.cityCoordinates) {
                let coordinates = (x.cityCoordinates).split(',');
                coordinates = coordinates.map(Number);
                x.cityCoordinates = { type: "Point", coordinates }
            }
            if (x.currentCityCoordinates) {
                let coordinates = (x.currentCityCoordinates).split(',');
                coordinates = coordinates.map(Number);
                x.currentCityCoordinates = { type: "Point", coordinates }
            }

            x.languages = (x.languages && typeof x.languages == 'string') ? (x.languages).split(',') : [];
            x.chefCuisines = (x.chefCuisines && typeof x.chefCuisines == 'string') ? (x.chefCuisines).split(',') : [];
            x.partyCuisines = (x.partyCuisines && typeof x.partyCuisines == 'string') ? (x.partyCuisines).split(',') : [];
            x.householdCuisines = (x.householdCuisines && typeof x.householdCuisines == 'string') ? (x.householdCuisines).split(',') : [];
            x.cateringCuisines = (x.cateringCuisines && typeof x.cateringCuisines == 'string') ? (x.cateringCuisines).split(',') : [];
            x.skills = (x.skills && typeof x.skills == 'string') ? (x.skills).split(',') : [];

            x.updatedAt = getCurrentDateAndTime();
            // x.basicProfileStatus = x.profile_complete;
            x.loginIP = "127.0.0.1";
            x.loginMAC = "127.0.0.1";
            x.registerIP = "127.0.0.1";
            x.registerMAC = "127.0.0.1";
            x.profilePercent = Math.round(getEmployerProfilePercent(x));
            // x.memberType = 1;
            x.employeeMemberId = (x.memberType == 1) ? generateMemberId("cook") : generateMemberId("catering");
            return x;
        });
        let i = 0;
        for (let x of jsonData) {
            x.password = bcrypt.hashSync((x.password).toString(), 8);
            i++;
            console.log({ i })
            let cook = await Cook.create({ ...x });
            if (cook.memberType == 1) {
                let pointsData = await CookPoints.create({
                    chefDailyLimit: 10, chefMonthlyLimit: 50, chefDailyLimitBalance: 10, chefMonthlyLimitBalance: 50,
                    cookId: cook._id, partyDailyLimit: 10, partyMonthlyLimit: 50, partyDailyLimitBalance: 10, partyMonthlyLimitBalance: 50,
                    houseDailyLimit: 10, houseMonthlyLimit: 50, houseDailyLimitBalance: 10, houseMonthlyLimitBalance: 50,
                    chefPlanStartDate: getCurrentDateAndTime(), chefPlanEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, chefPlanRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                    planStartDate: getCurrentDateAndTime(), planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                    createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
                });
            }
            else if (cook.memberType == 2) {
                let pointsData = await CookPoints.create({
                    cookId: cook._id,
                    cateringDailyLimit: 10, cateringMonthlyLimit: 50, cateringDailyLimitBalance: 10, cateringMonthlyLimitBalance: 50,
                    planStartDate: getCurrentDateAndTime(), planEndDate: `${(moment(addDaysToDate(30)).format("YYYY-MM-DD"))}T23:59:59.999Z`, planRenewalDate: `${(moment(addDaysToDate(31)).format("YYYY-MM-DD"))}T00:00:00.000Z`,
                    createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
                });
            }
        }
        res.status(200).send({ success: true, jsonlength: jsonData.length, jsonData })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.importEmployers = async (req, res) => {
    try {

        const excelFileName = 'employers.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        jsonData = jsonData.map((x) => {

            if (x.createdAt) {
                console.log(x.createdAt)
                const timestamp = (x.createdAt - 25569) * 86400 * 1000;
                const date = new Date(timestamp);
                const formattedDate = date.toISOString().split('T')[0];
                x.createdAt = formattedDate;
                x.updatedAt = formattedDate
                x.lastLoginDateTime = formattedDate
                x.passwordUpdateDateTime = formattedDate

            }
            x.mobileVerified = 1;
            x.emailVerified = 1;
            if (x.dob) {
                const parts = (x.dob).split('-');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    x.dob = `${year}-${month}-${day}`
                }
            }
            if (x.cityCoordinates) {
                let coordinates = (x.cityCoordinates).split(',');
                coordinates = coordinates.map(Number);
                x.cityCoordinates = { type: "Point", coordinates }
            }
            if (x.areaCoordinates) {
                let coordinates = (x.areaCoordinates).split(',');
                coordinates = coordinates.map(Number);
                x.areaCoordinates = { type: "Point", coordinates }
            }
            x.basicProfileStatus = x.profile_complete;
            x.loginIP = "127.0.0.1";
            x.loginMAC = "127.0.0.1";
            x.registerIP = "127.0.0.1";
            x.registerMAC = "127.0.0.1";
            x.profilePercent = Math.round(getEmployerProfilePercent(x));
            x.employeeMemberId = (x.memberType == 1) ? generateMemberId("client") : generateMemberId("employer");
            return x;
        });
        let i = 0;
        // await Employer.insertMany(jsonData)
        for (let x of jsonData) {
            i++;
            console.log({ i })
            x.password = bcrypt.hashSync((x.password).toString(), 8);
            await Employer.create({ ...x });
        }
        res.status(200).send({ success: true, jsonlength: jsonData.length, jsonData })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.importEmployerTransactions = async (req, res) => {
    try {

        const excelFileName = 'transactions.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        jsonData = jsonData.map((x) => {

            if (x.expirydate) {
                const parts = (x.expirydate).split('-');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    x.transactionEndDateTime = `${year}-${month}-${day}`
                }
            }
            if (x.date) {
                const parts = (x.date).split('-');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    x.createdAt = `${year}-${month}-${day}`
                    x.transactionStartDateTime = `${year}-${month}-${day}`
                }
            }
            if (x.dob) {
                const parts = (x.dob).split('-');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    x.dob = `${year}-${month}-${day}`
                }
            }
            x.updatedAt = getCurrentDateAndTime();
            x.price = x.amount;
            x.transactionBy = 2;
            x.transactionStatus = x.status;
            x.paymentStatus = x.status;

        });
        let i = 0;
        // // await Employer.insertMany(jsonData)
        // for (let x of jsonData) {
        //     i++;
        //     console.log({ i })
        //     x.password = bcrypt.hashSync((x.password).toString(), 8);
        //     await Employer.create({ ...x });
        // }
        res.status(200).send({ success: true, jsonlength: jsonData.length, jsonData })

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}


exports.importClientTransactions = async (req, res) => {
    try {

        const excelFileName = 'clienttransactions.xlsx';
        const excelFilePath = path.join(__dirname, '..', excelFileName);
        const targetRow = 1; // Change this to the desired row number
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);
        let jobData = [];
        let i = 0;
        jsonData = jsonData.map((x) => {
            i++;
            x.transactionNo = (x.transactionNo) ? x.transactionNo : `order_20240321_${i}`;
            x.transactionPaymentNo = (x.transactionPaymentNo) ? x.transactionPaymentNo : `pay_20240321_${i}`;
            x.transactionSignature = (x.transactionSignature) ? x.transactionSignature : `sig_20240321_${i}`;
            x.transactionType = 1;
            x.transactionBy = 2;
            x.paymentStatus = 1;
            x.transactionStatus = 1;
            if (x.date) {
                const dateString = x.date;
                const [day, month, year] = dateString.split('/');
                const formattedDate = moment(`${'20' + year}-${month}-${day}`, 'YYYY-MM-DD').format('YYYY-MM-DD');
                x.createdAt = formattedDate;
                x.updatedAt = formattedDate
                x.transactionStartDateTime = formattedDate

            }
            if (x.expiryDate) {
                const dateString = x.expiryDate;
                const [day, month, year] = dateString.split('/');
                const formattedDate = moment(`${'20' + year}-${month}-${day}`, 'YYYY-MM-DD').format('YYYY-MM-DD');
                x.transactionEndDateTime = formattedDate
            }
            x.amount = parseInt(x.price);
            x.oldUid = x['oldUid ']
            return x;
        });
        let z = 0;
        let transactions = [];
        let totalEmployers = [];
        for (let x of jsonData) {

            z++;
            console.log({ z })
            let invoiceNo;
            let lastRecord = await Transaction.find({ invoiceNo: { $exists: true } }).sort({ _id: -1 }).limit(1);
            //Calculating Current Invoice Number
            let lastInvoiceNumber;
            let invoiceCode = `CNCINV${new Date().getFullYear()}`;
            if (lastRecord.length && lastRecord[0]['invoiceNo']) {
                invoiceCode = (lastRecord[0].invoiceNo).substring(0, 10);
                lastInvoiceNumber = (lastRecord[0].invoiceNo).substring(10);
            }
            else {
                lastInvoiceNumber = 0;
            }
            if (lastInvoiceNumber == undefined) throw Error("Unable to generate invoice number.Try again")
            invoiceNo = parseInt(lastInvoiceNumber) + 1;
            invoiceNo = invoiceNo.toString().padStart(8, "0")
            invoiceNo = `${invoiceCode}${invoiceNo}`;
            x.invoiceNo = invoiceNo;
            let employer = await Employer.findOne({ oldUid: x.oldUid, memberType: 1 });
            if (!employer) totalEmployers.push(x.oldUid)
            else {
                // let employer = await Employer.findOneAndUpdate({ oldUid: x.oldUid, memberType: 2 }, { $set: { userPlan: 1 } }, { new: true });
                x.employerId = employer._id;
                x.categoryType = 'plan';
                x.scriptDate = "230320241";
                x.paymentDetails = {
                    planPrice: x.price,
                    assistancePrice: 0,
                    discount: 0,
                    totalPrice: x.amount
                }
                let tid = await Transaction.create({ ...x });
                let obj = {
                    clientId: x.employerId,
                    clientPlanIdId: x.clientPlanId,
                    planTransactionId: tid._id,
                    planType: "paid",
                    planStartsAt: x.transactionStartDateTime,
                    planExpiresAt: x.transactionEndDateTime,
                    totalEventPoints: x.totalEventPoints,
                    totalHouseCookPoints: x.totalHouseCookPoints,
                    totalPartyCateringPoints: x.totalPartyCateringPoints,
                    currentEventPoints: 0,
                    currentHouseCookPoints: 0,
                    currentPartyCateringPoints: 0,
                    supportAssistance: 1,
                    createdAt: x.transactionStartDateTime,
                    updatedAt: x.transactionEndDateTime,
                    scriptDate: "23032024"
                };
                let pointsData = await ClientPoints.create({ ...obj });
                await Transaction.findOneAndUpdate({ _id: tid._id }, { $set: { clientPointsId: pointsData._id } }, { new: true })
            }
        }
        res.status(200).send({ success: true, length: jsonData.length, totalEmployers, totalEmployersLength: totalEmployers.length })
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}