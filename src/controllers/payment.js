import Razorpay from 'razorpay';
import moment from 'moment';
import { getLoggerWithLabel } from '../../utils/logger/logger.js';
const Logger = getLoggerWithLabel('Payments_Controller');
import AppUtils from '../../utils/appUtils.js';
import { getCurrentDateAndTime, addDaysToDate, getCurrentDate } from '../../helpers/dates.js';
import { Plans, Payment, UserCourse, Course, User } from '../models/index.js';
const razorpay = new Razorpay({
    key_id: "rzp_test_9fCU1YLVql9Fpd",
    key_secret: "2GnMBiAdsUfrpJE70dabHUBA",
});

class PaymentsController {


    static async createRzpPayment(req, res, next) {

        try {

            let {
                planId,
                courseIds,
                currentDate,
                discount

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                planId,
                courseIds,
                discount
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            if (req.user.subscriptionStatus !== 0) throw { status: 403, message: "Your account is already having an active plan." }
            currentDate = getCurrentDateAndTime();

            const planData = await Plans.findOne({ isDeleted: false, _id: planId });
            if (!planData) throw { status: 404, message: "No plan found." }
            if (planData && planData.status == 0) throw { status: 404, message: "The requested plan is currently inactive." }

            courseIds = [...new Set(courseIds)];
            if (courseIds.length !== planData.maxCourse) throw { status: 400, message: `Please select ${planData.maxCourse} courses as per the plan.` }

            const basePrice = planData.price;
            const gstPercent = planData.gstPercent;
            const gstPrice = (basePrice * (gstPercent / 100));
            const totalPrice = (basePrice + gstPrice) - discount;


            const rzpOrder = await razorpay.orders.create({
                amount: parseInt(totalPrice) * 100,
                currency: "INR"
            })
            if (!rzpOrder) throw { status: 422, message: "Unable to generate payment. Try again" }

            const paymentData = await Payment.create({
                createdAt: currentDate, updatedAt: currentDate,
                userId: req.user._id, planId,
                totalPrice: totalPrice,
                basePrice, gstPercent, gstPrice, discount,
                orderId: rzpOrder.id,
                paymentData: rzpOrder,
                paymentType: "razorpay",
                paymentStatus: 0
            });
            if (!paymentData) throw { status: 422, message: "Unable to create payment. Try again" }
            Logger.info('Rzp payment created successfully')
            res.status(200).send({ status: 1, message: "Payment created successfully!", data: paymentData })
        }
        catch (error) {
            next(error)
        }
    };

    //RazorPay_Payment_Confirmation
    static async storeRzpPayment(req, res, next) {
        try {

            let {
                orderId,
                rzpSignature,
                transactionStatus,
                paymentId,
                invoiceNumber,
                courseIds
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                orderId,
                rzpSignature,
                transactionStatus,
                paymentId,
                courseIds
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let currentDate = getCurrentDateAndTime();
            const userId = req.user._id;

            if (req.user.subscriptionStatus !== 0) throw { status: 403, message: "Your account is already having an active plan." }
            if (transactionStatus !== 1 && transactionStatus !== 2 && transactionStatus !== 3) throw { status: 400, message: "Please provide a valid transaction status." }

            courseIds = [...new Set(courseIds)];
            if (!courseIds.length) throw { status: 400, message: "Please provide atleast once courseId." }

            //Validating Given order and UserId is valid or not
            const checkPayment = await Payment.findOne({ orderId, userId }).populate([{ path: 'planId', select: 'maxCourse validityInDays' }]);
            if (!checkPayment) throw { status: 404, message: "Please provide a valid orderId." }
            if (checkPayment && checkPayment.paymentStatus != 0) throw { status: 400, message: "This payment is already completed." }
            if (courseIds.length !== checkPayment.planId.maxCourse) throw { status: 400, message: `Please select ${planData.maxCourse} courses as per the plan.` }

            // Fetching data from razorpay integrations
            const rzpData = await razorpay.orders.fetch(orderId);

            //Preparing Updating Body
            let paymentUpdateBody = {
                paymentStatus: transactionStatus,
                rzpSignature,
                paymentId,
                paymentData: rzpData,
                updatedAt: currentDate
            };

            if (transactionStatus == 1) {

                if (checkPayment.invoiceNumber) invoiceNumber = checkPayment.invoiceNumber;
                else if (!checkPayment.invoiceNumber) {
                    //Calculating Current Invoice Number
                    let invoiceCode = 'LM';
                    invoiceNumber = `${invoiceCode}${Math.floor(Date.now() / 1000)}`;
                }
                if (!invoiceNumber) throw { status: 422, message: "InvoiceNumber not generated.Try again" }
                //Updating Invoice numbers for payments
                paymentUpdateBody.invoiceNumber = invoiceNumber;

                //Subscription Duration generation
                const { validityInDays, maxCourse } = checkPayment.planId;
                let planStartsAt = currentDate;
                let planExpiresAt = moment(addDaysToDate(parseInt(validityInDays))).format('YYYY-MM-DD')
                planExpiresAt = `${planExpiresAt}T23:59:00.000Z`;

                paymentUpdateBody.planStartsAt = planStartsAt, paymentUpdateBody.planExpiresAt = planExpiresAt;
                let userUpdateBody = { updatedAt: getCurrentDateAndTime(), paymentId: checkPayment._id, planStartsAt, planExpiresAt, subscriptionStatus: 1 };

                if (checkPayment.planId.maxCourse) userUpdateBody.maxCourse = maxCourse;
                await User.findOneAndUpdate({ _id: userId }, { $set: userUpdateBody }, { new: true })
                // await UserCourse.updateMany({ userId }, { $set: { isDeleted: true, updatedAt: currentDate } }, { multi: true });
                for (let x of courseIds) {
                    let courseData = await Course.findOne({ _id: x, isDeleted: false });
                    if (courseData) {
                        await UserCourse.findOneAndUpdate({ courseId: x, userId }, {
                            courseId: x, userId,
                            enrolledOn: 1,
                            isDeleted: false,
                            createdAt: currentDate,
                            updatedAt: currentDate
                        }, { new: true, upsert: true, setDefaultsOnInsert: true })
                    }
                }

            }

            const paymentData = await Payment.findOneAndUpdate({ orderId, userId }, { $set: paymentUpdateBody }, { new: true });
            if (!paymentData) throw { status: 422, message: "Unable to update payment.Try again" }

            Logger.info('Rzp payment confirmed successfully')
            res.status(200).send({ status: 1, message: "Payment confirmed successfully!", data: paymentData })
        }
        catch (error) {
            next(error)
        }
    }

    //Upgrade_Plans
    static async getUpgradePlansList(req, res, next) {
        try {
            let {
                id,
                limit,
                skip,
                page

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const userId = req.userId;
            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            const { latestPlanId, latestPlanPrice, planExpiresAt } = req;
            const dbQuery = { isDeleted: false, price: { $gt: latestPlanPrice }, _id: { $nin: [String(latestPlanId)] } };
            if (id) dbQuery._id = id;
            if (latestPlanPrice > 0) dbQuery.upgradePlan = true;

            const data = await Plans.find(dbQuery).limit(limit).skip(skip);
            const totalDataCount = await Plans.find(dbQuery).countDocuments();

            Logger.info('Upgrade plans list fetched successfully')
            res.status(200).send({ status: 1, message: "Upgrade plans list fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async initiateUpgradePlanPayment(req, res, next) {

        try {

            let {
                planId,
                courseIds,
                discount

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                planId,
                courseIds,
                discount
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const currentDate = getCurrentDateAndTime();
            const userId = req.userId;
            const { latestPlanId, latestPlanPrice, planExpiresAt } = req;

            const planData = await Plans.findOne({ isDeleted: false, _id: planId });
            if (!planData) throw { status: 404, message: "No plan found." }
            if (planData && planData.status == 0) throw { status: 404, message: "The requested plan is currently inactive." }

            courseIds = [...new Set(courseIds)];
            if (courseIds.length > planData.maxCourse) throw { status: 400, message: `Please select ${planData.maxCourse} courses as per the plan.` }

            const basePrice = planData.price;
            const gstPercent = planData.gstPercent;
            const gstPrice = (basePrice * (gstPercent / 100));
            let totalPrice = (basePrice + gstPrice) - discount - latestPlanPrice - (latestPlanPrice * (gstPercent / 100));
            totalPrice = parseFloat(totalPrice.toFixed(2));


            const rzpOrder = await razorpay.orders.create({
                amount: parseInt(totalPrice) * 100,
                currency: "INR"
            })
            if (!rzpOrder) throw { status: 422, message: "Unable to generate payment. Try again" }

            const paymentData = await Payment.create({
                createdAt: currentDate, updatedAt: currentDate,
                userId, planId,
                totalPrice: totalPrice,
                basePrice, gstPercent, gstPrice, discount,
                orderId: rzpOrder.id,
                paymentData: rzpOrder,
                paymentType: "razorpay",
                paymentStatus: 0,
                purchaseType: 2
            });
            if (!paymentData) throw { status: 422, message: "Unable to create payment. Try again" }
            Logger.info('Upgrade plan rzp payment created successfully')
            res.status(200).send({ status: 1, message: "Payment created successfully!", data: paymentData })
        }
        catch (error) {
            next(error)
        }
    };

    //RazorPay_Payment_Confirmation
    static async confirmRzpUpgradePlanPayment(req, res, next) {
        try {

            let {
                orderId,
                rzpSignature,
                transactionStatus,
                paymentId,
                invoiceNumber,
                courseIds
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                orderId,
                rzpSignature,
                transactionStatus,
                paymentId,
                courseIds
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let currentDate = getCurrentDateAndTime();
            const userId = req.user._id;
            const { latestPlanId, latestPlanPrice, planExpiresAt } = req;

            if (transactionStatus !== 1 && transactionStatus !== 2 && transactionStatus !== 3) throw { status: 400, message: "Please provide a valid transaction status." }

            courseIds = [...new Set(courseIds)];
            if (!courseIds.length) throw { status: 400, message: "Please provide atleast once courseId." }

            //Validating Given order and UserId is valid or not
            const checkPayment = await Payment.findOne({ orderId, userId }).populate([{ path: 'planId', select: 'maxCourse validityInDays' }]);
            if (!checkPayment) throw { status: 404, message: "Please provide a valid orderId." }
            if (checkPayment && checkPayment.paymentStatus != 0) throw { status: 400, message: "This payment is already completed." }
            if (courseIds.length > checkPayment.planId.maxCourse) throw { status: 400, message: `Please select ${planData.maxCourse} courses as per the plan.` }

            // Fetching data from razorpay integrations
            const rzpData = await razorpay.orders.fetch(orderId);

            //Preparing Updating Body
            let paymentUpdateBody = {
                paymentStatus: transactionStatus,
                rzpSignature,
                paymentId,
                paymentData: rzpData,
                updatedAt: currentDate
            };

            if (transactionStatus == 1) {

                if (checkPayment.invoiceNumber) invoiceNumber = checkPayment.invoiceNumber;
                else if (!checkPayment.invoiceNumber) {
                    //Calculating Current Invoice Number
                    let invoiceCode = 'LM';
                    invoiceNumber = `${invoiceCode}${Math.floor(Date.now() / 1000)}`;
                }
                if (!invoiceNumber) throw { status: 422, message: "InvoiceNumber not generated.Try again" }
                //Updating Invoice numbers for payments
                paymentUpdateBody.invoiceNumber = invoiceNumber;

                //Subscription Duration generation
                const { maxCourse } = checkPayment.planId;
                let planStartsAt = currentDate;

                paymentUpdateBody.planStartsAt = planStartsAt, paymentUpdateBody.planExpiresAt = planExpiresAt;
                let userUpdateBody = { updatedAt: getCurrentDateAndTime(), paymentId: checkPayment._id, planStartsAt, planExpiresAt, subscriptionStatus: 1 };

                if (checkPayment.planId.maxCourse) userUpdateBody.maxCourse = maxCourse;
                await User.findOneAndUpdate({ _id: userId }, { $set: userUpdateBody }, { new: true })
                for (let x of courseIds) {
                    let courseData = await Course.findOne({ _id: x, isDeleted: false });
                    if (courseData) {
                        await UserCourse.findOneAndUpdate({ courseId: x, userId }, {
                            courseId: x, userId,
                            enrolledOn: 1,
                            isDeleted: false,
                            createdAt: currentDate,
                            updatedAt: currentDate
                        }, { new: true, upsert: true, setDefaultsOnInsert: true })
                    }
                }

            }

            const paymentData = await Payment.findOneAndUpdate({ orderId, userId }, { $set: paymentUpdateBody }, { new: true });
            if (!paymentData) throw { status: 422, message: "Unable to update payment.Try again" }

            Logger.info('Upgrade plan rzp payment confirmed successfully')
            res.status(200).send({ status: 1, message: "Payment confirmed successfully!", data: paymentData })
        }
        catch (error) {
            next(error)
        }
    }

    static async storeRzpPayment(req, res, next) {
        try {

            let {
                orderId,
                rzpSignature,
                transactionStatus,
                paymentId,
                invoiceNumber,
                courseIds
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                orderId,
                rzpSignature,
                transactionStatus,
                paymentId,
                courseIds
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let currentDate = getCurrentDateAndTime();
            const userId = req.user._id;

            if (req.user.subscriptionStatus !== 0) throw { status: 403, message: "Your account is already having an active plan." }
            if (transactionStatus !== 1 && transactionStatus !== 2 && transactionStatus !== 3) throw { status: 400, message: "Please provide a valid transaction status." }

            courseIds = [...new Set(courseIds)];
            if (!courseIds.length) throw { status: 400, message: "Please provide atleast once courseId." }

            //Validating Given order and UserId is valid or not
            const checkPayment = await Payment.findOne({ orderId, userId }).populate([{ path: 'planId', select: 'maxCourse validityInDays' }]);
            if (!checkPayment) throw { status: 404, message: "Please provide a valid orderId." }
            if (checkPayment && checkPayment.paymentStatus != 0) throw { status: 400, message: "This payment is already completed." }
            if (courseIds.length !== checkPayment.planId.maxCourse) throw { status: 400, message: `Please select ${planData.maxCourse} courses as per the plan.` }

            // Fetching data from razorpay integrations
            const rzpData = await razorpay.orders.fetch(orderId);

            //Preparing Updating Body
            let paymentUpdateBody = {
                paymentStatus: transactionStatus,
                rzpSignature,
                paymentId,
                paymentData: rzpData,
                updatedAt: currentDate
            };

            if (transactionStatus == 1) {

                if (checkPayment.invoiceNumber) invoiceNumber = checkPayment.invoiceNumber;
                else if (!checkPayment.invoiceNumber) {
                    //Calculating Current Invoice Number
                    let invoiceCode = 'LM';
                    invoiceNumber = `${invoiceCode}${Math.floor(Date.now() / 1000)}`;
                }
                if (!invoiceNumber) throw { status: 422, message: "InvoiceNumber not generated.Try again" }
                //Updating Invoice numbers for payments
                paymentUpdateBody.invoiceNumber = invoiceNumber;

                //Subscription Duration generation
                const { validityInDays, maxCourse } = checkPayment.planId;
                let planStartsAt = currentDate;
                let planExpiresAt = moment(addDaysToDate(parseInt(validityInDays))).format('YYYY-MM-DD')
                planExpiresAt = `${planExpiresAt}T23:59:00.000Z`;

                paymentUpdateBody.planStartsAt = planStartsAt, paymentUpdateBody.planExpiresAt = planExpiresAt;
                let userUpdateBody = { updatedAt: getCurrentDateAndTime(), paymentId: checkPayment._id, planStartsAt, planExpiresAt, subscriptionStatus: 1 };

                if (checkPayment.planId.maxCourse) userUpdateBody.maxCourse = maxCourse;
                await User.findOneAndUpdate({ _id: userId }, { $set: userUpdateBody }, { new: true })
                // await UserCourse.updateMany({ userId }, { $set: { isDeleted: true, updatedAt: currentDate } }, { multi: true });
                for (let x of courseIds) {
                    let courseData = await Course.findOne({ _id: x, isDeleted: false });
                    if (courseData) {
                        await UserCourse.findOneAndUpdate({ courseId: x, userId }, {
                            courseId: x, userId,
                            enrolledOn: 1,
                            isDeleted: false,
                            createdAt: currentDate,
                            updatedAt: currentDate
                        }, { new: true, upsert: true, setDefaultsOnInsert: true })
                    }
                }

            }

            const paymentData = await Payment.findOneAndUpdate({ orderId, userId }, { $set: paymentUpdateBody }, { new: true });
            if (!paymentData) throw { status: 422, message: "Unable to update payment.Try again" }

            Logger.info('Rzp payment confirmed successfully')
            res.status(200).send({ status: 1, message: "Payment confirmed successfully!", data: paymentData })
        }
        catch (error) {
            next(error)
        }
    }

    //Upgrade_Plans
    static async getUpgradePlansList(req, res, next) {
        try {
            let {
                id,
                limit,
                skip,
                page

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const userId = req.userId;
            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            const { latestPlanId, latestPlanPrice, planExpiresAt } = req;
            const dbQuery = { isDeleted: false, price: { $gt: latestPlanPrice }, _id: { $nin: [String(latestPlanId)] } };
            if (id) dbQuery._id = id;
            if (latestPlanPrice > 0) dbQuery.upgradePlan = true;

            const data = await Plans.find(dbQuery).limit(limit).skip(skip);
            const totalDataCount = await Plans.find(dbQuery).countDocuments();

            Logger.info('Upgrade plans list fetched successfully')
            res.status(200).send({ status: 1, message: "Upgrade plans list fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async assignPlanToUsers(req, res, next) {
        try {

            let {
                planId,
                userId,
                courseIds,
                currentDate,
                discount

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                userId,
                courseIds,
                planId,
                courseIds,
                discount
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const user = await User.findOne({ _id: userId, isDeleted: false });
            if (!user) throw { status: 404, message: "No user found" }

            if (user.subscriptionStatus !== 0) throw { status: 403, message: "Your account is already having an active plan." }
            currentDate = getCurrentDateAndTime();

            const planData = await Plans.findOne({ isDeleted: false, _id: planId });
            if (!planData) throw { status: 404, message: "No plan found." }
            if (planData && planData.status == 0) throw { status: 404, message: "The requested plan is currently inactive." }

            courseIds = [...new Set(courseIds)];
            if (courseIds.length > planData.maxCourse) throw { status: 400, message: `Please select ${planData.maxCourse} courses as per the plan.` }

            const basePrice = planData.price;
            const gstPercent = planData.gstPercent;
            const gstPrice = (basePrice * (gstPercent / 100));
            const totalPrice = (basePrice + gstPrice) - discount;

            const planStartsAt = currentDate;
            const planExpiresAt = moment(addDaysToDate(parseInt(planData.validityInDays))).format('YYYY-MM-DD')
            const paymentData = await Payment.create({
                isSelfPurchased: false,
                purchaseType: 2,
                createdAt: currentDate, updatedAt: currentDate,
                userId, planId,
                totalPrice: totalPrice,
                basePrice, gstPercent, gstPrice, discount: (discount >= 0) ? discount : 0,
                orderId: `order_${Date.now()}`,
                paymentId: `pay_${Date.now()}`,
                rzpSignature: `sign_${Date.now()}`,
                paymentData: {},
                paymentType: "razorpay",
                paymentStatus: 1,
                planStartsAt, planExpiresAt,
                invoiceNumber: `LM${Math.floor(Date.now() / 1000)}`
            });
            if (!paymentData) throw { status: 422, message: "Unable to assign plan. Try again" }

            //Updating Users
            await User.findOneAndUpdate({ _id: userId }, {
                $set:
                    { updatedAt: currentDate, paymentId: paymentData._id, planStartsAt, planExpiresAt, subscriptionStatus: 1, maxCourse: planData.maxCourse }
            },
                { new: true })

            //Assigning Courses for users
            for (let x of courseIds) {
                let courseData = await Course.findOne({ _id: x, isDeleted: false });
                if (courseData) {
                    await UserCourse.findOneAndUpdate({ courseId: x, userId }, {
                        courseId: x, userId,
                        enrolledOn: 1,
                        isDeleted: false,
                        createdAt: currentDate,
                        updatedAt: currentDate
                    }, { new: true, upsert: true, setDefaultsOnInsert: true })
                }
            }

            Logger.info('Plan assigned successfully')
            res.status(200).send({ status: 1, message: "Plan assigned successfully", data: paymentData })
        }
        catch (error) {
            next(error)
        }
    }

    static async upgradeUsersPlan(req, res, next) {

        try {

            let {
                userId,
                planId,
                courseIds,
                discount

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                userId,
                planId,
                courseIds,
                discount
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const currentDate = getCurrentDateAndTime();
            const user = await User.findOne({ _id: userId, isDeleted: false });
            if (!user) throw { status: 404, message: "No user found" }

            const { latestPlanId, latestPlanPrice, planExpiresAt } = await AppUtils.getLatestPlanDetails(userId);

            const planData = await Plans.findOne({ isDeleted: false, _id: planId });
            if (!planData) throw { status: 404, message: "No plan found." }
            if (planData && planData.status == 0) throw { status: 404, message: "The requested plan is currently inactive." }

            //Validating latest plan and upgrade Plan
            if (latestPlanId.toString() == planId.toString()) throw { status: 400, message: "This plan is already in use. Please provide upgrade plan id." }
            courseIds = [...new Set(courseIds)];
            if (courseIds.length > planData.maxCourse) throw { status: 400, message: `Please select ${planData.maxCourse} courses as per the plan.` }

            const basePrice = planData.price;
            const gstPercent = planData.gstPercent;
            const gstPrice = (basePrice * (gstPercent / 100));
            let totalPrice = (basePrice + gstPrice) - discount - latestPlanPrice - (latestPlanPrice * (gstPercent / 100));
            totalPrice = parseFloat(totalPrice.toFixed(2));

            const paymentData = await Payment.create({
                isSelfPurchased: false,
                purchaseType: 2,
                createdAt: currentDate,
                updatedAt: currentDate,
                userId, planId,
                totalPrice: totalPrice,
                basePrice, gstPercent, gstPrice, discount: (discount >= 0) ? discount : 0,
                orderId: `order_${Date.now()}`,
                paymentId: `pay_${Date.now()}`,
                rzpSignature: `sign_${Date.now()}`,
                paymentData: {},
                paymentType: "razorpay",
                paymentStatus: 1,
                invoiceNumber: `LM${Math.floor(Date.now() / 1000)}`,
                planStartsAt: currentDate,
                planExpiresAt

            });
            if (!paymentData) throw { status: 422, message: "Unable to create payment. Try again" }

            //Updating user
            await User.findOneAndUpdate({ _id: userId }, {
                $set:
                    { updatedAt: getCurrentDateAndTime(), paymentId: paymentData._id, planStartsAt: currentDate, planExpiresAt, subscriptionStatus: 1, maxCourse: planData.maxCourse }
            }, { new: true })

            //Updating User Courses
            for (let x of courseIds) {
                let courseData = await Course.findOne({ _id: x, isDeleted: false });
                if (courseData) {
                    await UserCourse.findOneAndUpdate({ courseId: x, userId }, {
                        courseId: x, userId,
                        enrolledOn: 1,
                        isDeleted: false,
                        createdAt: currentDate,
                        updatedAt: currentDate
                    }, { new: true, upsert: true, setDefaultsOnInsert: true })
                }
            }

            Logger.info('Plan upgraded successfully')
            res.status(200).send({ status: 1, message: "Plan upgraded successfully!", data: paymentData })
        }
        catch (error) {
            next(error)
        }
    };
}

export default PaymentsController;