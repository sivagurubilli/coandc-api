
let { responseJson, sendMail, isRequestDataValid, invoiceGen } = require("../utils/appUtils");
let { razorpay, razorpaySecretKey } = require('../config/config.js')
let { Transaction, CookPlan, Cook, ClientPlan, Employer, EmployerPoints, ClientPoints, EmployerPlan, CookPoints, AdminAuth } = require('../models/index')
let { isValidCookPlan, isValidClientPlan, isValidEmployerPlan } = require("../helpers/plans");
let { getCurrentDateAndTime, getDateByMonth, addDaysToDate, getCurrentDate, getNextDay, isDateExpired } = require("../helpers/dates");
const crypto = require("crypto");
const moment = require("moment");


//Initiate_RazorPay_Payment
exports.initiateCookSubscription = async (req, res) => {

    try {

        let {
            cookPlanId,
            transactionType,
            discount,
            address
        } = Object.assign(req.body)

        let planData = await isValidCookPlan(cookPlanId);
        if (discount > planData.price) throw Error("Discount should less than plan price")
        let rzpAmount = (parseFloat(planData.price) * 100) - parseFloat(discount);
        currency = "INR"

        let rzpOrder = await razorpay.orders.create({
            amount: rzpAmount,
            currency
        })
        if (!rzpOrder) throw Error("Unable to create order. Try again")
        let subscriptionData = await Transaction.create({
            transactionBy: 1,
            transactionNo: rzpOrder.id,
            cookId: req.user._id,
            cookPlanId,
            planName: planData.cookPlanName,
            transactionStartDateTime: getCurrentDateAndTime(),
            transactionType: 1,
            price: parseFloat(planData.price),
            discount: parseFloat(discount),
            amount: parseFloat(planData.price) - parseFloat(discount),
            paymentStatus: 0,
            transactionStatus: 0,
            address,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime()
        })
        if (!subscriptionData) throw { statusCode: 0, responseCode: 7, msg: "Unable to subscribe.Try again" }

        res.status(200).send(responseJson(1, 1, subscriptionData, 'Payment successful!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
};

exports.confirmSubscriptionPayment = async (req, res) => {
    try {

        let {
            transactionNo,
            transactionPaymentNo,
            transactionSignature,
            invoiceNo,
            id
        } = Object.assign(req.body)

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        let data = await Transaction.findOne({ transactionNo, cookId: req.user._id }).populate([{ path: 'cookPlanId' }]);
        const planValidity = data.cookPlanId.validityInDays;
        const profileBoostRank = data.cookPlanId.profileBoostRank;
        console.log({ data })
        if (!data) throw Error("Invalid transaction No")
        // if (data && data.paymentStatus != 0) throw Error("Payment already confirmed and updated")
        if (data.invoiceNo) updateBody.invoiceNo = data.invoiceNo;

        //Signature Verification
        let body = transactionNo + "|" + transactionPaymentNo;
        let expectedSignature = crypto.createHmac('sha256', razorpaySecretKey)
            .update(body.toString())
            .digest('hex');
        // if (expectedSignature == transactionSignature) throw Error("Invalid Transaction Signature")
        // if ((expectedSignature != transactionSignature) || (expectedSignature == transactionSignature)) {

        updateBody.transactionEndDateTime = `${(moment(addDaysToDate(parseInt(planValidity))).format("YYYY-MM-DD"))}T23:59:59.999Z`;
        updateBody.paymentStatus = 1;
        updateBody.transactionStatus = 1;
        updateBody.transactionPaymentNo = transactionPaymentNo;
        updateBody.transactionSignature = transactionSignature;

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
        invoiceNo = `${invoiceCode}${invoiceNo}`
        if (!invoiceNo) throw Error("invoiceNumber not generated.Try again")
        if (!updateBody.invoiceNo) updateBody.invoiceNo = invoiceNo;
        // }

        data = await Transaction.findOneAndUpdate({ transactionNo, cookId: req.user._id }, { $set: updateBody }, { new: true }).populate([{ path: "cookPlanId" }, { path: "cookId", select: 'fullName email mobile addressLine1 addressLine2 stateName provinceName pincode' }])

        const [userData, cookPointsData] = await Promise.all([
            Cook.findOneAndUpdate({ _id: req.user._id }, {
                $set: {
                    userPlan: 1, resumeBuilder: data.cookPlanId.resumeBuilder, profileBoostRank: data.cookPlanId.profileBoostRank
                }
            }),
            CookPoints.findOneAndUpdate({ cookId: req.user._id }, {
                $set: {
                    chefDailyLimit: data.cookPlanId.actionPerDay, chefMonthlyLimit: data.cookPlanId.actionPerMonth,
                    chefDailyLimitBalance: data.cookPlanId.actionPerDay, chefMonthlyLimitBalance: data.cookPlanId.actionPerMonth,
                    chefPlanStartDate: getCurrentDateAndTime(), chefPlanEndDate: `${(moment(addDaysToDate(parseInt(planValidity))).format("YYYY-MM-DD"))}T23:59:59.999Z`, chefPlanRenewalDate: `${(moment(addDaysToDate(parseInt(planValidity) + 1)).format("YYYY-MM-DD"))}T00:00:00.000Z`
                }
            })
        ])
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to confirm the payment. Try again" }
        let userAddress;
        if (data.address) userAddress = data.address;
        else if (!data.address) {
            userAddress = "";
            if (data.cookId.addressLine1) userAddress = userAddress + ' ' + data.cookId.addressLine1 + ',';
            if (data.cookId.addressLine2) userAddress = userAddress + ' ' + data.cookId.addressLine2 + ',';
            if (data.cookId.stateName) userAddress = userAddress + ' ' + data.cookId.stateName + ',';
            if (data.cookId.provinceName) userAddress = userAddress + ' ' + data.cookId.provinceName + ',';
            if (data.cookId.pincode) userAddress = userAddress + ' ' + data.cookId.pincode;
            console.log({ userAddress })
        }

        //Invoice Generation
        let invoiceUrl = await invoiceGen({
            fileName: 'cookInvoice.html',
            invoiceNumber: data.invoiceNo,
            invoiceDate: moment(data.transactionStartDateTime).format('DD-MM-YYYY'),
            name: data.cookId.fullName,
            email: data.cookId.email,
            mobile: data.cookId.mobile,
            address: ((userAddress.trim()).length) ? userAddress : "-----------------------",
            planName: data.cookPlanId.cookPlanName,
            planPrice: (data.price).toFixed(2),
            planValidity: data.cookPlanId.validityInDays,
            totalActionsPerMonth: data.cookPlanId.actionPerMonth,
            discount: (data.discount).toFixed(2),
            totalPrice: (data.amount).toFixed(2),
            boostRank: (profileBoostRank) ? "Profile Featuring" : ""
        })
        const invoiceEmail = data.cookId.email;
        const planName = data.cookPlanId.cookPlanName;
        const username = data.cookId.fullName;
        data = await Transaction.findOneAndUpdate({ _id: data._id }, { $set: { cookPointsId: cookPointsData._id, invoiceUrl } }, { new: true })

        //SendInvoice Mail
        sendMail({
            to: invoiceEmail,
            type: "plans",
            subject: "CookandChef Plan purchase confirmation",
            options: {
                username,
                planName,
                link: invoiceUrl,
                attachments: [{
                    filename: `INVOICE-${data.invoiceNo}`,
                    href: invoiceUrl,
                    contentType: 'application/pdf'
                }],
            }
        })
        res.status(200).send(responseJson(1, 1, data, 'Payment successful'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
}

exports.getCookPayments = async (req, res) => {
    try {
        let {
            active, expired
        } = Object.assign(req.query)
        let dbQuery = { isDeleted: false, cookId: req.user._id, paymentStatus: 1 };
        if (active == 1) dbQuery.transactionEndDateTime = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbQuery.transactionEndDateTime = { $lte: getCurrentDateAndTime() }

        let data = await Transaction.find(dbQuery).sort({ createdAt: -1 }).populate([{ path: "cookPlanId" }, { path: "cookPointsId" }]);
        data = JSON.parse(JSON.stringify(data));
        data = data.map((x) => {
            x.status = (isDateExpired(x.transactionEndDateTime)) ? 0 : 1;
            return x;
        })
        res.status(200).send(responseJson(1, 1, data, 'Payment fetched successfully', {}, data.length))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment fetch failed', e))
    }
}

//Client_Subscription
//Initiate_RazorPay_Payment
exports.initiateClientSubscription = async (req, res) => {

    try {

        let {
            clientPlanId,
            discount,
            address
        } = Object.assign(req.body)

        let planData = await isValidClientPlan(clientPlanId);
        if (discount > planData.price) throw Error("Discount should less than plan price")
        let rzpAmount = (parseFloat(planData.price) * 100) - parseFloat(discount);
        currency = "INR"

        let rzpOrder = await razorpay.orders.create({
            amount: rzpAmount,
            currency
        })
        if (!rzpOrder) throw Error("Unable to craete order. Try again")
        let subscriptionData = await Transaction.create({
            transactionBy: 2,
            transactionNo: rzpOrder.id,
            employerId: req.user._id,
            clientPlanId,
            planName: planData.clientPlanName,
            transactionStartDateTime: getCurrentDateAndTime(),
            refundPolicy: planData.refundPolicy,
            supportAssistance: planData.supportAssistance,
            transactionType: 1,
            price: parseFloat(planData.price),
            discount: parseFloat(discount),
            amount: parseFloat(planData.price) - parseFloat(discount),
            paymentStatus: 0,
            transactionStatus: 0,
            address,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime()
        })
        if (!subscriptionData) throw { statusCode: 0, responseCode: 7, msg: "Unable to subscribe.Try again" }

        res.status(200).send(responseJson(1, 1, subscriptionData, 'Payment successful'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
};


//Client_Payment_Confirmation
exports.confirmClientSubscriptionPayment = async (req, res) => {
    try {

        let {
            transactionNo,
            transactionPaymentNo,
            transactionSignature,
            invoiceNo,
            id
        } = Object.assign(req.body)

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        let data = await Transaction.findOne({ transactionNo, employerId: req.user._id }).populate([{ path: 'clientPlanId' }]);
        console.log({ data })
        const planValidity = data.clientPlanId.validityInDays;
        if (!data) throw Error("Invalid transaction No")
        // if (data && data.paymentStatus != 0) throw Error("Payment already confirmed and updated")
        if (data.invoiceNo) updateBody.invoiceNo = data.invoiceNo;

        //Signature Verification
        let body = transactionNo + "|" + transactionPaymentNo;
        let expectedSignature = crypto.createHmac('sha256', razorpaySecretKey)
            .update(body.toString())
            .digest('hex');
        // if (expectedSignature != transactionSignature) throw Error("Transaction Signature Not Valid")
        // if ((expectedSignature != transactionSignature) || (expectedSignature == transactionSignature)) {

        updateBody.transactionEndDateTime = `${(moment(addDaysToDate(parseInt(planValidity))).format("YYYY-MM-DD"))}T23:59:59.999Z`;
        updateBody.paymentStatus = 1;
        updateBody.transactionStatus = 1;
        updateBody.transactionPaymentNo = transactionPaymentNo;
        updateBody.transactionSignature = transactionSignature;

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
        invoiceNo = `${invoiceCode}${invoiceNo}`
        if (!invoiceNo) throw Error("invoiceNumber not generated.Try again")
        if (!updateBody.invoiceNo) updateBody.invoiceNo = invoiceNo;
        // }

        data = await Transaction.findOneAndUpdate({ transactionNo, employerId: req.user._id }, { $set: updateBody }, { new: true }).
            populate([{ path: "employerId", select: 'fullName email mobile addressLine1 addressLine2 stateName provinceName pincode' },
            { path: "clientPlanId", select: 'clientPlanName supportAssistance eventPoints houseCookPoints partyCateringPoints validityInDays' }]);

        const [userData, clientpointsData] = await Promise.all([
            Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { userPlan: 1 } }),
            ClientPoints.findOneAndUpdate({ clientPlanId: data.clientPlanId._id, clientId: req.user._id }, {
                $set: {
                    clientId: req.user._id, clientPlanId: data.clientPlanId._id,
                    planType: 'paid', planStartsAt: getCurrentDateAndTime(), planExpiresAt: `${(moment(addDaysToDate(parseInt(planValidity))).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                    totalEventPoints: data.clientPlanId.eventPoints, totalHouseCookPoints: data.clientPlanId.houseCookPoints, totalPartyCateringPoints: data.clientPlanId.partyCateringPoints,
                    currentEventPoints: data.clientPlanId.eventPoints, currentHouseCookPoints: data.clientPlanId.houseCookPoints, currentPartyCateringPoints: data.clientPlanId.partyCateringPoints,
                    createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
                }
            }, { new: true, upsert: true, setDefaultsOnInsert: true })
        ]);

        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to confirm the payment. Try again" }
        let userAddress;
        if (data.address) userAddress = data.address;
        if (!data.address) {
            userAddress = "";
            if (data.employerId.addressLine1) userAddress = userAddress + ' ' + data.employerId.addressLine1 + ',';
            if (data.employerId.addressLine2) userAddress = userAddress + ' ' + data.employerId.addressLine2 + ',';
            if (data.employerId.stateName) userAddress = userAddress + ' ' + data.employerId.stateName + ',';
            if (data.employerId.provinceName) userAddress = userAddress + ' ' + data.employerId.provinceName + ',';
            if (data.employerId.pincode) userAddress = userAddress + ' ' + data.employerId.pincode;
            console.log({ userAddress })
        }

        let invoiceBody = {
            fileName: "clientInvoice.html",
            invoiceNumber: data.invoiceNo,
            invoiceDate: moment(data.transactionStartDateTime).format('DD-MM-YYYY'),
            name: data.employerId.fullName,
            email: data.employerId.email,
            mobile: data.employerId.mobile,
            address: ((userAddress.trim()).length) ? userAddress : "-----------------------",
            planValidity: data.clientPlanId.validityInDays,
            planName: data.clientPlanId.clientPlanName,
            planPrice: (data.price).toFixed(2),
            discount: (data.discount).toFixed(2),
            totalPrice: (data.amount).toFixed(2),
            totalProfileViews: (data.clientPlanId.eventPoints) + (data.clientPlanId.houseCookPoints) + (data.clientPlanId.partyCateringPoints)
        }
        if (data.clientPlanId.supportAssistance && data.clientPlanId.supportAssistance == 1) invoiceBody.supportAssistance = "Support Assistance";

        //Invoice Generation
        let invoiceUrl = await invoiceGen(invoiceBody)
        const invoiceEmail = data.employerId.email;
        const planName = data.clientPlanId.clientPlanName;
        const username = data.employerId.fullName;
        data = await Transaction.findOneAndUpdate({ _id: data._id }, { $set: { clientPointsId: clientpointsData._id, invoiceUrl } }, { new: true })

        //SendInvoice Mail
        sendMail({
            to: invoiceEmail,
            type: "plans",
            subject: "CookandChef Plan purchase confirmation",
            options: {
                username,
                planName,
                link: invoiceUrl,
                attachments: [{
                    filename: `INVOICE-${data.invoiceNo}`,
                    href: invoiceUrl,
                    contentType: 'application/pdf'
                }],
            }
        })
        res.status(200).send(responseJson(1, 1, data, 'Payment successful'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
}


exports.getClientPayments = async (req, res) => {
    try {
        let {
            active, expired
        } = Object.assign(req.query)
        let freeDbQuery = { clientId: req.user._id, planType: 'free' };
        let dbQuery = { employerId: req.user._id, isDeleted: false, transactionStatus: 1 };
        if (active == 1) dbQuery.transactionEndDateTime = { $gte: getCurrentDateAndTime() }, freeDbQuery.planExpiresAt = { $gte: getCurrentDateAndTime() };
        if (expired == 1) dbQuery.transactionEndDateTime = { $lte: getCurrentDateAndTime() }, freeDbQuery.planExpiresAt = { $lte: getCurrentDateAndTime() };

        let freePointsData = await ClientPoints.find(freeDbQuery);
        freePointsData = JSON.parse(JSON.stringify(freePointsData));
        freePointsData = freePointsData.map((x) => {
            x.status = (isDateExpired(x.planExpiresAt)) ? 0 : 1;
            return x;
        })
        let data = await Transaction.find(dbQuery).sort({ createdAt: -1 }).populate([{ path: "clientPointsId" }, { path: "clientPlanId" }]);
        data = JSON.parse(JSON.stringify(data));
        data = data.map((x) => {
            x.status = (isDateExpired(x.transactionEndDateTime)) ? 0 : 1;
            return x;
        })
        res.status(200).send(responseJson(1, 1, { freePlans: freePointsData, paidPlans: data }, 'Payment fetched successfully', {}, data.length + 1))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment fetch failed', e))
    }
}


/*------------------------Employer Plan Subscription Apis--------------------------------*/

exports.initiateEmployerSubscription = async (req, res) => {

    try {

        let {
            employerPlanId,
            discount,
            supportAssistance,
            address
        } = Object.assign(req.body)

        let planData = await isValidEmployerPlan(employerPlanId);
        if (discount > planData.price) throw Error("Discount should less than plan price")

        //Support Assistance Logics
        let assistancePrice = 0;
        let assistanceIncluded = 0;
        if (planData.supportAssistance == 1) {
            if (supportAssistance == 1) throw Error("Support assistance already included with the plan")
            else if (supportAssistance == 0) assistancePrice = 0, assistanceIncluded = 1;
        }
        else if (planData.supportAssistance == 0) {
            if (supportAssistance == 1) assistancePrice = parseFloat(planData.assistancePrice), assistanceIncluded = 1;
            else if (supportAssistance == 0) assistancePrice = 0, assistanceIncluded = 0;
        }

        //Pricing_Calculations
        let totalPrice = (parseFloat(planData.price) + parseFloat(assistancePrice));
        console.log({ totalPrice })
        let rzpOrder = await razorpay.orders.create({
            amount: totalPrice * 100,
            currency: "INR"
        })
        console.log({ rzpOrder })
        if (!rzpOrder) throw Error("Unable to generate order. Try again")
        let subscriptionData = await Transaction.create({
            transactionBy: 2,
            transactionNo: rzpOrder.id,
            employerId: req.user._id,
            employerPlanId,
            address,
            planName: planData.employerPlanName,
            refundPolicy: planData.refundPolicy,
            transactionStartDateTime: getCurrentDateAndTime(),
            transactionType: 1,
            price: totalPrice,
            discount: parseFloat(discount),
            amount: parseFloat(totalPrice) - parseFloat(discount),
            paymentStatus: 0,
            transactionStatus: 0,
            assistancePrice,
            assistanceIncluded,
            paymentDetails: { refundPolicy: planData.refundPolicy, assistanceIncluded, planPrice: parseFloat(planData.price), assistancePrice, discount: parseFloat(discount), totalPrice: parseFloat(totalPrice) - parseFloat(discount) },
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime(),
            categoryType: 'plan'
        })
        if (!subscriptionData) throw { statusCode: 0, responseCode: 7, msg: "Unable to subscribe.Try again" }

        res.status(200).send(responseJson(1, 1, subscriptionData, 'Payment successful'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
};

exports.confirmEmployerSubscriptionPayment = async (req, res) => {
    try {

        let {
            transactionNo,
            transactionPaymentNo,
            transactionSignature,
            invoiceNo,
            id
        } = Object.assign(req.body)

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        let data = await Transaction.findOne({ transactionNo, employerId: req.user._id }).populate([{ path: 'employerPlanId' }]);
        const planValidity = data.employerPlanId.validityInDays;
        console.log({ data })
        if (!data) throw Error("Invalid transaction No")
        // if (data && data.paymentStatus != 0) throw Error("Payment already confirmed and updated")
        if (data.invoiceNo) updateBody.invoiceNo = data.invoiceNo;

        //Signature Verification
        let body = transactionNo + "|" + transactionPaymentNo;
        let expectedSignature = crypto.createHmac('sha256', razorpaySecretKey)
            .update(body.toString())
            .digest('hex');
        // if (expectedSignature == transactionSignature) throw Error("Transaction Signature Not Valid")
        // if ((expectedSignature != transactionSignature) || (expectedSignature == transactionSignature)) {

        updateBody.transactionEndDateTime = `${(moment(addDaysToDate(parseInt(planValidity))).format("YYYY-MM-DD"))}T23:59:59.999Z`
        updateBody.paymentStatus = 1;
        updateBody.transactionStatus = 1;
        updateBody.transactionPaymentNo = transactionPaymentNo;
        updateBody.transactionSignature = transactionSignature;

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
        invoiceNo = `${invoiceCode}${invoiceNo}`
        if (!invoiceNo) throw Error("invoiceNumber not generated.Try again")
        if (!updateBody.invoiceNo) updateBody.invoiceNo = invoiceNo;
        // }

        data = await Transaction.findOneAndUpdate({ transactionNo, employerId: req.user._id }, { $set: updateBody }, { new: true }).populate([{ path: "employerId", select: 'fullName email mobile addressLine1 addressLine2 stateName provinceName pincode' }, { path: 'employerPlanId' }]);
        const [employerData, employerpointsData] = await Promise.all([
            Employer.findOneAndUpdate({ _id: req.user._id }, { $set: { userPlan: 1 } }),
            EmployerPoints.create({
                employerId: req.user._id, employerPlanId: data.employerPlanId._id,
                planType: 'paid', planStartsAt: getCurrentDateAndTime(), planExpiresAt: `${(moment(addDaysToDate(parseInt(planValidity))).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                totalJobPoints: data.employerPlanId.jobPoints, totalProfileViewPoints: data.employerPlanId.profileViewPoints, totalResponsePoints: data.employerPlanId.responsePoints,
                currentJobPoints: data.employerPlanId.jobPoints, currentProfileViewPoints: data.employerPlanId.profileViewPoints, currentResponsePoints: data.employerPlanId.responsePoints,
                supportAssistance: data.assistanceIncluded, planTransactionId: data._id,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            })
        ]);
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to confirm the payment. Try again" }
        let userAddress;
        if (data.address) userAddress = data.address;
        else if (!data.address) {
            userAddress = "";
            if (data.employerId.addressLine1) userAddress = userAddress + ' ' + data.employerId.addressLine1 + ',';
            if (data.employerId.addressLine2) userAddress = userAddress + ' ' + data.employerId.addressLine2 + ',';
            if (data.employerId.stateName) userAddress = userAddress + ' ' + data.employerId.stateName + ',';
            if (data.employerId.provinceName) userAddress = userAddress + ' ' + data.employerId.provinceName + ',';
            if (data.employerId.pincode) userAddress = userAddress + ' ' + data.employerId.pincode;
            console.log({ userAddress })
        }

        //Invoice Generation
        let invoiceUrl = await invoiceGen({
            fileName: 'employerInvoice.html',
            invoiceNumber: data.invoiceNo,
            invoiceDate: moment(data.transactionStartDateTime).format('DD-MM-YYYY'),
            name: data.employerId.fullName,
            email: data.employerId.email,
            mobile: data.employerId.mobile,
            address: ((userAddress.trim()).length) ? userAddress : "-----------------------",
            planName: data.planName,
            planValidity: data.employerPlanId.validityInDays,
            totalJobPoints: data.employerPlanId.jobPoints,
            totalProfileViewPoints: data.employerPlanId.profileViewPoints,
            totalResponsePoints: data.employerPlanId.responsePoints,
            planPrice: (data.price).toFixed(2),
            discount: (data.discount).toFixed(2),
            totalPrice: (data.amount).toFixed(2),
        })
        const invoiceEmail = data.employerId.email;
        const planName = data.planName;
        const username = data.employerId.fullName;
        data = await Transaction.findOneAndUpdate({ _id: data._id }, { $set: { employerPointsId: employerpointsData._id, invoiceUrl } }, { new: true })

        //SendInvoice Mail
        sendMail({
            to: invoiceEmail,
            type: "plans",
            subject: "CookandChef Plan purchase confirmation",
            options: {
                username,
                planName,
                link: invoiceUrl,
                attachments: [{
                    filename: `INVOICE-${data.invoiceNo}`,
                    href: invoiceUrl,
                    contentType: 'application/pdf'
                }],
            }
        })
        res.status(200).send(responseJson(1, 1, data, 'Payment successful'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
}


exports.getEmployerPayments = async (req, res) => {
    try {
        let {
            active, expired
        } = Object.assign(req.query)
        let dbQuery = { isDeleted: false, employerId: req.user._id };
        if (active == 1) dbQuery.planExpiresAt = { $gte: getCurrentDateAndTime() }
        if (expired == 1) dbQuery.planExpiresAt = { $lte: getCurrentDateAndTime() }

        let data = await EmployerPoints.find(dbQuery).populate([
            { path: "planTransactionId" },
            { path: "assistanceTransactionId" }
        ]).sort({ createdAt: -1 });
        data = JSON.parse(JSON.stringify(data));
        data = data.map((x) => {
            x.status = (isDateExpired(x.planExpiresAt)) ? 0 : 1;
            return x;
        })
        res.status(200).send(responseJson(1, 1, data, 'Payment fetched successfully', {}, data.length))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment fetch failed', e))
    }
}

exports.initiateEmployerPlanAssistance = async (req, res) => {
    try {

        let {
            employerPointsId,
            discount,
            address
        } = Object.assign(req.body)

        let pointsData = await EmployerPoints.findOne({ _id: employerPointsId, isDeleted: false }).populate([{ path: "employerPlanId" }])
        if (!pointsData) throw Error("Invalid pointsId")
        if (pointsData && pointsData.supportAssistance == 1) throw Error("Already support assistance is active for this pointsId")

        let assistancePrice = parseFloat(pointsData.employerPlanId.assistancePrice);
        let totalPrice = parseFloat(pointsData.employerPlanId.assistancePrice) + parseFloat(discount);
        //Pricing_Calculations
        let rzpOrder = await razorpay.orders.create({
            amount: totalPrice * 100,
            currency: "INR"
        })
        console.log({ rzpOrder })

        if (!rzpOrder) throw Error("Unable to generate payment. Try again")
        let subscriptionData = await Transaction.create({
            transactionBy: 2,
            address,
            transactionNo: rzpOrder.id,
            employerId: req.user._id,
            employerPlanId: pointsData.employerPlanId._id,
            planName: pointsData.employerPlanId.employerPlanName,
            transactionStartDateTime: getCurrentDateAndTime(),
            transactionType: 1,
            price: assistancePrice,
            discount: parseFloat(discount),
            amount: totalPrice,
            paymentStatus: 0,
            transactionStatus: 0,
            employerPointsId,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime(),
            categoryType: 'assistance'

        })
        if (!subscriptionData) throw { statusCode: 0, responseCode: 0, msg: "Unable to subscribe.Try again" }
        res.status(200).send(responseJson(1, 1, subscriptionData, 'Payment successful'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
}


exports.confirmEmployerAssistanceSubscriptionPayment = async (req, res) => {
    try {

        let {
            transactionNo,
            transactionPaymentNo,
            transactionSignature,
            invoiceNo,
            id
        } = Object.assign(req.body)

        let updateBody = { updatedAt: getCurrentDateAndTime() };
        let data = await Transaction.findOne({ transactionNo, employerId: req.user._id }).populate([{ path: 'employerPlanId' }]);
        const planValidity = data.employerPlanId.validityInDays;
        console.log({ data })
        if (!data) throw Error("Invalid transaction No")
        // if (data && data.paymentStatus != 0) throw Error("Payment already confirmed and updated")
        if (data.invoiceNo) updateBody.invoiceNo = data.invoiceNo;

        //Signature Verification
        let body = transactionNo + "|" + transactionPaymentNo;
        let expectedSignature = crypto.createHmac('sha256', razorpaySecretKey)
            .update(body.toString())
            .digest('hex');
        // if (expectedSignature == transactionSignature) throw Error("Transaction Signature Not Valid")
        // if ((expectedSignature != transactionSignature) || (expectedSignature == transactionSignature)) {

        updateBody.transactionEndDateTime = `${(moment(addDaysToDate(parseInt(planValidity))).format("YYYY-MM-DD"))}T23:59:59.999Z`;
        updateBody.paymentStatus = 1;
        updateBody.transactionStatus = 1;
        updateBody.transactionPaymentNo = transactionPaymentNo;
        updateBody.transactionSignature = transactionSignature;

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
        invoiceNo = `${invoiceCode}${invoiceNo}`
        if (!invoiceNo) throw Error("invoiceNumber not generated.Try again")
        if (!updateBody.invoiceNo) updateBody.invoiceNo = invoiceNo;
        // }

        data = await Transaction.findOneAndUpdate({ transactionNo, employerId: req.user._id }, { $set: updateBody }, { new: true }).populate([{ path: "employerId", select: 'fullName email mobile addressLine1 addressLine2 stateName provinceName pincode' }, { path: 'employerPlanId' }]);
        const pointsData = await EmployerPoints.findOneAndUpdate({ _id: data.employerPointsId }, { $set: { supportAssistance: 1, assistanceTransactionId: data._id } }, { new: true });
        console.log({ pointsData })
        if (!data) throw { statusCode: 500, responseCode: 5, msg: "Unable to confirm the payment. Try again" }
        let userAddress;
        if (data.userAddress) userAddress = data.address;
        else if (!data.userAddress) {
            userAddress = "";
            if (data.employerId.addressLine1) userAddress = userAddress + ' ' + data.employerId.addressLine1 + ',';
            if (data.employerId.addressLine2) userAddress = userAddress + ' ' + data.employerId.addressLine2 + ',';
            if (data.employerId.stateName) userAddress = userAddress + ' ' + data.employerId.stateName + ',';
            if (data.employerId.provinceName) userAddress = userAddress + ' ' + data.employerId.provinceName + ',';
            if (data.employerId.pincode) userAddress = userAddress + ' ' + data.employerId.pincode;
            console.log({ userAddress })
        }
        //Invoice Generation
        let invoiceUrl = await invoiceGen({
            fileName: 'employerAssistanceInvoice.html',
            invoiceNumber: data.invoiceNo,
            invoiceDate: moment(data.transactionStartDateTime).format('DD-MM-YYYY'),
            name: data.employerId.fullName,
            email: data.employerId.email,
            mobile: data.employerId.mobile,
            address: ((userAddress.trim()).length) ? userAddress : "-----------------------",
            planPrice: (data.price).toFixed(2),
            discount: (data.discount).toFixed(2),
            totalPrice: (data.amount).toFixed(2),
        })

        const invoiceEmail = data.employerId.email;
        const planName = data.employerPlanId.planName || "Assistance";
        const username = data.employerId.fullName;

        data = await Transaction.findOneAndUpdate({ _id: data._id }, { $set: { employerPointsId: pointsData._id, invoiceUrl } }, { new: true })
        //SendInvoice Mail
        sendMail({
            to: invoiceEmail,
            type: "plans",
            subject: "CookandChef Plan purchase confirmation",
            options: {
                username,
                planName,
                link: invoiceUrl,
                attachments: [{
                    filename: `INVOICE-${data.invoiceNo}`,
                    href: invoiceUrl,
                    contentType: 'application/pdf'
                }],
            }
        })
        res.status(200).send(responseJson(1, 1, data, 'Payment successful'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Payment failed', e))
    }
}

exports.allotPlansByAdmin = async (req, res) => {
    try {
        let {
            userId, securityKey,
            planId, invoiceNo, userAddress,
            userType, planModel, transactionData,
            userModel, transactionBy, planData
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            userId,
            planId,
            userType,
            securityKey
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        let securityKeyData = await AdminAuth.findOne({ securityKey });
        if (!securityKeyData) throw { statusCode: 400, responseCode: 2, msg: "Invalid securityKey. Try again!" }

        if (userType !== "chef" && userType !== "client" && userType !== "employer") throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid usertype." }
        if (userType == "chef") userModel = Cook, planModel = CookPlan, transactionBy = 1, planData = await isValidCookPlan(planId);
        if (userType == "client") userModel = Employer, planModel = ClientPlan, transactionBy = 2, planData = await isValidClientPlan(planId);
        if (userType == "employer") userModel = Employer, planModel = EmployerPlan, transactionBy = 2, planData = await isValidEmployerPlan(planId);

        console.log({ planData })
        let user = await userModel.findOne({ _id: userId, status: { $nin: [0] } });
        if (!user) throw { statusCode: 404, responseCode: 0, msg: "No profile found!" }
        //User_Address_Generation
        userAddress = "";
        if (user.addressLine1) userAddress = userAddress + ' ' + user.addressLine1 + ',';
        if (user.addressLine2) userAddress = userAddress + ' ' + user.addressLine2 + ',';
        if (user.stateName) userAddress = userAddress + ' ' + user.stateName + ',';
        if (user.provinceName) userAddress = userAddress + ' ' + user.provinceName + ',';
        if (user.pincode) userAddress = userAddress + ' ' + user.pincode;

        let paymentData = {
            transactionNo: new Date(getCurrentDateAndTime()).getTime(),
            transactionBy,
            transactionStartDateTime: getCurrentDateAndTime(),
            transactionType: 6,
            price: parseFloat(planData.price),
            discount: 0,
            amount: parseFloat(planData.price) - 0,
            paymentStatus: 1,
            transactionStatus: 1,
            createdAt: getCurrentDateAndTime(),
            updatedAt: getCurrentDateAndTime(),
            transactionEndDateTime: `${(moment(addDaysToDate(parseInt(planData.validityInDays))).format("YYYY-MM-DD"))}T23:59:59.999Z`,
            isSelfPayment: false
        }
        if (req.user.role == "support") paymentData.executiveId = req.user._id;
        if (req.user.role == "admin") paymentData.adminId = req.user._id;

        //Invoice Generations
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
        invoiceNo = `${invoiceCode}${invoiceNo}`
        if (!invoiceNo) throw Error("invoiceNumber not generated.Try again")
        paymentData.invoiceNo = invoiceNo;

        if (userType == "chef") {
            if (user.memberType != 1 || user.cookType != 2) throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid chef." }
            transactionData = await Transaction.create({ ...paymentData, cookId: userId, cookPlanId: planId, planName: planData.cookPlanName });
            console.log({ transactionData })
            if (!transactionData) throw { statusCode: 500, responseCode: 0, msg: "Plan alloting failed. Try again!" }
            const [userData, pointsData] = await Promise.all([
                Cook.findOneAndUpdate({ _id: userId }, {
                    $set: {
                        userPlan: 1, resumeBuilder: planData.resumeBuilder, profileBoostRank: planData.profileBoostRank
                    }
                }),
                CookPoints.findOneAndUpdate({ cookId: userId }, {
                    $set: {
                        chefDailyLimit: planData.actionPerDay, chefMonthlyLimit: planData.actionPerMonth,
                        chefDailyLimitBalance: planData.actionPerDay, chefMonthlyLimitBalance: planData.actionPerMonth,
                        chefPlanStartDate: getCurrentDateAndTime(), chefPlanEndDate: `${(moment(addDaysToDate(parseInt(planData.validityInDays))).format("YYYY-MM-DD"))}T23:59:59.999Z`, chefPlanRenewalDate: `${(moment(addDaysToDate(parseInt(planData.validityInDays) + 1)).format("YYYY-MM-DD"))}T00:00:00.000Z`
                    }
                })
            ]);

            console.log({ userData, pointsData })

            //Invoice Generation
            let invoiceUrl = await invoiceGen({
                fileName: 'cookInvoice.html',
                invoiceNumber: transactionData.invoiceNo,
                invoiceDate: moment(transactionData.transactionStartDateTime).format('DD-MM-YYYY'),
                name: user.fullName,
                email: user.email,
                mobile: user.mobile,
                address: userAddress ? userAddress : "-----------------------",
                planName: planData.cookPlanName,
                planPrice: (transactionData.price).toFixed(2),
                planValidity: planData.validityInDays,
                totalActionsPerMonth: planData.actionPerMonth,
                discount: (transactionData.discount).toFixed(2),
                totalPrice: (transactionData.amount).toFixed(2),
            })
            transactionData = await Transaction.findOneAndUpdate({ _id: transactionData._id }, { $set: { cookPointsId: pointsData._id, invoiceUrl } }, { new: true })
        }
        else if (userType == "employer") {
            if (user.memberType != 2) throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid employer." }
            transactionData = await Transaction.create({ ...paymentData, employerId: userId, employerPlanId: planId, planName: planData.employerPlanName, refundPolicy: planData.refundPolicy, assistanceIncluded: planData.supportAssistance, assistancePrice: planData.assistancePrice });
            console.log({ transactionData })
            if (!transactionData) throw { statusCode: 500, responseCode: 0, msg: "Plan alloting failed. Try again!" }
            const [employerData, employerpointsData] = await Promise.all([
                Employer.findOneAndUpdate({ _id: userId }, { $set: { userPlan: 1 } }),
                EmployerPoints.create({
                    employerId: userId, employerPlanId: planId,
                    planType: 'paid', planStartsAt: getCurrentDateAndTime(), planExpiresAt: `${(moment(addDaysToDate(parseInt(planData.validityInDays))).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                    totalJobPoints: planData.jobPoints, totalProfileViewPoints: planData.profileViewPoints, totalResponsePoints: planData.responsePoints,
                    currentJobPoints: planData.jobPoints, currentProfileViewPoints: planData.profileViewPoints, currentResponsePoints: planData.responsePoints,
                    supportAssistance: planData.supportAssistance, planTransactionId: transactionData._id,
                    createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
                })
            ]);
            console.log({ employerData, employerpointsData })

            //Invoice Generation
            let invoiceUrl = await invoiceGen({
                fileName: 'employerInvoice.html',
                invoiceNumber: transactionData.invoiceNo,
                invoiceDate: moment(transactionData.transactionStartDateTime).format('DD-MM-YYYY'),
                name: user.fullName,
                email: user.email,
                mobile: user.mobile,
                address: userAddress ? userAddress : "-----------------------",
                planName: planData.planName,
                planValidity: planData.validityInDays,
                totalJobPoints: planData.jobPoints,
                totalProfileViewPoints: planData.profileViewPoints,
                totalResponsePoints: planData.responsePoints,
                planPrice: (transactionData.price).toFixed(2),
                discount: (transactionData.discount).toFixed(2),
                totalPrice: (transactionData.amount).toFixed(2),
            });
            transactionData = await Transaction.findOneAndUpdate({ _id: transactionData._id }, { $set: { employerPointsId: employerpointsData._id, invoiceUrl } }, { new: true })
        }
        else if (userType == "client") {
            if (user.memberType != 1) throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid client." }
            transactionData = await Transaction.create({ ...paymentData, employerId: userId, clientPlanId: planId, planName: planData.clientPlanName, refundPolicy: planData.refundPolicy, assistanceIncluded: planData.supportAssistance, assistancePrice: planData.assistancePrice });
            console.log({ transactionData })
            if (!transactionData) throw { statusCode: 500, responseCode: 0, msg: "Plan alloting failed. Try again!" }
            const [userData, clientpointsData] = await Promise.all([
                Employer.findOneAndUpdate({ _id: userId }, { $set: { userPlan: 1 } }),
                ClientPoints.findOneAndUpdate({ clientPlanId: planId, clientId: userId }, {
                    $set: {
                        clientId: userId, clientPlanId: planId,
                        planType: 'paid', planStartsAt: getCurrentDateAndTime(), planExpiresAt: `${(moment(addDaysToDate(parseInt(planData.validityInDays))).format("YYYY-MM-DD"))}T23:59:59.999Z`,
                        totalEventPoints: planData.eventPoints, totalHouseCookPoints: planData.houseCookPoints, totalPartyCateringPoints: planData.partyCateringPoints,
                        currentEventPoints: planData.eventPoints, currentHouseCookPoints: planData.houseCookPoints, currentPartyCateringPoints: planData.partyCateringPoints,
                        supportAssistance: planData.supportAssistance, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime(), planTransactionId: transactionData._id
                    }
                }, { new: true, upsert: true, setDefaultsOnInsert: true })
            ]);
            console.log({ userData, clientpointsData })

            //Invoice Generation
            let invoiceBody = {
                fileName: "clientInvoice.html",
                invoiceNumber: transactionData.invoiceNo,
                invoiceDate: moment(transactionData.transactionStartDateTime).format('DD-MM-YYYY'),
                name: user.fullName,
                email: user.email,
                mobile: user.mobile,
                address: userAddress ? userAddress : "-----------------------",
                planValidity: planData.validityInDays,
                planName: planData.clientPlanName,
                planPrice: (transactionData.price).toFixed(2),
                discount: (transactionData.discount).toFixed(2),
                totalPrice: (transactionData.amount).toFixed(2),
                totalProfileViews: (planData.eventPoints) + (planData.houseCookPoints) + (planData.partyCateringPoints)
            }
            if (planData.supportAssistance && planData.supportAssistance == 1) invoiceBody.supportAssistance = "Support Assistance";

            //Invoice Generation of Payments
            let invoiceUrl = await invoiceGen(invoiceBody)
            transactionData = await Transaction.findOneAndUpdate({ _id: transactionData._id }, { $set: { clientPointsId: clientpointsData._id, invoiceUrl } }, { new: true })
        }

        res.status(200).send(responseJson(1, 1, {}, `Plan is alloted to ${userType} successfully!`))

    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Plan alloting failed', e))
    }
}

exports.cancelOrRefundPlans = async (req, res) => {
    try {
        let {
            userId, pointsId, userType, status
        } = Object.assign(req.body, req.query, req.params)

        const requiredFields = {
            userId, pointsId, userType, status
        }
        let requestDataValid = isRequestDataValid(requiredFields, '1234')
        if (requestDataValid !== true) throw Error(requestDataValid);

        if (status !== "refundrequested" && status !== "cancelled") throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid status." }
        if (userType !== "client" && userType !== "employer" && userType !== "chef") throw { statusCode: 400, responseCode: 2, msg: "Please provide a valid usertype." }

        let modelName, pointsModelName, pointsData, userDbQuery;
        if (userType == "chef") modelName = Cook, pointsModelName = CookPoints, userDbQuery = { memberType: 1, cookType: 2, _id: userId };
        if (userType == "employer") modelName = Employer, pointsModelName = EmployerPoints, userDbQuery = { memberType: 2, _id: userId };
        if (userType == "client") modelName = Employer, pointsModelName = ClientPoints, userDbQuery = { memberType: 1, _id: userId };

        let userData = await modelName.findOne(userDbQuery);
        if (!userData) throw { statusCode: 404, responseCode: 0, msg: "No profile found!" }

        pointsData = await pointsModelName.findOne({ _id: pointsId, isDeleted: false });
        if (!pointsData) throw { statusCode: 404, responseCode: 0, msg: "Please provide a valid pointsId." }

        if (userType == "employer" || userType == "client") {
            pointsData = await pointsModelName.findOneAndUpdate({ _id: pointsId }, { $set: { planType: status, planExpiresAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() } }, { new: true })
        }
        if (userType == "chef") {
            pointsData = await CookPoints.findOneAndUpdate({ _id: pointsId }, { $set: { chefDailyLimitBalance: 10, chefMonthlyLimitBalance: 50, chefPlanEndDate: getCurrentDateAndTime(), chefPlanRenewalDate: `${getNextDay()}T00:00:00.000Z` } }, { new: true })
        }

        res.status(200).send(responseJson(1, 1, pointsData, `Plan updated successfully!`))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Plan updation failed', e))
    }
}
