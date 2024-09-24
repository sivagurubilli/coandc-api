import { getLoggerWithLabel } from '../../utils/logger/logger.js';
const Logger = getLoggerWithLabel('Series_Controller');
import AppUtils from '../../utils/appUtils.js';
import {
    Series, SeriesTest, CourseSubjectCombination, UserSeriesTestTracker, UserSeriesTestLogs
} from '../models/index.js';
import { getCurrentDateAndTime, getCurrentDate, addDaysToDate } from '../../helpers/dates.js';
import mongoose from 'mongoose';
import moment from 'moment';

class SeriesController {

    static async addSeries(req, res, next) {
        try {

            let {
                combinationId,
                seriesName,
                seriesNumber,
                status

            } = Object.assign(req.body)

            let requiredFields = {
                combinationId,
                seriesName,
                seriesNumber,
                status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let combinationData = await CourseSubjectCombination.findOne({ _id: combinationId, isDeleted: false });
            if (!combinationData) throw { status: 404, message: "No combination found!" }

            let seriesData = await Series.findOne({ seriesNumber, combinationId, isDeleted: false });
            if (seriesData) throw { status: 409, message: "Series number is already added for this combination. Try another!" }

            seriesData = await Series.create({
                seriesName: AppUtils.capitalizeEveryStartingWord(seriesName),
                seriesNumber,
                subjectId: combinationData.subjectId,
                courseId: combinationData.courseId,
                combinationId,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime(),
                status
            });
            if (!seriesData) throw Error("Unable to store series.Try again")

            Logger.info('Series added successfully')
            res.status(201).send({ status: 1, message: "Series added successfully!", data: seriesData })
        }
        catch (error) {
            next(error)
        }
    }

    static async getSeriesList(req, res, next) {
        try {
            let {
                id,
                combinationId,
                seriesName,
                seriesNumber,
                courseId,
                subjectId,
                status,
                limit,
                skip,
                page

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                combinationId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            let dbQuery = { isDeleted: false };
            if (id) dbQuery._id = id;
            if (status) dbQuery.status = status;
            if (seriesName) dbQuery.seriesName = seriesName;
            if (courseId) dbQuery.courseId = courseId;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (seriesNumber) dbQuery.seriesNumber = seriesNumber;
            if (combinationId) dbQuery.combinationId = combinationId;

            let data = await Series.find(dbQuery).populate([{ path: 'subjectId', select: 'subjectName icon' }, { path: 'courseId', select: 'courseName type icon' }]).limit(limit).skip(skip).sort({ seriesNumber: 1 });
            let totalDataCount = await Series.find(dbQuery).countDocuments();

            Logger.info('Series list fetched successfully!')
            res.status(200).send({ status: 1, message: "Series list fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }


    static async editSeries(req, res, next) {
        try {
            let {
                id,
                combinationId,
                seriesNumber,
                seriesName,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await Series.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No chapter found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status) dbQuery.status = status;
            if (seriesName) dbQuery.seriesName = AppUtils.capitalizeEveryStartingWord(seriesName);
            if (combinationId) {
                let combinationData = await CourseSubjectCombination.findOne({ _id: combinationId, isDeleted: false });
                if (!combinationData) throw { status: 404, message: "No combination found!" }
                dbQuery.combinationId = combinationId;
                dbQuery.courseId = combinationData.courseId;
                dbQuery.subjectId = combinationData.subjectId;
            }
            if (seriesNumber) {
                let seriesData = await Series.findOne({ seriesNumber, combinationId, isDeleted: false });
                if (seriesData && (seriesData._id).toString() !== id.toString()) throw { status: 409, message: "Series number is already for this combinationId. Try another!" }
                dbQuery.seriesNumber = seriesNumber;
            }
            data = await Series.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });

            Logger.info('Series updated successfully')
            res.status(200).send({ status: 1, message: "Series edited successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async deleteSeries(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await Series.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true, updatedAt: getCurrentDateAndTime() } }, { new: true });
            if (!data) throw { status: 404, message: "No series found!" }

            Logger.info('Series deleted successfully')
            res.status(200).send({ status: 1, message: "Series deleted successfully!", data: {} })

        }
        catch (error) {
            next(error)
        }
    }


    //*-------------------Series_test_APIS-----------------------------------------------------*/
    static async addSeriesTest(req, res, next) {
        try {

            let {
                questions,
                seriesId

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                questions,
                seriesId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let seriesData = await Series.findOne({ _id: seriesId, isDeleted: false });
            if (!seriesData) throw { status: 404, message: "No series found!" }

            let data = await SeriesTest.findOne({ seriesId, isDeleted: false });
            if (data) throw { status: 409, message: "Questions are already added for this series. Try for another series" }

            if (!questions.length) throw Error("Questions can not be empty.")

            data = await SeriesTest.create({
                seriesId,
                questions,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw { message: "Unable to add series test. Try again" }

            Logger.info('Series test added successfully')
            res.status(201).send({ status: 1, message: "Series test added sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getSeriesTests(req, res, next) {
        try {
            let {
                id,
                seriesId,
                status,
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

            let dbQuery = { isDeleted: false };
            if (id) dbQuery._id = id;
            if (status) dbQuery.status = status;
            if (seriesId) dbQuery.seriesId = seriesId;

            let data = await SeriesTest.find(dbQuery).limit(limit).skip(skip).sort({ _id: -1 });
            let totalDataCount = await SeriesTest.find(dbQuery).countDocuments();

            Logger.info('Series test fetched successfully')
            res.status(200).send({ status: 1, message: "Series tests fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }


    static async editSeriesTest(req, res, next) {
        try {
            let {
                id,
                seriesId, questions

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await SeriesTest.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No series test found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (seriesId) {
                let seriesData = await Series.findOne({ _id: seriesId, isDeleted: false });
                if (!seriesData) throw { status: 404, message: "No series found!" }

                let seriesTestData = await SeriesTest.findOne({ seriesId, isDeleted: false });
                if (seriesTestData && (seriesTestData._id).toString() !== id.toString()) throw { status: 409, message: "Questions are already added for this series. Try for another series" }
                dbQuery.seriesId = seriesId

            }
            if (questions) {
                if (!questions.length) throw { status: 400, message: "Questions cannot be empty." }
                dbQuery.questions = questions;
            }
            data = await SeriesTest.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });

            Logger.info('Series test updated successfully')
            res.status(200).send({ status: 1, message: "Series test updated successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async deleteSeriesTest(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);


            let data = await SeriesTest.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true });
            if (!data) throw { status: 404, message: "No series test found!" }

            Logger.info('Series test deleted successfully')
            res.status(200).send({ status: 1, message: "Series test deleted successfully!", data: {} })

        }
        catch (error) {
            next(error)
        }
    }

    static async addSeriesTestQuestions(req, res, next) {
        try {
            let {
                id,
                questions

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id, questions
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await SeriesTest.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No series test found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (questions) {
                if (!questions.length) throw { status: 400, message: "Questions cannot be empty." }
                dbQuery.questions = questions;
            }
            data = await SeriesTest.findOneAndUpdate({ _id: id }, { $push: { questions } }, { new: true });

            Logger.info('Question added successfully')
            res.status(200).send({ status: 1, message: "Questions added successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }


    /*----------------------TEST AND SERIES API'S BY USER----------------------------------*/
    static async getSeriesListbyUser(req, res, next) {
        try {
            let {
                combinationId, id,
                limit, page, skip

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                combinationId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            let combinationData = await CourseSubjectCombination.findOne({ _id: combinationId, isDeleted: false });
            if (!combinationData) throw { status: 404, message: "No combination found!" }

            let dbQuery = { isDeleted: false };
            if (id) dbQuery._id = id;
            if (combinationId) dbQuery.combinationId = combinationId;

            let data = await Series.find(dbQuery).populate([{ path: 'subjectId', select: 'subjectName icon' }, { path: 'courseId', select: 'courseName type icon' }]).limit(limit).skip(skip).sort({ seriesNumber: 1 });
            let totalDataCount = await Series.find(dbQuery).countDocuments();

            data = JSON.parse(JSON.stringify(data));
            if (data.length) {
                for (let series of data) {
                    const ongoingData = await UserSeriesTestTracker.findOne({ userId: req.userId, seriesId: series._id }).select('timeLeftInMinutes').sort({ 'createdAt': -1 });
                    if (ongoingData?.timeLeftInMinutes) series.timeLeftInMinutes = ongoingData.timeLeftInMinutes
                }
            }

            Logger.info('Series list fetched successfully')
            res.status(200).send({ status: 1, message: "Series list fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }

    static async getSeriesTestByUser(req, res, next) {
        try {
            let {
                seriesId

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                seriesId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            const userId = req.userId;

            let data = await SeriesTest.findOne({ seriesId, isDeleted: false }).populate([{ path: 'seriesId', select: 'seriesName seriesNumber combinationId' }]);
            if (!data) throw { status: 404, message: "No assessment found!" }
            data = JSON.parse(JSON.stringify(data));

            const isAlreadyAttempted = await UserSeriesTestLogs.find({ seriesId, userId, seriesTestId: data._id }).countDocuments();
            if (isAlreadyAttempted == 0) {
                const testTrackerData = await UserSeriesTestTracker.findOne({ userId, seriesId }).populate([{ path: 'seriesId', select: 'seriesName seriesNumber combinationId' }]);
                if (testTrackerData) {
                    Logger.info('User fetched test series from existed test')
                    data = testTrackerData;
                    data._id = testTrackerData.seriesTestId;
                    delete data.seriesTestId;
                }
            }
            data.questions = (AppUtils.shuffleArray(data.questions)).slice(0, 40);
            data.isNew = (isAlreadyAttempted > 0) ? true : false;
            Logger.info('Series test fetched successfully')
            res.status(200).send({ status: 1, message: "Series Test fetched successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async exitSeriesTest(req, res, next) {
        try {

            let {
                _id,
                questions,
                seriesId,
                timeLeftInMinutes

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                _id,
                questions,
                seriesId,
                timeLeftInMinutes
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const userId = req.userId;

            const seriesData = await Series.findOne({ _id: seriesId, isDeleted: false });
            if (!seriesData) throw { status: 404, message: "No series found!" }

            const seriesTestData = await SeriesTest.findOne({ _id, isDeleted: false });
            if (!seriesTestData) throw { status: 404, message: "No series test found!" }

            if (!questions.length) throw Error("Questions can not be empty.")

            const data = await UserSeriesTestTracker.findOneAndUpdate({ userId, seriesId }, {
                $set: {
                    seriesTestId: _id,
                    userId,
                    timeLeftInMinutes,
                    seriesId,
                    questions,
                    courseId: seriesData.courseId,
                    subjectId: seriesData.subjectId,
                    createdAt: getCurrentDateAndTime(),
                    updatedAt: getCurrentDateAndTime()
                }
            }, { new: true, upsert: true, setDefaultsOnInsert: true });

            Logger.info('Series test exit successfully')
            res.status(201).send({ status: 1, message: "Series test exit sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async submitSeriesTest(req, res, next) {
        try {
            let {
                totalQuestionsCount,
                seriesTestId,
                responses,
                timeTakenInMinutes

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                totalQuestionsCount,
                seriesTestId,
                responses,
                timeTakenInMinutes
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            let user = req.user;
            if (totalQuestionsCount <= 0) throw { status: 400, message: "Please provide a valid value for questions count" }
            let data = await SeriesTest.findOne({ _id: seriesTestId, isDeleted: false }).populate([{ path: 'seriesId', select: 'seriesName seriesNumber combinationId courseId subjectId' }]);
            if (!data) throw { status: 404, message: "No test found!" }
            if (!responses.length) throw { status: 404, message: "No responses found!" }
            responses = Array.from(new Map(responses.map(obj => [obj.questionId, obj])).values());
            let commonQuestions = (data.questions).filter(question =>
                responses.some(response => (response.questionId).toString() == (question._id).toString()));
            let calculatedData = AppUtils.calculateAssessmentPercentage(commonQuestions, responses, totalQuestionsCount);
            let percentage = calculatedData.percentage > 100 ? 100 : calculatedData.percentage;
            responses = calculatedData.responses;

            let seriesTestLogData = await UserSeriesTestLogs.create({
                courseId: data.seriesId.courseId,
                subjectId: data.seriesId.subjectId,
                userId: req.userId,
                responses,
                seriesTestId,
                seriesId: data.seriesId._id,
                combinationId: data.seriesId.combinationId,
                percentage,
                timeTakenInMinutes,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!seriesTestLogData) throw { status: 422, message: "Unable to submit test. Please try again" }
            seriesTestLogData = JSON.parse(JSON.stringify(seriesTestLogData));
            delete seriesTestLogData.responses;

            await UserSeriesTestTracker.deleteMany({ seriesTestId, userId: req.userId, seriesId: data.seriesId._id })
            res.status(200).send({ status: 1, message: "Series Test fetched successfully!", seriesTestLogData })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchOngoingSeriesTests(req, res, next) {
        try {
            let {
                id,
                seriesId,
                courseId,
                subjectId,
                combinationId

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            let userId = req.userId;

            let dbQuery = { userId };
            if (id) dbQuery.seriesTestId = id;
            if (seriesId) dbQuery.seriesId = seriesId;
            if (combinationId) dbQuery.combinationId = combinationId;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (courseId) dbQuery.courseId = courseId;

            let data = await UserSeriesTestTracker.find(dbQuery).populate([
                {
                    path: 'seriesId', select: 'seriesNumber seriesName combinationId'
                },
                {
                    path: 'courseId', select: 'courseName type icon'
                },
                {
                    path: 'subjectId', select: 'subjectName icon'
                }
            ]).select('-questions').sort({ createdAt: -1, timeLeftInMinutes: 1 });
            const totalDataCount = await UserSeriesTestTracker.find(dbQuery).countDocuments();


            if (data.length) {
                data = JSON.parse(JSON.stringify(data));
                data = data.map((x) => {
                    x._id = x.seriesTestId;
                    delete x.seriesTestId;
                    return x;
                })
            }
            Logger.info('Ongoing Series tests fetched successfully')
            res.status(200).send({ status: 1, message: "Series Test fetched successfully!", totalDataCount, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchTestScores(req, res, next) {
        try {
            let {
                id,
                seriesId,
                courseId,
                subjectId,
                combinationId

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            let userId = req.userId;

            let dbQuery = { userId };
            if (id) dbQuery._id = id;
            if (seriesId) dbQuery.seriesId = seriesId;

            //Matching filters
            let matchFilters = {
                userId: new mongoose.Types.ObjectId(userId)
            };
            if (courseId) matchFilters.courseId = new mongoose.Types.ObjectId(courseId);
            if (subjectId) matchFilters.subjectId = new mongoose.Types.ObjectId(subjectId);
            if (combinationId) matchFilters.combinationId = new mongoose.Types.ObjectId(combinationId);

            const data = await UserSeriesTestLogs.aggregate([
                {
                    $match: matchFilters
                },
                {
                    $group: {
                        _id: "$seriesId",
                        highestScore: { $max: "$percentage" },
                        userId: { $first: "$userId" },  // Keep the first userId if needed
                        seriesTestId: { $first: "$seriesTestId" },  // Keep the first seriesTestId if needed
                        combinationId: { $first: "$combinationId" },  // Keep the first combinationId if needed
                    }
                },
                {
                    $lookup: {
                        from: "series",
                        localField: "_id",
                        foreignField: "_id",
                        as: "seriesDetails"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        // seriesId: "$_id",
                        highestScore: 1,
                        seriesTestId: 1,
                        seriesId: { $arrayElemAt: ["$seriesDetails", 0] }
                    }
                }
            ]);
            Logger.info('Series test scores fetched successfully')
            res.status(200).send({ status: 1, message: "Test scores fetched successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchSeriesTestLogs(req, res, next) {
        try {
            let {
                seriesTestId,
                courseId,
                subjectId,
                combinationId

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                seriesTestId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            let userId = req.userId;

            let dbQuery = { userId, seriesTestId }
            if (combinationId) dbQuery.combinationId = combinationId;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (courseId) dbQuery.courseId = courseId;

            const data = await UserSeriesTestLogs.findOne(dbQuery).populate([
                { path: 'seriesId', select: 'seriesNumber seriesName seriesId combinationId' },
                { path: 'subjectId', select: 'subjectName icon' },
                { path: 'courseId', select: 'courseName icon type' }
            ]).sort({ percentage: -1 });
            Logger.info('Series test logs fetched successfully')
            res.status(200).send({ status: 1, message: "Series Test logs successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }
}
export default SeriesController;