import { getLoggerWithLabel } from '../../utils/logger/logger.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
const Logger = getLoggerWithLabel('Admin_Controller');

import {
    Admin, CurrentAffairs, UserCurrentAffairLogs, QuizCategory, QuizContent, Plans, Faq, User, Payment, JobAlert,
    Ticket, UserActivityLogs, UserSeriesTestLogs, UserCourse
} from '../models/index.js';
import AuthMiddleware from '../../middlewares/authMiddleware.js';
import AppUtils from '../../utils/appUtils.js';
import { getCurrentDateAndTime, isValidMonthName } from '../../helpers/dates.js';
import {sendnoticationsinbulk} from '../../helpers/notification.js';

class AdminController {

    static generateNewAccessToken(req, res, next) {
        try {
            const { accessToken, refreshToken } = AuthMiddleware.issueAuthTokens(
                req.userId,
            );
            Logger.info('New tokens granted successfully!');
            res
                .status(200)
                .send({
                    status: 1,
                    message: 'New tokens granted successfully!',
                    data: { accessToken, refreshToken },
                });
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            let {
                email,
                password,
                
            } = Object.assign(req.body, req.query, req.params)

            const requiredFields = {
                email,
                password
            }
            const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
            if (requestDataValid !== true) throw { status: 400, message: requestDataValid }
            const currentDateAndTime = getCurrentDateAndTime();
            let data = await Admin.findOne({ email });
            data = JSON.parse(JSON.stringify(data));
            if (!data) throw { status: 404, message: "No account found!" }
            const isPasswordMatch = bcrypt.compareSync(password, data.password);
            if (!isPasswordMatch) throw { status: 401, message: "Incorrect password!" }

            const { accessToken, refreshToken } = AuthMiddleware.issueAuthTokens(data._id);
            await Admin.findOneAndUpdate({ _id: data._id }, { $set: { lastLoginDateTime: currentDateAndTime } }, { new: true })
            delete data.password;
            data.accessToken = accessToken;
            data.refreshToken = refreshToken;
            Logger.info('Admin login success');

            res.status(200).send({ status: 1, message: "Logged in successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async addCurrentAffairs(req, res, next) {
        try {
            let {
                monthName,
                questions,
                date

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                monthName,
                questions,
                date
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            const currentDate = getCurrentDateAndTime();
            isValidMonthName(monthName);

            const data = await CurrentAffairs.create({
                monthName,
                questions,
                year: new Date(date).getFullYear(),
                date,
                createdAt: currentDate,
                updatedAt: currentDate
            });

        
            if (data) {
                await sendnoticationsinbulk(data);
            }
            if (!data) throw { status: 422, message: "Unable to add current affairs. Try again" }
            Logger.info('Current Affairs added successfully')
            // await sendBulkNotificationsToUsers();
            res.status(201).send({ status: 1, message: "Current affairs added successfully", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async editCurrentAffairs(req, res, next) {
        try {
            let {
                monthName,
                year,
                questions,
                date,
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await CurrentAffairs.findOne({ _id: id });
            if (!data) throw { status: 404, message: "No data found!" }

            let updateBody = { updatedAt: getCurrentDateAndTime() };
            if (monthName) isValidMonthName(monthName), updateBody.monthName = monthName;
            if (questions) updateBody.questions = questions;
            if (date) updateBody.date = date, updateBody.year = new Date(date).getFullYear();

            data = await CurrentAffairs.findOneAndUpdate({ _id: id }, {
                $set: updateBody
            }, { new: true });
            Logger.info('Current Affairs updates successfully')
            res.status(200).send({ status: 1, message: "Current affairs updates successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async deleteCurrentAffairs(req, res, next) {
        try {

            let {
                id
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            await CurrentAffairs.findOneAndDelete({ _id: id });
            await UserCurrentAffairLogs.deleteMany({ currentAffairsId: id });

            Logger.info('Current Affairs deleted successfully')
            res.status(200).send({ status: 1, message: "Current affairs deleted successfully!", data: {} })
        }
        catch (e) {
            next(e)
        }
    }

    static async fetchCurrentAffairsByAdmin(req, res, next) {
        try {

            let {
                monthName,
                year,
                id
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                year
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let dbQuery = {};
            if (id) dbQuery._id = id;
            if (year) dbQuery.year = year;
            if (monthName) isValidMonthName(monthName), dbQuery.monthName = monthName;
            let data = await CurrentAffairs.find(dbQuery).sort({ date: -1 })

            if (!id && data.length) {
                if (monthName) data = [{ monthName: monthName.toLowerCase(), currentAffairsData: data }]
                else if (!monthName) {
                    const groupedData = {};
                    data.forEach((item) => {
                        const monthName = item.monthName;
                        if (!groupedData[monthName]) {
                            groupedData[monthName] = { monthName, currentAffairsData: [] };
                        }
                        groupedData[monthName].currentAffairsData.push(item);
                    });
                    data = Object.values(groupedData);
                }
            }
            res.status(200).send({ status: 1, message: "Current affairs fetched successfully!", data })
        }
        catch (e) {
            next(e)
        }
    }

    static async fetchCurrentAffairsByUser(req, res, next) {
        try {

            let {
                monthName,
                year
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                year
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let userId = req.user._id;

            const monthsOrder = {
                'january': 1,
                'february': 2,
                'march': 3,
                'april': 4,
                'may': 5,
                'june': 6,
                'july': 7,
                'august': 8,
                'september': 9,
                'october': 10,
                'november': 11,
                'december': 12
            };

            let aggregateQuery = [];

            //Optional_Saging
            if (year && !monthName) {
                aggregateQuery.push({
                    $match: {
                        year: +year
                    },
                },)
            }
            else if (year && monthName) {
                aggregateQuery.push({
                    $match: {
                        year: +year,
                        monthName: monthName,
                    },
                },)
            }

            //Mandatory_Stage
            aggregateQuery.push(
                {
                    $lookup: {
                        from: 'usercurrentaffairlogs', // The name of the user logs collection
                        localField: '_id',
                        foreignField: 'currentAffairsId',
                        as: 'userLogs',
                    },
                },
                {
                    $addFields: {
                        isRead: {
                            $in: [new mongoose.Types.ObjectId(userId), '$userLogs.userId'],
                        },
                        customMonthOrder: {
                            $arrayElemAt: [Object.values(monthsOrder), { $indexOfArray: [Object.keys(monthsOrder), '$monthName'] }]
                        }
                    },
                },
                {
                    $sort: {
                        date: -1

                    }
                },
                {
                    $project: {
                        userLogs: 0,
                    },
                })

            let data = await CurrentAffairs.aggregate(aggregateQuery);
            data = JSON.parse(JSON.stringify(data));
            if (data.length) {
                const groupedData = {};
                data.forEach((item) => {
                    const monthName = item.monthName;
                    if (!groupedData[monthName]) {
                        groupedData[monthName] = { monthName, currentAffairsData: [] };
                    }
                    groupedData[monthName].currentAffairsData.push(item);
                });
                data = Object.values(groupedData);
            }
            res.status(200).send({ status: 1, message: "Current affairs fetched successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }


    static async saveCurrentAffairLog(req, res, next) {
        try {

            let {
                currentAffairsId,
                responses
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                currentAffairsId,
                responses
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            if (!responses.length) throw { statusCode: 500, msg: "No response found" }

            const currentAffairsData = await CurrentAffairs.findOne({ _id: currentAffairsId });
            if (!currentAffairsData) throw { status: 404, message: "No current affairs found!" }

            const data = await UserCurrentAffairLogs.create({
                currentAffairsId,
                responses,
                userId: req.user._id,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            })
            if (!data) throw { status: 422, message: "Current affairs saving failed. Try again" }

            Logger.info('Current Affairs Log Saved Successfully')
            res.status(200).send({ status: 200, message: "Current affairs logs saved successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getTopCurrentAffairs(req, res, next) {
        try {
            let userId = req.user._id;
            let currentAffairsData = await CurrentAffairs.find({}).sort({ createdAt: -1 }).limit(5).lean();
            currentAffairsData = JSON.parse(JSON.stringify(currentAffairsData))
            if (currentAffairsData.length) {
                for (let x of currentAffairsData) {
                    let userCurrentAffairsData = await UserCurrentAffairLogs.findOne({ currentAffairsId: x._id, userId }).lean();
                    if (userCurrentAffairsData) x.isRead = true;
                    else x.isRead = false;
                }
            }
            Logger.info('Top Current Affairs Fetched Successfully')
            res.status(200).send({ status: 1, message: 'Top current affairs fetched successfully!', dataCount: currentAffairsData.length, data: currentAffairsData })
        }
        catch (error) {
            next(error)
        }
    }

    /*************************Quiz Api's***********************************/
    static async addQuizCategory(req, res, next) {
        try {

            let {
                name,
                icon,
                type

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                name,
                icon,
                type
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            if (type !== "content" && type !== "mcq") throw { status: 400, message: "Please provide a valid type" }

            let data = await QuizCategory.create({
                name: AppUtils.capitalizeEveryStartingWord(name),
                icon,
                type,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw {
                status: 422, message: "Unable to store quiz category.Try again"
            }

            Logger.info('Quiz category added successfully')
            res.status(201).send({ status: 1, message: "Quiz category added successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getQuizCategoriesList(req, res, next) {
        try {
            let {
                id,
                name,
                type,
                icon,
                limit,
                skip,
                page

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            let dbQuery = {};
            if (id) dbQuery._id = id;
            if (name) dbQuery.name = name;
            if (type) dbQuery.type = type;

            let data = await QuizCategory.find(dbQuery).limit(limit).skip(skip);
            let totalDataCount = await QuizCategory.find(dbQuery).countDocuments();

            Logger.info('Quiz categories list fetched successfully')
            res.status(200).send({ status: 1, message: "Quiz categories list fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }


    static async editQuizCategory(req, res, next) {
        try {
            let {
                id,
                name,
                icon,
                type

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            if (type && type !== "content" && type !== "mcq") throw { status: 400, message: "Please provide a valid type" }


            let data = await QuizCategory.findOne({ _id: id });
            if (!data) throw { status: 404, message: "No Quiz Category found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (name) dbQuery.name = AppUtils.capitalizeEveryStartingWord(name);
            if (icon) dbQuery.icon = icon;
            if (type) dbQuery.type = type;

            data = await QuizCategory.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });

            Logger.info('Quiz Category updated successfully')
            res.status(200).send({ status: 1, message: "Quiz category edited successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async deleteQuizCategory(req, res, next) {
        try {

            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            await QuizCategory.findOneAndDelete({ _id: id });

            Logger.info('Quiz Category deleted successfully')
            res.status(200).send({ status: 1, message: "Quiz category deleted successfully!", data: {} })

        }
        catch (error) {
            next(error)
        }
    }

    /*--------------------------------------QUIZ CONTENT APIS-------------------------*/
    static async addQuizContent(req, res, next) {
        try {

            let {
                content,
                quizCategoryId,
                date,
                questions
            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                quizCategoryId,
                date
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let categoryData = await QuizCategory.findOne({ _id: quizCategoryId });
            if (!categoryData) throw { status: 404, message: "No quiz category found!" }
            if (categoryData.type == "mcq" && (!questions || !questions.length)) throw { status: 400, message: "Questions cannot be empty" }
            if (categoryData.type == "content" && !content) throw { status: 400, message: "Please provide content" }

            let data = await QuizContent.findOne({ quizCategoryId, date });
            if (data) throw { status: 409, message: "Quiz Content is already added for this date on this Quiz category . Try another!" }

            let dbQuery = {
                quizCategoryId,
                date,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            }
            if (categoryData.type == "content") dbQuery.content = content;
            else if (categoryData.type == "mcq") dbQuery.questions = questions
            data = await QuizContent.create(dbQuery);
            if (!data) throw { sttaus: 422, mesage: "Unable to store quiz content.Try again" }
            res.status(201).send({ status: 1, message: "Quiz content added successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getQuizContentList(req, res, next) {
        try {
            let {
                id,
                date,
                quizCategoryId,
                fromDate, toDate,
                limit,
                skip,
                page

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {

            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            let dbQuery = {};
            if (id) dbQuery._id = id;
            if (quizCategoryId) dbQuery.quizCategoryId = quizCategoryId;
            if (fromDate && toDate) dbQuery.date = {
                $gte: `${fromDate}T00:00:00.000Z`,
                $lte: `${toDate}T23:59:59.000Z`
            }
            let data = await QuizContent.find(dbQuery).populate([{ path: 'quizCategoryId', select: 'name icon' }]).limit(limit).skip(skip).sort({ date: -1 });
            let totalDataCount = await QuizContent.find(dbQuery).countDocuments();

            res.status(200).send({ status: 1, message: "Quiz content list fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }


    static async editQuizContent(req, res, next) {
        try {
            let {
                id,
                quizCategoryId,
                content,
                date,
                questions

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id,
                quizCategoryId,
                date
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await QuizContent.findOne({ _id: id });
            if (!data) throw { status: 404, message: "No quiz content found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            let dbUpdate = {};
            if (date && quizCategoryId) {
                let categoryData = await QuizCategory.findOne({ _id: quizCategoryId });
                if (!categoryData) throw { status: 404, message: "No quiz category found!" }
                if (categoryData.type == "mcq" && (!questions || !questions.length)) throw { status: 400, message: "Please provide questions" }
                else if (categoryData.type == "mcq") dbQuery.questions = questions, dbUpdate.content = 1;
                if (categoryData.type == "content" && !content) throw { status: 400, message: "Please provide content" }
                else if (categoryData.type == "content") dbQuery.content = content, dbUpdate.questions = 1;
                let contentData = await QuizContent.findOne({ quizCategoryId, date });
                if (contentData && contentData._id.toString() != id.toString()) throw { status: 409, message: "Quiz content is already for same date and category. Try another" }
                dbQuery.date = date;
                dbQuery.quizCategoryId = quizCategoryId;
            }
            data = await QuizContent.findOneAndUpdate({ _id: id }, { $set: dbQuery, $unset: dbUpdate }, { new: true });
            res.status(200).send({ status: 1, message: "Quiz content edited successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async deleteQuizContent(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await QuizContent.findOneAndDelete({ _id: id });
            res.status(200).send({ status: 1, message: "Quiz content deleted successfully!", data: {} })

        }
        catch (error) {
            next(error)
        }
    }

    /************************Plan Api's***********************************/
    static async addPlan(req, res, next) {
        try {

            let {
                name,
                gstPercent,
                validityInDays,
                upgradePlan,
                price,
                description,
                status,
                applePlanId,
                maxCourse

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                name,
                gstPercent,
                validityInDays,
                upgradePlan,
                price,
                description,
                status,
                maxCourse
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await Plans.create({
                name: AppUtils.capitalizeEveryStartingWord(name),
                gstPercent,
                validityInDays,
                upgradePlan,
                price,
                description,
                status,
                applePlanId,
                maxCourse,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw {
                status: 422, message: "Unable to store plan.Try again"
            }

            Logger.info('Plans added successfully')
            res.status(201).send({ status: 1, message: "Plans added successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async editPlan(req, res, next) {
        try {
            let {
                id,
                name,
                gstPercent,
                validityInDays,
                upgradePlan,
                price,
                description,
                status,
                applePlanId,
                maxCourse

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);


            let data = await Plans.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No Quiz Category found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (name) dbQuery.name = AppUtils.capitalizeEveryStartingWord(name);
            if (gstPercent) dbQuery.gstPercent = gstPercent;
            if (upgradePlan) dbQuery.upgradePlan = upgradePlan;
            if (price) dbQuery.price = price;
            if (description) dbQuery.description = description;
            if (status) dbQuery.status = status;
            if (applePlanId) dbQuery.applePlanId = applePlanId;
            if (maxCourse) dbQuery.maxCourse = maxCourse;
            if (validityInDays) dbQuery.validityInDays = validityInDays;

            data = await Plans.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });

            Logger.info('Plans updated successfully')
            res.status(200).send({ status: 1, message: "Plans edited successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async deletePlan(req, res, next) {
        try {

            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const data = await Plans.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true, updatedAt: getCurrentDateAndTime() } });
            if (!data) throw { status: 404, message: "No plan found" }
            Logger.info('Plan deleted successfully')
            res.status(200).send({ status: 1, message: "Plan deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }
    /********************FAQ API'S********************/
    static async createFaq(req, res, next) {
        try {
            let {
                question, answer, status
            } = Object.assign(req.body)

            const requiredFields = {
                question, answer, status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, '1234')
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await Faq.create({
                question, answer, status,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            })
            Logger.info('Faq created successfully')
            res.status(200).send({ status: 1, message: "Faq created successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchFaqs(req, res, next) {
        try {
            let {
                question, answer, id, status,
                limit, page, skip
            } = Object.assign(req.query)

            //Paginations
            limit = limit ? parseInt(limit) : 50;
            page = page ? parseInt(page) : 1;
            skip = parseInt(limit) * parseInt(page - 1);

            let dbQuery = {};
            if (question) dbQuery.question = question;
            if (answer) dbQuery.answer = answer;
            if (id) dbQuery._id = id;
            if (status == 0 || status == 1) dbQuery.status = status;

            let data = await Faq.find(dbQuery).sort({ createdAt: 1 }).limit(limit).skip(skip).lean();
            let totalDataCount = await Faq.find(dbQuery).countDocuments();

            Logger.info('Faqs fetched successfully')
            res.status(200).send({ status: 1, message: "Faqs fetched sucecssfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async editFaq(req, res, next) {
        try {

            let {
                question, answer, status, id
            } = Object.assign(req.body)

            const requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, '1234')
            if (requestDataValid !== true) throw Error(requestDataValid);

            let updateBody = { updatedAt: getCurrentDateAndTime() }
            if (question) updateBody.question = question;
            if (answer) updateBody.answer = answer;
            if (status == 0 || status == 1) updateBody.status = status;
            let data = await Faq.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
            if (!data) throw { statusCode: 404, message: "No faq found" }

            Logger.info('Faq updated successfully!')
            res.status(200).send({ status: 1, message: "Faq updated successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async deleteFaq(req, res, next) {
        try {

            let {
                id
            } = Object.assign(req.query)

            const requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, '1234')
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await Faq.findOne({ _id: id })
            if (!data) throw { statusCode: 404, message: "No faq found" }
            data = await Faq.findOneAndDelete({ _id: id })

            Logger.info('Faq deleted successfully')
            res.status(200).send({ status: 1, message: "Faq deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    /*************************LISTING API'S***********************/
    static async fetchPaymentsList(req, res, next) {
        try {
            let {
                planId, userId, id, fromDate, toDate, paymentStatus,
                limit, page, skip
            } = Object.assign(req.query)

            //Paginations
            limit = limit ? parseInt(limit) : 50;
            page = page ? parseInt(page) : 1;
            skip = parseInt(limit) * parseInt(page - 1);

            let dbQuery = {};
            if (planId) dbQuery.planId = planId;
            if (userId) dbQuery.userId = userId;
            if (id) dbQuery._id = id;
            if (paymentStatus == 0 || paymentStatus == 1) dbQuery.paymentStatus = paymentStatus;
            if (fromDate && toDate) dbQuery.createdAt = {
                $gte: `${fromDate}T00:00:00.000Z`,
                $lte: `${toDate}T23:59:59.000Z`
            }
            let data = await Payment.find(dbQuery).populate([
                { path: 'userId' },
                { path: 'planId' }
            ]).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
            let totalDataCount = await Payment.find(dbQuery).countDocuments();

            Logger.info('Payments list fetched successfully')
            res.status(200).send({ status: 1, message: "Payments list fetched sucecssfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }
    static async fetchUsersList(req, res, next) {
        try {
            let {
                id, subscriptionStatus, status, fromDate, toDate,
                limit, page, skip
            } = Object.assign(req.query)

            //Paginations
            limit = limit ? parseInt(limit) : 50;
            page = page ? parseInt(page) : 1;
            skip = parseInt(limit) * parseInt(page - 1);

            let dbQuery = {};
            if (id) dbQuery._id = id;
            if (status == 0 || status == 1) dbQuery.status = status;
            if (subscriptionStatus == 0 || subscriptionStatus == 1) dbQuery.subscriptionStatus = subscriptionStatus;
            if (fromDate && toDate) dbQuery.createdAt = {
                $gte: `${fromDate}T00:00:00.000Z`,
                $lte: `${toDate}T23:59:59.000Z`
            }
            let data = await User.find(dbQuery).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
            let totalDataCount = await User.find(dbQuery).countDocuments();

            Logger.info('Users list fetched successfully')
            res.status(200).send({ status: 1, message: "Users list fetched sucecssfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }


    /********************FAQ API'S********************/
    static async createAlert(req, res, next) {
        try {
            let {
                title, courseId, details, icon
            } = Object.assign(req.body)

            const requiredFields = {
                title, courseId, details, icon
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, '1234')
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await JobAlert.create({
                title, courseId, details, icon,
                createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            })
            Logger.info('Job Alert created successfully')
            res.status(200).send({ status: 1, message: "Job Alert created successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchAlerts(req, res, next) {
        try {
            let {
                courseId, id, status,
                limit, page, skip
            } = Object.assign(req.query)

            //Paginations
            limit = limit ? parseInt(limit) : 50;
            page = page ? parseInt(page) : 1;
            skip = parseInt(limit) * parseInt(page - 1);

            let dbQuery = {};
            if (id) dbQuery._id = id;
            if (courseId) dbQuery.courseId = courseId;
            if (status == 0 || status == 1) dbQuery.status = status;

            let data = await JobAlert.find(dbQuery).populate(
                [
                    { path: 'courseId', select: 'courseName icon type' }
                ]
            ).sort({ createdAt: 1 }).limit(limit).skip(skip).lean();
            let totalDataCount = await JobAlert.find(dbQuery).countDocuments();

            Logger.info('JobAlert fetched successfully')
            res.status(200).send({ status: 1, message: "JobAlerts fetched sucecssfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async editAlerts(req, res, next) {
        try {

            let {
                id, title, courseId, details, icon, status
            } = Object.assign(req.body)

            const requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, '1234')
            if (requestDataValid !== true) throw Error(requestDataValid);

            let updateBody = { updatedAt: getCurrentDateAndTime() }
            if (title) updateBody.title = title;
            if (icon) updateBody.icon = icon;
            if (details) updateBody.details = details;
            if (courseId) updateBody.courseId = courseId;
            if (status == 0 || status == 1) updateBody.status = status;
            let data = await JobAlert.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
            if (!data) throw { statusCode: 404, message: "No alert found" }

            Logger.info('Alert.findOneAndUpdate updated successfully!')
            res.status(200).send({ status: 1, message: "Alert updated successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async deleteAlert(req, res, next) {
        try {

            let {
                id
            } = Object.assign(req.query)

            const requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, '1234')
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await JobAlert.findOne({ _id: id })
            if (!data) throw { statusCode: 404, message: "No faq found" }
            data = await JobAlert.findOneAndDelete({ _id: id })

            Logger.info('Alert deleted successfully')
            res.status(200).send({ status: 1, message: "Alert deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }
    static async fetchTicketsList(req, res, next) {
        try {

            let {
                id,
                userId,
                issueType,
                ticketNumber,
                status,
                limit,
                page, skip

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {

            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            const dbQuery = {};
            if (id) dbQuery._id = id;
            if (status == 0 || status == 1) dbQuery.status = status;
            if (issueType) dbQuery.issueType = issueType;
            if (ticketNumber) dbQuery.ticketNumber = ticketNumber;
            if (userId) dbQuery.userId = userId;


            const data = await Ticket.find(dbQuery).populate([
                { path: 'userId', select: 'name profileImageUrl mobileNo email status subscriptionStatus isMobileVerified' }
            ]).sort({ ticketNumber: -1 }).limit(limit).skip(skip);
            const totalDataCount = await Ticket.find(dbQuery).countDocuments();
            Logger.info('Tickets fetched successfully')
            res.status(200).send({ status: 1, message: "Tickets fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async editTicket(req, res, next) {
        try {

            let {
                id,
                resolution,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id,
                resolution,
                status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            if (status !== 0 && status !== 1) throw { status: 400, message: "Please provide a valid status." }
            const data = await Ticket.findOneAndUpdate({ _id: id },
                {
                    $set: {
                        status,
                        resolution
                    }
                },
                {
                    new: true
                }
            );
            if (!data) throw { status: 404, message: "No ticket found" }
            Logger.info('Ticket updated successfully')
            res.status(200).send({ status: 1, message: "Tickets updated successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchUserActivityLogs(req, res, next) {
        try {

            let {
                id, activity, userId,
                date, limit, page, skip

            } = Object.assign(req.body, req.query, req.params)

            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1);


            let dbQuery = {};
            if (id) dbQuery._id = id;
            if (userId) dbQuery.userId = userId;
            if (activity) dbQuery.activity = activity.trim();
            if (date) {
                dbQuery.createdAt = {
                    $gte: `${date}T00:00:00.000Z`,
                    $lte: `${date}T23:59:59.000Z`
                }
            }

            let paginatedData = await UserActivityLogs.find(dbQuery).populate([{ path: "userId" }])
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });
            let totalDataCount = await UserActivityLogs.find(dbQuery).countDocuments();
            let totalHourlyData = [];
            if (date) {
                let totalData = await UserActivityLogs.find(dbQuery);
                totalHourlyData = AppUtils.generateHourlyData(totalData);
            }

            res.status(200).send({ status: 1, message: "User activities fetched successfully!", totalDataCount, currentPageCount: paginatedData.length, data: paginatedData, totalHourlyData })

        }
        catch (error) {
            next(error)
        }
    }

    static async getUserEnrolledCourses(req, res, next) {
        try {

            let {
                courseId,
                subjectId,
                userId

            } = Object.assign(req.query)

            let requiredFields = {
                userId
            }

            const userDetails = await User.findOne({ _id: userId, isDeleted: false });
            if (!userDetails) throw { status: 404, message: "No user found" }

            let aggregateQuery = [];
            let matchFilter = {
                userId: new mongoose.Types.ObjectId(userId), isDeleted: false,
            };
            if (courseId) matchFilter.courseId = new mongoose.Types.ObjectId(courseId);
            matchFilter.enrolledOn = (userDetails.subscriptionStatus == 1) ? 1 : 0;
            aggregateQuery.push(
                {
                    $match: matchFilter
                },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseId',
                        foreignField: '_id',
                        as: 'course',
                    },
                },
                {
                    $unwind: '$course',
                },
                {
                    $lookup: {
                        from: 'coursesubjectcombinations',
                        localField: 'course._id',
                        foreignField: 'courseId',
                        as: 'subjectCombinations',
                    },
                },
                {
                    $unwind: {
                        path: '$subjectCombinations',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: {
                        'subjectCombinations.isDeleted': false
                    }
                },
                {
                    $lookup: {
                        from: 'subjects',
                        localField: 'subjectCombinations.subjectId',
                        foreignField: '_id',
                        as: 'subject',
                    },
                },
                {
                    $unwind: {
                        path: '$subject',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: {
                        'subject.isDeleted': false
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        userEnrolledCourse: { $first: '$_id' },
                        course: { $first: '$course' },
                        subjects: {
                            $addToSet: {
                                $cond: {
                                    if: { $eq: ['$subject', null] },
                                    then: '$$REMOVE',
                                    else: {
                                        _id: '$subject._id',
                                        subjectName: '$subject.subjectName',
                                        icon: '$subject.icon',
                                        created_at: '$subject.created_at',
                                        updated_at: '$subject.updated_at',
                                        status: '$subject.status',
                                        isDeleted: '$subject.isDeleted',
                                        courseSubjectCombinationId: '$subjectCombinations._id',
                                        courseId: '$subjectCombinations.courseId',
                                        totalChaptersCount: 0
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        userEnrolledCourse: 1,
                        course: 1,
                        subjects: {
                            $filter: {
                                input: '$subjects',
                                as: 'subject',
                                cond: { $ne: ['$$subject', []] },
                            },
                        },
                    },
                },
                {
                    $unwind: '$subjects',
                },
                {
                    $lookup: {
                        from: 'chapters',
                        let: { combinationId: '$subjects.courseSubjectCombinationId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$combinationId', '$$combinationId'] },
                                    isDeleted: false
                                },
                            },
                            {
                                $count: 'totalChaptersCount'
                            }
                        ],
                        as: 'chapterCount',
                    },
                },
                {
                    $addFields: {
                        'subjects.totalChaptersCount': { $ifNull: [{ $arrayElemAt: ['$chapterCount.totalChaptersCount', 0] }, 0] } // Add totalChaptersCount for each subject
                    }
                },
                {
                    $group: {
                        _id: '$userEnrolledCourse',
                        userEnrolledCourse: { $first: '$userEnrolledCourse' },
                        course: { $first: '$course' },
                        subjects: { $addToSet: '$subjects' },
                    },
                },
                {
                    $sort: { 'course.courseName': 1 }
                }
            )

            let data = await UserCourse.aggregate(aggregateQuery);
            data = JSON.parse(JSON.stringify(data));
            if (data.length) {
                data = data.map((x) => {
                    if (x.subjects && x.subjects.length) {
                        (x.subjects).sort((a, b) => {
                            return a.subjectName.localeCompare(b.subjectName);
                        });
                        return x;
                    }
                })
            }
            Logger.info('User courses fetched successfully')
            res.status(200).send({ status: 1, message: "User courses fetched successfully!", totalDataCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchUserSeriesTestLogs(req, res, next) {
        try {
            let {
                userId,
                seriesTestId,
                courseId,
                subjectId,
                combinationId,
                limit, page, skip

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                userId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);


            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            let dbQuery = { userId }
            if (seriesTestId) dbQuery.seriesTestId = seriesTestId;
            if (combinationId) dbQuery.combinationId = combinationId;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (courseId) dbQuery.courseId = courseId;

            const data = await UserSeriesTestLogs.find(dbQuery).populate([
                { path: 'seriesId', select: 'seriesNumber seriesName seriesId combinationId' },
                { path: 'subjectId', select: 'subjectName icon' },
                { path: 'courseId', select: 'courseName icon type' }
            ]).limit(limit).skip(skip).sort({ percentage: -1 });
            const totalDataCount = await UserSeriesTestLogs.find(dbQuery).countDocuments();
            Logger.info('User series test logs fetched successfully')
            res.status(200).send({ status: 1, message: " User series Test logs successfully!", totalDataCount, currentPagecount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }
}

export default AdminController;