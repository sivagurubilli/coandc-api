
let { responseJson, sendMail, convertDateFormat, generateMemberId, isRequestDataValid, invoiceGen, sendNotice, resumeGen, capitalizeEveryInnerWord } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Admin, Role, Transaction, CookPlan, Employer, ClientPlan, EmployerPlan, Province, Qualification, Cook, CookPoints } = require('../models/index')
let { isValidCookPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate } = require("../helpers/dates");
const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require('bcryptjs')
const path = require("path");
const xlsx = require('xlsx');
const fs = require('fs');
const { getCookProfilePercent, getEmployerProfilePercent } = require("../helpers/points");
const axios = require('axios');

exports.createRole = async (req, res) => {
    try {


        // let resp = await sendNotice({
        //     title: 'Testing By Teja',
        //     body: 'Testing',
        //     data: {
        //         link: `http://google.com`
        //     },
        //     userToken: ['dnfYOscJTRa9N3xWRopY82:APA91bEtnc8v-yRJAgsksCKm3_gwEf-cSVGXAquYZS2hvuB38MAVZlMOZbXWuQzxn-27Sfflic9GNOkKw9zNujnaVHaxL_8RxqS3cIRaUaqu5m3WWloETYSAus4ZFsE3mx_TEKgh5XjT'],
        //     userId: ''
        // })

        //Invoice Generation
        let invoiceUrl = await invoiceGen({
            fileName: 'cookInvoice.html',
            invoiceNumber: 'CNCINV0001',
            invoiceDate: moment(getCurrentDateAndTime()).format('DD-MM-YYYY'),
            name: "Svss teja",
            email: "svssteja@gmail.com",
            mobile: "8332946991",
            address: "Visakhapatnam,Andhra pradesh-531084",
            planName: "Testing001",
            planPrice: "1999.00",
            planValidity: 60,
            totalActionsPerMonth: 15,
            discount: "99.00",
            totalPrice: "1900.00",
        })



        // let url = await resumeGen({
        //     name: "SEGU VEMA SIVA SAI TEJA",
        //     email: "SVSSTEJA@GMAIL.COM",
        //     mobile: "8897734943",
        //     currentDesignation: "Software Developer",
        //     additionalInfo: ['Expertise in Nodejs', 'Good knowledge on AWS', 'Good Knowledge on Data science'],
        //     skills: ["Node JS", "React JS", "Python"],
        //     cuisines: ["Indian", "Bengali", "Chinese"],
        //     hobbies: ["Playing cricket", "Swimming", "Travelling"],
        //     awards: ["Won Best employee of the month award in 2020", "Participated in cricket district zonal tournaments"],
        //     profile: ` 10+ years of experience in the hotel industry,specializing in Chinese, Italian, Mexican, and Indian cuisine.Proven ability to lead and motivate kitchen staff, develop and execute menus, and ensure the highest standards of food quality and safety. Expertise in all aspects of kitchen operations, including food preparation, cooking, plating, and presentation.`,
        //     education: ['Completed B.tech from GIER College- ECE Department in 2018.', 'Completed M.Tech from GITAM college - AI Department in 2021.'],
        //     workExperience: [
        //         {
        //             designation: 'Software Developer',
        //             company: 'Octal Optimum',
        //             location: 'Karnataka,Bangalore',
        //             startDate: '2022',
        //             endDate: 'Present',
        //             responsibilities: [
        //                 'Responsible for the day-to-day operations of the kitchen, including menu planning, food preparation, and staff supervision',
        //                 'Developed and implemented new menu items that increased customer satisfaction and revenue',
        //                 'Trained and mentored new kitchen staff',
        //                 'Ensured the highest standards of food quality and safety'
        //             ]
        //         },
        //         {
        //             designation: 'Junior Software Developer',
        //             company: 'Cognizant',
        //             location: 'Hyderabad, Telangana',
        //             startDate: '2019',
        //             endDate: '2022',
        //             responsibilities: [
        //                 'Assisted the Executive Chef with all aspects of kitchen operations, including menu planning, food preparation, and staff supervision',
        //                 'Oversaw the preparation and cooking of all entrees, appetizers, and desserts',
        //                 'Ensured that all food was prepared and served to the highest standards of quality and presentation'
        //             ]
        //         }
        //     ]
        // });


        // const excelFileName = 'EmployerNew.xlsx';
        // const excelFilePath = path.join(__dirname, '..', excelFileName);
        // const targetRow = 1; // Change this to the desired row number
        // const workbook = xlsx.readFile(excelFilePath);
        // const sheetName = workbook.SheetNames[0];
        // const sheet = workbook.Sheets[sheetName];

        // let jsonData = xlsx.utils.sheet_to_json(sheet);
        // // jsonData = jsonData.slice(0, 2);
        // let i = 0;
        // jsonData = jsonData.map((x) => {
        //     i++;
        //     console.log({ i })
        //     // x.fullName = capitalizeEveryInnerWord(x.fullName);
        //     x.memberType = x.membertType;
        //     x.employeeMemberId = (x.memberType == 1) ? generateMemberId("client") : generateMemberId("employer");
        //     if (x.lastLoginDateTime) {
        //         const parts = (x.lastLoginDateTime).split('-');
        //         if (parts.length === 3) {
        //             const [day, month, year] = parts;
        //             x.lastLoginDateTime = `${year}-${month}-${day}`
        //         }
        //     }
        //     if (x.createdAt) {
        //         const parts = (x.createdAt).split('-');
        //         if (parts.length === 3) {
        //             const [day, month, year] = parts;
        //             x.createdAt = `${year}-${month}-${day}`
        //         }
        //     }
        // if (x.partyCookVesselWash == "Yes" || x.partyCookVesselWash == "yes") {
        //     x.partyCookVesselWash = 1
        // }
        // if (x.partyCookVesselWash == "No" || x.partyCookVesselWash == "no") {
        //     x.partyCookVesselWash = 0
        // }
        // if (x.jobSeeking == "Yes") {
        //     x.jobSeeking = 1
        // }
        // if (x.jobSeeking == "No") {
        //     x.jobSeeking = 0
        // }
        // if (x.relocate == "Yes" || x.relocate == "yes") {
        //     x.relocate = 1
        // }
        // if (x.relocate == "No" || x.relocate == "no") {
        //     x.relocate = 0
        // }
        // if (x.jobType == "Full Time" || x.jobType == "Full time" || x.jobType == "full time") {
        //     x.jobType = 1
        // }
        // if (x.jobType == "Part Time" || x.jobType == "Part time" || x.jobType == "part time") {
        //     x.jobType = 2
        // }
        // if (x.jobType == "Any" || x.jobType == "any") {
        //     x.jobType = 3
        // }
        // if (x.partyExperience = "10+++") {
        //     x.partyExperience = 10;
        // }
        // x.updatedAt = getCurrentDateAndTime();
        // x.lastLoginDateTime = moment(x.lastLoginDateTime).format('YYYY-MM-DD');
        // x.passwordUpdateDateTime = getCurrentDateAndTime();
        // x.status = 1;
        // x.areaCoordinates = { type: "Point", coordinates: (JSON.parse(x.areaCoordinates)) };
        // x.cityCoordinates = { type: "Point", coordinates: (JSON.parse(x.cityCoordinates)) };
        // x.currentCityCoordinates = { type: "Point", coordinates: (JSON.parse(x.currentCityCoordinates)) };
        // x.cookMemberId = x.cookMemberId;
        // x.email = `${x.cookMemberId}@test.co`;
        // x.mobileVerified = 1;
        // x.emailVerified = 1;
        // x.partyCookProfileStatus = (x.partyCuisines && x.partyCuisines.length) ? 1 : 0;
        // x.houseCookProfileStatus = 0;
        // x.cateringProfileStatus = 0;
        // x.chefProfileStatus = 1;
        // x.basicProfileStatus = 1;
        // x.appAccess = 1;
        // x.webAccess = 0;
        // x.loginIP = "154.011.22";
        // x.loginMAC = "154.011.22";
        // x.registerIP = "154.011.22";
        // x.registerMAC = "154.011.22";
        // updatedAt = getCurrentDateAndTime()
        // x.whatsappNumberVerified = 0;
        // x.userPlan = 0;
        // x.userCredits = 10;
        // if (x.chefCuisines) x.chefCuisines = JSON.parse(x.chefCuisines);
        // if (x.partyCuisines) x.partyCuisines = JSON.parse(x.partyCuisines);
        // if (x.skills) x.skills = JSON.parse(x.skills);
        //     x.profilePercent = Math.round(getEmployerProfilePercent(x));
        //     return x;
        // })
        // // // jsonData = jsonData[0]
        // await Cook.insertMany(jsonData);

        // await Cook.updateMany({ script: true, cookType: 2 }, { $set: { chefProfileStatus: 1 } }, { multi: true });
        // await Cook.updateMany({ script: true, partyCook: 1 }, { $set: { partyCookProfileStatus: 1 } }, { multi: true });
        // await Cook.updateMany({ script: true, partyCook: 0 }, { $set: { partyCookProfileStatus: 0 } }, { multi: true });

        // let data = await Cook.find({ scriptdate: "16122023" });
        // console.log({ data: data.length })
        // data = JSON.parse(JSON.stringify(data));
        // await Promise.all([
        //     data.map((x) => {
        //         CookPoints.create({
        //             chefDailyLimit: 10, chefMonthlyLimit: 50, chefDailyLimitBalance: 10, chefMonthlyLimitBalance: 50, scriptdate: "16122023",
        //             cookId: x._id, partyDailyLimit: 10, partyMonthlyLimit: 50, partyDailyLimitBalance: 10, partyMonthlyLimitBalance: 50,
        //             houseDailyLimit: 10, houseMonthlyLimit: 50, houseDailyLimitBalance: 10, houseMonthlyLimitBalance: 50,
        //             chefPlanStartDate: getCurrentDateAndTime(), chefPlanEndDate: addDaysToDate(30), chefPlanRenewalDate: addDaysToDate(31),
        //             planStartDate: getCurrentDateAndTime(), planEndDate: addDaysToDate(30), planRenewalDate: addDaysToDate(31),
        //             createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
        //         }
        //         );
        //     })
        // ])
        // console.log(await Cook.updateMany({ chefCuisines: { $in: ["South India"] } }, { $pull: { chefCuisines: "South India" } }, { multi: true }));

        // let cookInvoiceUrl = await invoiceGen({
        //     fileName: 'employerAssistanceInvoice.html',
        //     invoiceNumber: "CNCINV003",
        //     invoiceDate: "04-12-2023",
        //     name: "Segu vema siva sai teja",
        //     email: "svssteja@gmail.com",
        //     mobile: 8332946991,
        //     address: "Vizag,Andhra Pradesh-531084",
        //     planPrice: "949.00",
        //     discount: "49.00",
        //     totalPrice: "900.00"
        // })
        // console.log({ cookInvoiceUrl })

        // let clientInvoiceUrl = await invoiceGen({ fileName: 'clientInvoice.html' })
        // console.log({ clientInvoiceUrl })

        // let employerInvoiceUrl = await invoiceGen({ fileName: 'employerInvoice.html' })
        // console.log({ employerInvoiceUrl })

        // let users = await Employer.find({ status: { $nin: [0] }, weavyId: { $exists: false } }).sort({ createdAt: 1 }).limit(5);
        // // let users = [{ fullName: "Svss", dp: "", _id: "9490392125ll" }]
        // let i = 1;
        // if (users.length) {
        //     for (let x of users) {
        //         console.log({ currentCookCount: i });
        //         let payload = { name: x.fullName, picture: (x.dp) ? x.dp : "", uid: x._id };
        //         const config = {
        //             headers: {
        //                 'Content-Type': 'application/json',
        //                 'Authorization': `Bearer wys_9Xq10KMQQrFJXzhhNO8QTUuz49pBcB1NN1tQ`,
        //             },
        //         };
        //         console.log({ payload })
        //         await axios.post("https://009c9ffe18594d13bacdea6dd57d3b41.weavy.io/api/users", payload, config).then(async (response) => {
        //             if (response.data) {
        //                 await Employer.findOneAndUpdate({ _id: x._id }, { $set: { weavyId: response.data.id } }, { new: true })
        //             }
        //         }).catch(e => {
        //             console.log({ error: e })
        //         })

        //         i++;
        //     }
        // }
        // jsonData = jsonData[0];
        // console.log("fine", jsonData[0], jsonData.languages)
        // await Employer.insertMany(jsonData)
        res.status(200).send({ success: true, invoiceUrl })
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'failed', e))
    }
}

exports.createRole1 = async (req, res) => {
    try {
        // let data = await Employer.find({ memberType: 2 });
        // data = JSON.parse(JSON.stringify(data));
        // let i = 0;
        // await Promise.all([
        //     data.map(async (x) => {
        //         i++;
        //         console.log({ i })
        //         let password = bcrypt.hashSync(x.password, 8);
        //         await Employer.findOneAndUpdate({ _id: x._id }, { $set: { password } }, { new: true })
        //     })
        // ])
        // res.send("completed")
    }
    catch (e) {
        res.send(e)
    }

}