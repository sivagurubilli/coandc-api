import { getLoggerWithLabel } from '../../utils/logger/logger.js';
const Logger = getLoggerWithLabel('Fundamentals_Controller');
import AppUtils from '../../utils/appUtils.js';
import {
    UserFundamentalFinalTestLogs, UserFundamentalMaterialLogs, UserFundamentalUnlockCounters, FundamentalMaterial, FundamentalFinalTest, FundamentalSubject, FundamentalChapter, FundamentalUnit,
} from '../models/index.js';
import { getCurrentDateAndTime, getCurrentDate, addDaysToDate } from '../../helpers/dates.js';
import mongoose from 'mongoose';
import moment from 'moment';

class FundamentalController {
    /******************************SUBJECT API'S*************************/
    static async addSubject(req, res, next) {
        try {
            let { subjectName, icon, status } = Object.assign(
                req.body,
            );

            const requiredFields = {
                subjectName, icon, status
            };
            const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
            if (requestDataValid !== true) throw { status: 400, message: requestDataValid };
            const currentDateAndTime = getCurrentDateAndTime();
            subjectName = AppUtils.capitalizeEveryStartingWord(subjectName);

            const [subjectDetails] = await Promise.all([
                FundamentalSubject.findOne({ subjectName, isDeleted: false }),
            ]);
            if (subjectDetails)
                throw {
                    status: 409,
                    message:
                        'This subject is already exists. Try with another one',
                };

            const data = await FundamentalSubject.create({
                subjectName,
                icon, status,
                createdAt: currentDateAndTime,
                updatedAt: currentDateAndTime,
            });

            if (!data)
                throw {
                    status: 422,
                    message: 'Failed to add subject. Try again',
                };

            Logger.info('Subject Adding Success');
            res
                .status(200)
                .send({
                    status: 1,
                    message: 'Subject added successfully',
                    data,
                });
        } catch (error) {
            next(error);
        }
    }

    static async fetchSubjects(req, res, next) {
        try {

            let {
                status,
                subjectName,
                id,
                limit, page, skip
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
            if (subjectName) dbQuery.subjectName = subjectName;
            if (status == 0 || status == 1) dbQuery.status = status;

            const data = await FundamentalSubject.find(dbQuery).limit(limit).skip(skip).sort({ courseName: 1 })
            const totalDataCount = await FundamentalSubject.find(dbQuery).countDocuments();

            res.status(200).send({ status: 1, message: "Subjects fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (e) {
            next(e)
        }
    }

    static async editSubject(req, res, next) {
        try {

            let {
                status,
                subjectName,
                icon,
                id
            } = Object.assign(req.body, req.query, req.params)


            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            const courseData = await FundamentalSubject.findOne({ _id: id, isDeleted: false });
            if (!courseData) throw { status: 404, message: "No subject found" }

            let updateBody = { updatedAt: getCurrentDateAndTime() };
            if (subjectName) updateBody.subjectName = AppUtils.capitalizeEveryStartingWord(subjectName);
            if (icon) updateBody.icon = icon;
            if (status == 0 || status == 1) updateBody.status = status;

            const data = await FundamentalSubject.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
            res.status(200).send({ status: 1, message: "Subjects updated successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async deleteSubject(req, res, next) {
        try {

            let {
                id
            } = Object.assign(req.body, req.query, req.params)


            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const data = await FundamentalSubject.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { updatedAt: getCurrentDateAndTime(), isDeleted: true } }, { new: true });
            if (!data) throw { status: 404, message: "No subject found" }
            res.status(200).send({ status: 1, message: "Subject deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    /********************CHAPTER-API'S*********************/

    static async addChapter(req, res, next) {
        try {

            let {
                subjectId,
                chapterName,
                chapterNumber,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                subjectId,
                chapterName,
                chapterNumber,
                status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const subjectData = await FundamentalSubject.findOne({ _id: subjectId, isDeleted: false });
            if (!subjectData) throw { status: 404, message: "No subject found. Try another!" }

            let chapterData = await FundamentalChapter.findOne({ chapterNumber, subjectId, isDeleted: false });
            if (chapterData) throw { status: 409, message: "Chapter number is already added for this subject. Try another!" }

            chapterData = await FundamentalChapter.create({
                chapterName: AppUtils.capitalizeEveryStartingWord(chapterName),
                chapterNumber,
                subjectId: subjectId,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime(),
                status
            });
            if (!chapterData) throw {
                status: 422, message: "Unable to store chapter.Try again"
            }
            Logger.info('Chapter added successfully')
            res.status(201).send({ status: 1, message: "Chapter added successfully!", data: chapterData })
        }
        catch (error) {
            next(error)
        }
    }

    static async getChapters(req, res, next) {
        try {
            let {
                id,
                chapterName,
                chapterNumber,
                subjectId,
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
            if (chapterName) dbQuery.chapterName = chapterName;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (chapterNumber) dbQuery.chapterNumber = chapterNumber;

            let data = await FundamentalChapter.find(dbQuery).populate([{ path: 'subjectId', select: 'subjectName icon' }]).limit(limit).skip(skip).sort({ chapterNumber: 1 });
            let totalDataCount = await FundamentalChapter.find(dbQuery).countDocuments();

            Logger.info('Chapters fetched successfully')
            res.status(200).send({ status: 1, message: "Chapters fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }


    static async editChapter(req, res, next) {
        try {
            let {
                id,
                subjectId,
                chapterNumber,
                chapterName,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalChapter.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No chapter found. Try another!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status) dbQuery.status = status;
            if (chapterName) dbQuery.chapterName = AppUtils.capitalizeEveryStartingWord(chapterName);
            if (subjectId) {
                const subjectData = await FundamentalSubject.findOne({ _id: subjectId, isDeleted: false });
                if (!subjectData) throw { status: 404, message: "No subject found. Try another!" }
                dbQuery.subjectId = subjectId;
            }
            if (chapterNumber) {
                let chapterData = await FundamentalChapter.findOne({ chapterNumber, subjectId, isDeleted: false });
                if (chapterData && (chapterData._id).toString() !== id.toString()) throw { status: 409, message: "Chapter number is already for this subject. Try another!" }
                dbQuery.chapterNumber = chapterNumber;
            }
            data = await FundamentalChapter.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });
            Logger.info('Chapters updated successfully')
            res.status(200).send({ status: 1, message: "Chapter updated successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async deleteChapter(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalChapter.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No chapter found!" }

            data = await FundamentalChapter.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true, updatedAt: getCurrentDateAndTime() } }, { new: true });

            Logger.info('Chapters deleted successfully')
            res.status(200).send({ status: 1, message: "Chapter deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    /****************Unit-Api's*************************************/
    static async addUnit(req, res, next) {
        try {

            let {
                chapterId,
                unitNumber,
                unitName,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                chapterId,
                unitNumber,
                unitName,
                status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let chapterData = await FundamentalChapter.findOne({ _id: chapterId, isDeleted: false });
            if (!chapterData) throw { status: 404, message: "No chapter found!" }

            let unitData = await FundamentalUnit.findOne({ unitNumber, chapterId, isDeleted: false });
            if (unitData) throw { status: 409, message: "Unit number is already taken for this chapter. Try another!" }

            unitData = await FundamentalUnit.create({
                unitNumber,
                unitName: AppUtils.capitalizeEveryStartingWord(unitName),
                chapterId,
                status,
                subjectId: chapterData.subjectId,
                courseId: chapterData.courseId,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!unitData) throw { status: 422, message: "Unable to store unit.Try again" }

            Logger.info('Units added successfully')
            res.status(201).send({ status: 1, message: "Unit added successfully.", data: unitData })
        }
        catch (error) {
            next(error)
        }
    }

    static async getUnits(req, res, next) {
        try {
            let {
                id,
                unitNumber,
                chapterId,
                courseId,
                subjectId,
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
            if (chapterId) dbQuery.chapterId = chapterId;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (unitNumber) dbQuery.unitNumber = unitNumber;

            let data = await FundamentalUnit.find(dbQuery).populate([{ path: 'chapterId', select: 'chapterName chapterNumber' }, { path: 'subjectId', select: 'subjectName icon' }]).limit(limit).skip(skip).sort({ unitNumber: 1 });
            let totalDataCount = await FundamentalUnit.find(dbQuery).countDocuments();

            Logger.info('Units fetched successfully')
            res.status(200).send({ status: 1, message: "Units fetched successfully", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }


    static async editUnits(req, res, next) {
        try {
            let {
                id,
                chapterId,
                unitNumber,
                unitName,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalUnit.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No unit found." }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status) dbQuery.status = status;
            if (unitName) dbQuery.unitName = AppUtils.capitalizeEveryStartingWord(unitName);
            if (chapterId) {
                let chapterData = await FundamentalChapter.findOne({ _id: chapterId, isDeleted: false });
                if (!chapterData) throw { status: 404, message: "No chapter found." }
                dbQuery.chapterId = chapterId;
            }
            if (unitNumber) {
                let unitData = await FundamentalUnit.findOne({ chapterId, unitNumber, isDeleted: false });
                if (unitData && (unitData._id).toString() !== id.toString()) throw { status: 409, message: "unitNumber is already taken for this chapter. Try another!" }
                dbQuery.unitNumber = unitNumber;
            }
            data = await FundamentalUnit.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });
            Logger.info('Unit updated successfully')
            res.status(200).send({ status: 1, message: "Unit edited successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async deleteUnit(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalUnit.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No unit found." }

            data = await FundamentalUnit.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true, updatedAt: getCurrentDateAndTime() } }, { new: true });

            Logger.info('Unit deleted successfully')
            res.status(200).send({ status: 1, message: "Unit deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }


    /*-------------------------------------FUNDAMENTAL MATERIAL-APIS----------------------------*/
    static async addFundamentalMaterial(req, res, next) {
        try {

            let {
                materialName,
                materialNumber,
                description,
                unitId,
                url,
                status,
                type

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                materialName,
                materialNumber,
                unitId,
                type,
                status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let unitData = await FundamentalUnit.findOne({ _id: unitId, isDeleted: false });
            if (!unitData) throw { status: 404, message: "No unit found!" }

            let data = await FundamentalMaterial.findOne({ unitId, materialNumber, isDeleted: false });
            if (data) throw { status: 409, message: "Material number is already used for this unit" }
            data = await FundamentalMaterial.create({
                materialName: AppUtils.capitalizeEveryStartingWord(materialName),
                materialNumber,
                description,
                unitId,
                url,
                status,
                type,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw { message: "Material adding failed. Try again" }
            Logger.info('Fundamental material added sucessfully!')
            res.status(201).send({ status: 1, message: "Fundamental material added successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getFundamentalMaterial(req, res, next) {
        try {
            let {
                materialName,
                unitId,
                type,
                materialNumber,
                status,
                id,
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
            if (unitId) dbQuery.unitId = unitId;
            if (materialName) dbQuery.materialName = materialName;
            if (type) dbQuery.type = type;
            if (materialNumber) dbQuery.materialNumber = materialNumber;

            let data = await FundamentalMaterial.find(dbQuery).populate([{ path: "unitId" }]).limit(limit).skip(skip).sort({ 'materialNumber': 1 });
            let totalDataCount = await FundamentalMaterial.find(dbQuery).countDocuments();
            Logger.info('Fundamental material fetched sucessfully!')
            res.status(200).send({ status: 1, message: "Fundamental materials list fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }


    static async editFundamentalMaterial(req, res, next) {
        try {
            let {
                id,
                materialName,
                unitId,
                url,
                materialNumber,
                description,
                type,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalMaterial.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No material found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status != undefined && status != null) dbQuery.status = status;
            if (description) dbQuery.description = description;
            if (materialName) dbQuery.materialName = AppUtils.capitalizeEveryStartingWord(materialName);
            if (url) dbQuery.url = url;
            if (type) dbQuery.type = type;
            if (unitId) {
                let unitData = await FundamentalUnit.findOne({ _id: unitId, isDeleted: false });
                if (!unitData) throw { status: 404, message: "No fundamental unit found!" }
                dbQuery.unitId = unitId;
            }
            if (materialNumber) {
                let unitid = (unitId) ? unitId : data.unitId;
                let matData = await FundamentalMaterial.findOne({ unitId: unitid, materialNumber, isDeleted: false });
                if (matData && (matData._id).toString() != id.toString()) throw { status: 409, message: "Material number is already taken for this unit" }
                dbQuery.materialNumber = materialNumber;

            }
            data = await FundamentalMaterial.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });
            Logger.info('Fundamental material updated sucessfully!')
            res.status(200).send({ status: 1, message: "Fundamental material updated sucessfully!", data })

        }
        catch (error) {
            next(error)
        }
    }


    static async deleteFundamentalMaterial(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalMaterial.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true } }, { new: true });
            if (!data) throw { status: 404, message: "No material found" }

            Logger.info('Fundamental material deleted sucessfully!')
            res.status(200).send({ status: 1, message: "Fundamental material deleted successfully!", data: {} })

        }
        catch (error) {
            next(error)
        }
    }

    //*-------------------Fundamental Final_test_APIS-----------------------------------------------------*/
    static async addFundamentalFinaltest(req, res, next) {
        try {

            let {
                questions,
                unitId

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                questions,
                unitId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let unitData = await FundamentalUnit.findOne({ _id: unitId, isDeleted: false });
            if (!unitData) throw { status: 404, message: "No unit found!" }

            let data = await FundamentalFinalTest.findOne({ unitId, isDeleted: false });
            if (data) throw { status: 409, message: "Questions is already added for this unit. Try for another unit" }

            if (!questions.length) throw Error("Questions can not be empty")

            data = await FundamentalFinalTest.create({
                unitId,
                questions,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw { message: "Unable to store finaltest. Try again" }

            Logger.info('Fundamental final test added successfully')
            res.status(201).send({ status: 1, message: "Finaltest added sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getFundamentalFinaltests(req, res, next) {
        try {
            let {
                id,
                unitId,
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
            if (unitId) dbQuery.unitId = unitId;

            let data = await FundamentalFinalTest.find(dbQuery).limit(limit).skip(skip).sort({ _id: -1 });
            let totalDataCount = await FundamentalFinalTest.find(dbQuery).countDocuments();

            Logger.info('Fundamental finaltests fetched successfully!')
            res.status(200).send({ status: 1, message: "Fundamental finaltests fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }


    static async editFundamentalFinaltest(req, res, next) {
        try {
            let {
                id,
                unitId, questions

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalFinalTest.findOne({ _id: id });
            if (!data) throw { status: 404, message: "No finaltest found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (unitId) {
                let unitData = await FundamentalUnit.findOne({ _id: unitId, isDeleted: false });
                if (!unitData) throw { status: 404, message: "No unit found!" }

                let unitTestData = await FundamentalFinalTest.findOne({ unitId, isDeleted: false });
                if (unitTestData && (unitTestData._id).toString() !== id.toString()) throw { status: 409, message: "Questions are already added for this unit. Try for another unit" }
                dbQuery.unitId = unitId

            }
            if (questions) {
                if (!questions.length) throw { status: 400, message: "Questions cannot be empty." }
                dbQuery.questions = questions;
            }
            data = await FundamentalFinalTest.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });

            Logger.info("Fundamental finaltest updated successfully!")
            res.status(200).send({ status: 1, message: "Finaltest updated successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async deleteFundamentalFinaltest(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await FundamentalFinalTest.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true } }, { new: true });
            if (!data) throw { status: 404, message: "No final test found" }

            Logger.info("Fundamental finaltest deleted successfully!")
            res.status(200).send({ status: 1, message: "Fundamental finaltest deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchFundamentalSubjectsListByUser(req, res, next) {
        try {

            let subjectId = req.query.subjectId;
            let userId = req.userId;

            let aggregateQuery = [];

            if (subjectId) {
                let data = await FundamentalSubject.findOne({ _id: subjectId, isDeleted: false });
                if (!data) throw { status: 404, message: "No subject found!" }

                //Filters_attaching
                aggregateQuery.push({
                    $match: { _id: new mongoose.Types.ObjectId(subjectId) },
                },)
            }

            aggregateQuery.push(
                {
                    $match: { isDeleted: false }
                },
                {
                    $lookup: {
                        from: 'fundamentalchapters',
                        localField: '_id',
                        foreignField: 'subjectId',
                        as: 'chapters',
                    },
                },
                {
                    $unwind: "$chapters"
                },
                { $match: { 'chapters.isDeleted': false } },
                {
                    $lookup: {
                        from: 'fundamentalunits',
                        localField: 'chapters._id',
                        foreignField: 'chapterId',
                        as: 'units'
                    }
                },
                {
                    $addFields: {
                        "chapters.totalUnitsCount": {
                            $size: {
                                $filter: {
                                    input: "$units",
                                    as: "unit",
                                    cond: { $eq: ["$$unit.isDeleted", false] }
                                }
                            }
                        }
                    }
                },
                {
                    $sort: {
                        "chapters.chapterNumber": 1
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        status: { $first: "$status" },
                        subjectName: { $first: "$subjectName" },
                        isDeleted: { $first: "$isDeleted" },
                        icon: { $first: "$icon" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        chapters: { $push: "$chapters" }
                    }
                },
                {
                    $sort: {
                        subjectName: 1
                    }
                }
            )

            const data = await FundamentalSubject.aggregate(aggregateQuery);

            Logger.info('Fundamental subjects list fetched sucessfully!')
            res.status(200).send({ status: 1, message: "Fundamental subjects list fetched sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }
    static async fetchFundamentalUnitByUser(req, res, next) {
        try {
            let {
                id,
                unitNumber,
                chapterId,
                subjectId,
                status,
                limit,
                skip,
                page,
                chapterData

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                chapterId
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            const userId = req.user._id;

            limit = limit ? parseInt(limit) : 50
            page = page ? parseInt(page) : 1
            skip = parseInt(limit) * parseInt(page - 1)

            let dbQuery = { isDeleted: false };
            if (id) dbQuery._id = id;
            if (status) dbQuery.status = status;
            if (chapterId) {
                chapterData = await FundamentalChapter.findOne({ _id: chapterId, isDeleted: false });
                if (!chapterData) throw { status: 404, message: "No chapter found!" }
                dbQuery.chapterId = chapterId;
            }
            if (subjectId) dbQuery.subjectId = subjectId;
            if (unitNumber) dbQuery.unitNumber = unitNumber;

            let totalDataCount = await FundamentalUnit.find(dbQuery).countDocuments();
            let data = await FundamentalUnit.find(dbQuery).populate([{ path: 'chapterId', select: 'chapterName chapterNumber' }, { path: 'subjectId', select: 'subjectName icon' }]).limit(limit).skip(skip).sort({ unitNumber: 1 });
            data = JSON.parse(JSON.stringify(data));
            let unitLogsData = await UserFundamentalUnlockCounters.findOne({ userId, chapterId })
            if (!unitLogsData) {
                data.map(async (x) => {
                    if (x.unitNumber == 1) x.isLocked = false;
                    if (x.unitNumber != 1) x.isLocked = true;
                    return x;
                })
            }
            if (unitLogsData) {
                data.map(async (x) => {
                    if (x.unitNumber < unitLogsData.nextUnlockedUnitNumber) x.isLocked = false;
                    if (x.unitNumber == unitLogsData.nextUnlockedUnitNumber) x.isLocked = false;
                    if (x.unitNumber > unitLogsData.nextUnlockedUnitNumber) x.isLocked = true;
                    return x;
                })
            }
            res.status(200).send({ status: 1, message: "Fundamental units fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }


    static async getFundamentalUnitDetailsByUser(req, res, next) {
        try {
            const userId = req.userId;
            let id = req.query.unitId;
            if (!id) throw { status: 400, message: "Please provide unit id" };

            let unitData = await FundamentalUnit.findOne({ _id: id, isDeleted: false }).populate([{ path: "chapterId", select: 'chapterNumber subjectId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }

            //Checking_Unit_Access_Or_Not
            let unitLogsData = await UserFundamentalUnlockCounters.findOne({ userId, chapterId: unitData.chapterId._id })
            if (!unitLogsData && unitData.unitNumber != 1) throw { status: 403, message: "Please first unlock above units." }
            if (unitLogsData) {
                if (unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) throw { status: 500, message: "Please complete previous unit to unlock this unit." }
            }

            //After_Having_UnitAccess
            let [materials, finaltestData, userUnlocksData, materialLogsData] = await Promise.all([
                FundamentalMaterial.find({ unitId: id, isDeleted: false }).sort({ 'materialNumber': 1 }),
                FundamentalFinalTest.findOne({ unitId: id, isDeleted: false }),
                UserFundamentalUnlockCounters.findOne({ userId, chapterId: unitData.chapterId._id }),
                UserFundamentalMaterialLogs.findOne({ unitId: id, userId })
            ]);
            if (!materials.length) throw { status: 404, message: "Material is not yet added for this unit" }
            if (!finaltestData) throw { status: 404, message: "Final test is not yet added for this unit" }

            materials = JSON.parse(JSON.stringify(materials));
            finaltestData = JSON.parse(JSON.stringify(finaltestData));
            let materialData = { materials };

            if (!userUnlocksData) {
                if (unitData.unitNumber == 1) materialData.isLocked = false, finaltestData.isLocked = (materialLogsData) ? false : true;
                if (unitData.unitNumber != 1) materialData.isLocked = true, finaltestData.isLocked = true;
            }
            if (userUnlocksData) {
                if (unitData.unitNumber < userUnlocksData.nextUnlockedUnitNumber) materialData.isLocked = false, finaltestData.isLocked = (materialLogsData) ? false : true;
                if (unitData.unitNumber == userUnlocksData.nextUnlockedUnitNumber) materialData.isLocked = false, finaltestData.isLocked = (materialLogsData) ? false : true;
                if (unitData.unitNumber > userUnlocksData.nextUnlockedUnitNumber) materialData.isLocked = true, finaltestData.isLocked = (materialLogsData) ? false : true;
            }

            finaltestData.questions = (AppUtils.shuffleArray(finaltestData.questions)).slice(0, 10);

            Logger.info('Fundmental unit details fetched sucessfully!')
            res.status(200).send({ status: 1, message: "Fundmental unit details fetched sucessfully!", data: { materialData, finaltestData } })
        }
        catch (error) {
            next(error)
        }
    }

    static async checkFinalTestAccess(req, res, next) {
        try {

            const userId = req.user._id;
            const unitId = req.body.unitId;
            const testId = req.body.testId;
            if (!unitId) throw { status: 400, message: "Please provide unit id" };
            if (!testId) throw { status: 400, message: "Please provide test id" };


            const unitData = await FundamentalUnit.findOne({ _id: unitId, isDeleted: false }).populate([{ path: "chapterId", select: 'chapterNumber subjectId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }

            const materialData = await FundamentalMaterial.findOne({ unitId, isDeleted: false });
            if (materialData) {
                let materialLogsData = await UserFundamentalMaterialLogs.findOne({ unitId, userId });
                if (!materialLogsData) throw { status: 403, message: "Unlock your material first to access the assessment." }
            }
            else throw { status: 400, message: "No material added for the unit. " }

            const testData = await FundamentalFinalTest.findOne({ _id: testId, unitId, isDeleted: false });
            if (!testData) throw { status: 404, message: "No test found" }

            const unitLogsData = await UserFundamentalUnlockCounters.findOne({ userId, chapterId: unitData.chapterId._id })
            if ((unitLogsData && unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) || (!unitLogsData && unitData.unitNumber != 1)) throw { status: 403, message: "Please complete previous unit to unlock this unit." }

            const lastAttemptedData = await UserFundamentalFinalTestLogs.findOne({
                userId, unitId, testId,
                createdAt: {
                    $gte: `${getCurrentDate()}T00:00:00.000Z`,
                    $lte: `${getCurrentDate()}T23:59:59.000Z`

                },
                percentage: { $lt: 50 }
            })

            if (lastAttemptedData) {
                if ((unitLogsData && unitData.unitNumber == unitLogsData.nextUnlockedUnitNumber) || !unitLogsData) {
                    throw { status: 403, message: `This test will unlock on ${moment(addDaysToDate(1)).format('DD-MM-YYYY')} at 12:00 A.M` }
                }
            }
            res.status(200).send({ status: 1, message: "User can access the test." })
        }
        catch (error) {
            next(error)
        }
    }

    static async saveMaterialLog(req, res, next) {
        try {
            let unitId = req.body.unitId;
            let userId = req.user._id;
            if (!unitId) throw { status: 400, message: "Please provide unitId." }

            let unitData = await FundamentalUnit.findOne({ _id: unitId, isDeleted: false }).populate([{ path: "chapterId", select: 'chapterNumber subjectId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }


            //Checking_Unit_Access_Or_Not
            let unitLogsData = await UserFundamentalUnlockCounters.findOne({ userId, chapterId: unitData.chapterId._id })
            if (!unitLogsData && unitData.unitNumber != 1) throw { status: 403, message: "Please complete previous unit to unlock this unit." }
            if (unitLogsData) {
                if (unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) throw { status: 403, message: "Please complete previous unit to unlock this unit." }
            }

            let data = await UserFundamentalMaterialLogs.findOne({ userId, unitId });
            let updateBody = {
                userId,
                unitId,
                updatedAt: getCurrentDateAndTime()
            }
            if (!data) updateBody.createdAt = getCurrentDateAndTime();
            data = await UserFundamentalMaterialLogs.findOneAndUpdate({ userId, unitId }, { $set: updateBody }, { new: true, upsert: true, setDefaultsOnInsert: true });

            Logger.info('Fundamental material logs saved successfully')
            res.status(200).send({ status: 1, message: "Material log saved successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async submitFinaltest(req, res, next) {
        try {
            const userId = req.user._id;
            const currentDate = getCurrentDateAndTime();
            let {
                testId,
                unitId,
                responses,
                highestPercentage

            } = Object.assign(req.body)

            let requiredFields = {
                testId,
                unitId,
                responses
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            if (!responses.length) throw { status: 400, message: "No responses found!" }

            let testData = await FundamentalFinalTest.findOne({ _id: testId, unitId, isDeleted: false });
            if (!testData) throw { status: 404, message: "No test found." }
            testData = JSON.parse(JSON.stringify(testData))

            let materialData = await FundamentalMaterial.findOne({ unitId, isDeleted: false });
            if (materialData) {
                let materialLogsData = await UserFundamentalMaterialLogs.findOne({ unitId, userId });
                if (!materialLogsData) throw { status: 403, message: "Unlock your material first to access the assessment." }
            }

            let unitData = await FundamentalUnit.findOne({ _id: unitId, isDeleted: false }).populate([{ path: 'chapterId', select: 'chapterNumber subjectId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }

            const chapterId = unitData.chapterId._id;
            const subjectId = unitData.chapterId.subjectId;
            let attemptedOn;  //For Storing test logs

            //Checking_Unit_Access_Or_Not
            let unitLogsData = await UserFundamentalUnlockCounters.findOne({ userId, chapterId: unitData.chapterId._id })
            if (!unitLogsData && unitData.unitNumber != 1) throw { status: 403, message: "Please complete previous unit to unlock this unit." }
            if (unitLogsData && unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) throw { status: 500, message: "Please complete previous unit to unlock this unit." }

            if (!unitLogsData || unitLogsData && unitData.unitNumber == unitLogsData.nextUnlockedUnitNumber) {
                const lastAttemptedData = await UserFundamentalFinalTestLogs.findOne({
                    userId, unitId, testId,
                    createdAt: {
                        $gte: `${getCurrentDate()}T00:00:00.000Z`,
                        $lte: `${getCurrentDate()}T23:59:59.999Z`

                    },
                    percentage: { $lt: 50 }
                })
                if (lastAttemptedData) throw { status: 403, message: `This test will unlock on ${moment(addDaysToDate(1)).format('DD-MM-YYYY')} at 12:00 A.M` }
            }

            //After getting access
            let commonQuestions = (testData.questions).filter(question =>
                responses.some(response => (response.questionId).toString() == (question._id).toString()));
            let calculatedData = AppUtils.calculateAssessmentPercentage(commonQuestions, responses);
            let percentage = calculatedData.percentage;
            responses = calculatedData.responses;

            let data = await UserFundamentalFinalTestLogs.findOne({ userId, unitId, testId }).sort({ percentage: -1 });
            if (!data) highestPercentage = percentage, attemptedOn = 0;
            else if (data) {
                attemptedOn = (data.highestPercentage >= 50) ? 1 : 0;
                highestPercentage = (data.highestPercentage > percentage) ? data.highestPercentage : percentage;
            }

            //When the user qualified in assessment
            if ((!data && percentage >= 50) || ((data && data.highestPercentage < 50) && percentage >= 50)) {
                let nextUnlockedUnitNumber;
                let chapterUnitsData = await FundamentalUnit.findOne({ chapterId: unitData.chapterId._id }).sort({ unitNumber: -1 })
                if (unitData.unitNumber < chapterUnitsData.unitNumber) {
                    nextUnlockedUnitNumber = unitData.unitNumber + 1;
                } if (unitData.unitNumber == chapterUnitsData.unitNumber) {
                    nextUnlockedUnitNumber = unitData.unitNumber + 1;
                }
                let unlockData = await UserFundamentalUnlockCounters.findOne({ userId, chapterId: unitData.chapterId._id });
                if (!unlockData) {
                    unlockData = await UserFundamentalUnlockCounters.create({
                        nextUnlockedUnitNumber,
                        userId,
                        chapterId: unitData.chapterId._id,
                        createdAt: currentDate,
                        updatedAt: currentDate
                    })
                }
                else if (unlockData) {
                    unlockData = await UserFundamentalUnlockCounters.findOneAndUpdate({ userId, chapterId: unitData.chapterId._id }, {
                        $set: {
                            nextUnlockedUnitNumber,
                            userId,
                            subjectId: unitData.subjectId,
                            updatedAt: currentDate
                        }
                    }, { new: true })
                }
            }

            //Storing User TestLogs
            data = await UserFundamentalFinalTestLogs.create({
                responses, userId, testId, unitId,
                chapterId, subjectId, percentage: Math.round(percentage), createdAt: currentDate, updatedAt: currentDate,
                attemptedOn, highestPercentage: Math.round(highestPercentage)
            })

            Logger.info('Fundamental final test submitted successfully')
            res.status(200).send({ status: 1, message: "Final test submitted sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }
}
export default FundamentalController;