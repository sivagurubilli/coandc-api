import { getLoggerWithLabel } from '../../utils/logger/logger.js';
const Logger = getLoggerWithLabel('Course_Controller');
import AppUtils from '../../utils/appUtils.js';
import {
    User, Course, Subject, CourseSubjectCombination, Chapters, Unit, CourseFinalTest, UserCourse,
    UserCourseUnlockCounter, Material, UserCourseFinalTestLogs, UserCourseMaterialLogs
} from '../models/index.js';
import { getCurrentDateAndTime, checkFreeTrialAccess, getCurrentDate, addDaysToDate } from '../../helpers/dates.js';
import mongoose from 'mongoose';
import moment from 'moment';

class CourseController {

    static async addCourse(req, res, next) {
        try {
            let { courseName, type, icon, status } = Object.assign(
                req.body,
            );

            const requiredFields = {
                courseName, type, icon, status
            };
            const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
            if (requestDataValid !== true) throw { status: 400, message: requestDataValid };
            const currentDateAndTime = getCurrentDateAndTime();
            courseName = AppUtils.capitalizeEveryStartingWord(courseName);
            const [courseDetails] = await Promise.all([
                User.findOne({ courseName, isDeleted: false }),
            ]);
            if (courseDetails)
                throw {
                    status: 409,
                    message:
                        'This course is already exists. Try with another one',
                };

            const data = await Course.create({
                courseName,
                type, icon, status,
                createdAt: currentDateAndTime,
                updatedAt: currentDateAndTime,
            });

            if (!data)
                throw {
                    status: 422,
                    message: 'Failed to add course. Try again',
                };

            Logger.info('Course Adding Success');
            res
                .status(200)
                .send({
                    status: 1,
                    message: 'Course added successfully',
                    data,
                });
        } catch (error) {
            next(error);
        }
    }

    static async fetchCourses(req, res, next) {
        try {

            let {
                status,
                courseName,
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
            if (courseName) dbQuery.courseName = courseName;
            if (status == 0 || status == 1) dbQuery.status = status;

            const data = await Course.find(dbQuery).limit(limit).skip(skip).sort({ courseName: 1 })
            const totalDataCount = await Course.find(dbQuery).countDocuments();

            res.status(200).send({ status: 1, message: "Courses fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (e) {
            next(e)
        }
    }

    static async editCourse(req, res, next) {
        try {

            let {
                status,
                courseName,
                type,
                icon,
                id
            } = Object.assign(req.body, req.query, req.params)


            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            const courseData = await Course.findOne({ _id: id, isDeleted: false });
            if (!courseData) throw { status: 404, message: "No course found" }

            let updateBody = { updatedAt: getCurrentDateAndTime() };
            if (courseName) updateBody.courseName = AppUtils.capitalizeEveryStartingWord(courseName);
            if (status == 0 || status == 1) updateBody.status = status;
            if (type) updateBody.type = type;
            if (icon) updateBody.icon = icon;

            const data = await Course.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
            res.status(200).send({ status: 1, message: "Courses updated successfully!", data })
        }
        catch (e) {
            next(e)
        }
    }

    static async deleteCourse(req, res, next) {
        try {

            let {
                id
            } = Object.assign(req.body, req.query, req.params)


            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const data = await Course.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { updatedAt: getCurrentDateAndTime(), isDeleted: true } }, { new: true });
            if (!data) throw { status: 404, message: "No course found" }
            res.status(200).send({ status: 1, message: "Course deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }


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
                Subject.findOne({ subjectName, isDeleted: false }),
            ]);
            if (subjectDetails)
                throw {
                    status: 409,
                    message:
                        'This subject is already exists. Try with another one',
                };

            const data = await Subject.create({
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

            const data = await Subject.find(dbQuery).limit(limit).skip(skip).sort({ courseName: 1 })
            const totalDataCount = await Subject.find(dbQuery).countDocuments();

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
            const courseData = await Subject.findOne({ _id: id, isDeleted: false });
            if (!courseData) throw { status: 404, message: "No subject found" }

            let updateBody = { updatedAt: getCurrentDateAndTime() };
            if (subjectName) updateBody.subjectName = AppUtils.capitalizeEveryStartingWord(subjectName);
            if (icon) updateBody.icon = icon;
            if (status == 0 || status == 1) updateBody.status = status;

            const data = await Subject.findOneAndUpdate({ _id: id }, { $set: updateBody }, { new: true })
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

            const data = await Subject.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { updatedAt: getCurrentDateAndTime(), isDeleted: true } }, { new: true });
            if (!data) throw { status: 404, message: "No subject found" }
            res.status(200).send({ status: 1, message: "Subject deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    //Course-Subject-Combination
    static async addCourseSubjectCombination(req, res, next) {
        try {

            let {
                courseId,
                subjectId,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                courseId,
                subjectId,
                status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let courseData = await Course.findOne({ _id: courseId, isDeleted: false });
            if (!courseData) throw { status: 404, message: "No course found!" }

            let subjectData = await Subject.findOne({ _id: subjectId, isDeleted: false });
            if (!subjectData) throw { status: 404, message: "No subject found!" }

            let combinationData = await CourseSubjectCombination.findOne({ subjectId, courseId, isDeleted: false });
            if (combinationData) throw { status: 409, message: "This combination is already exists. Try another one" }

            let data = await CourseSubjectCombination.create({
                subjectId, courseId, status, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw { status: 422, message: "Failed to add combination. Try again" }
            res.status(201).send({ status: 1, message: "Combination added sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async fetchCourseSubjectCombination(req, res, next) {
        try {
            let {
                id,
                subjectId,
                courseId,
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
            if (status == 0 || status == 1) dbQuery.status = status;
            if (courseId) dbQuery.courseId = courseId;
            if (subjectId) dbQuery.subjectId = subjectId;

            let data = await CourseSubjectCombination.find(dbQuery).populate([{ path: "courseId", select: 'courseName type icon status' }, { path: "subjectId", select: 'subjectName icon status' }]).limit(limit).skip(skip).sort({ _id: -1 });
            let totalDataCount = await CourseSubjectCombination.find(dbQuery).countDocuments();

            res.status(200).send({ status: 1, message: "Combinations fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }


    static async editCourseSubjectCombination(req, res, next) {
        try {
            let {
                id,
                courseId,
                subjectId,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status == 0 || status == 1) dbQuery.status = status;

            let data = await CourseSubjectCombination.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No combination found!" }

            if (courseId && subjectId) {
                let combinationData = await CourseSubjectCombination.findOne({ subjectId, courseId, isDeleted: false });
                if (combinationData && (combinationData._id).toString() != id.toString()) throw { status: 409, message: "This combination is already existed earlier. Try another one!" }
            }

            if (courseId) {
                let courseData = await Course.findOne({ _id: courseId, isDeleted: false });
                if (!courseData) throw { status: 404, message: "No course found!" }
                dbQuery.courseId = courseId;
            }

            if (subjectId) {
                let subjectData = await Subject.findOne({ _id: subjectId, isDeleted: false });
                if (!subjectData) throw { status: 404, message: "No subject found!" }
                dbQuery.subjectId = subjectId;
            }

            data = await CourseSubjectCombination.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });
            res.status(200).send({ status: 1, message: "Combination updated successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }


    static async deleteCourseSubjectCombination(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const data = await CourseSubjectCombination.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true, updatedAt: getCurrentDateAndTime() } }, { new: true });
            if (!data) throw { status: 404, message: "No combination found!" }
            res.status(200).send({ status: 1, message: "Combination deleted successfully!", data: {} })

        }
        catch (error) {
            next(error)
        }
    }

    /********************CHAPTER-API'S*********************/

    static async addChapter(req, res, next) {
        try {

            let {
                combinationId,
                chapterName,
                chapterNumber,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                combinationId,
                chapterName,
                chapterNumber,
                status
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let combinationData = await CourseSubjectCombination.findOne({ _id: combinationId, isDeleted: false });
            if (!combinationData) throw { status: 404, message: "No combination found!" }

            let chapterData = await Chapters.findOne({ chapterNumber, combinationId, isDeleted: false });
            if (chapterData) throw { status: 409, message: "Chapter number is already added for this combination. Try another!" }

            chapterData = await Chapters.create({
                chapterName: AppUtils.capitalizeEveryStartingWord(chapterName),
                chapterNumber,
                subjectId: combinationData.subjectId,
                courseId: combinationData.courseId,
                combinationId,
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
                combinationId,
                chapterName,
                chapterNumber,
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
            if (chapterName) dbQuery.chapterName = chapterName;
            if (courseId) dbQuery.courseId = courseId;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (chapterNumber) dbQuery.chapterNumber = chapterNumber;
            if (combinationId) dbQuery.combinationId = combinationId;

            let data = await Chapters.find(dbQuery).populate([{ path: 'subjectId', select: 'subjectName icon' }, { path: 'courseId', select: 'courseName type icon' }]).limit(limit).skip(skip).sort({ chapterNumber: 1 });
            let totalDataCount = await Chapters.find(dbQuery).countDocuments();

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
                combinationId,
                chapterNumber,
                chapterName,
                status

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await Chapters.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No chapter found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status) dbQuery.status = status;
            if (chapterName) dbQuery.chapterName = AppUtils.capitalizeEveryStartingWord(chapterName);
            if (combinationId) {
                let combinationData = await CourseSubjectCombination.findOne({ _id: combinationId, isDeleted: false });
                if (!combinationData) throw { status: 404, message: "No combination found!" }
                dbQuery.combinationId = combinationId;
                dbQuery.courseId = combinationData.courseId;
                dbQuery.subjectId = combinationData.subjectId;
            }
            if (chapterNumber) {
                let chapterData = await Chapters.findOne({ chapterNumber, combinationId, isDeleted: false });
                if (chapterData && (chapterData._id).toString() !== id.toString()) throw { status: 409, message: "Chapter number is already for this combinationId. Try another!" }
                dbQuery.chapterNumber = chapterNumber;
            }
            data = await Chapters.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });
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

            let data = await Chapters.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No chapter found!" }

            data = await Chapters.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true, updatedAt: getCurrentDateAndTime() } }, { new: true });

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

            let chapterData = await Chapters.findOne({ _id: chapterId, isDeleted: false });
            if (!chapterData) throw { status: 404, message: "No chapter found!" }

            let unitData = await Unit.findOne({ unitNumber, chapterId, isDeleted: false });
            if (unitData) throw { status: 409, messag: "Unit number is already taken for this chapter. Try another!" }

            unitData = await Unit.create({
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
            if (courseId) dbQuery.courseId = courseId;
            if (subjectId) dbQuery.subjectId = subjectId;
            if (unitNumber) dbQuery.unitNumber = unitNumber;

            let data = await Unit.find(dbQuery).populate([{ path: 'chapterId', select: 'chapterName chapterNumber' }, { path: 'subjectId', select: 'subjectName icon' }, { path: 'courseId', select: 'courseName type icon' }]).limit(limit).skip(skip).sort({ unitNumber: 1 });
            let totalDataCount = await Unit.find(dbQuery).countDocuments();

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

            let data = await Unit.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No unit found." }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status) dbQuery.status = status;
            if (unitName) dbQuery.unitName = AppUtils.capitalizeEveryStartingWord(unitName);
            if (chapterId) {
                let chapterData = await Chapters.findOne({ _id: chapterId, isDeleted: false });
                if (!chapterData) throw { status: 404, message: "No chapter found." }
                dbQuery.chapterId = chapterId;
            }
            if (unitNumber) {
                let unitData = await Unit.findOne({ _id: chapterId, unitNumber, isDeleted: false });
                if (unitData && (unitData._id).toString() !== id.toString()) throw { status: 409, message: "unitNumber is already taken for this chapter. Try another!" }
                dbQuery.unitNumber = unitNumber;
            }
            data = await Unit.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });
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

            let data = await Unit.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No unit found." }

            data = await Unit.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true, updatedAt: getCurrentDateAndTime() } }, { new: true });

            Logger.info('Unit deleted successfully')
            res.status(200).send({ status: 1, message: "Unit deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    /*-------------------------------------MATERIAL-APIS----------------------------*/
    static async addMaterial(req, res, next) {
        try {

            let {
                materialName,
                materialNumber,
                description,
                unitId,
                materialUrl,
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

            let unitData = await Unit.findOne({ _id: unitId, isDeleted: false });
            if (!unitData) throw { status: 404, message: "No unit found!" }

            let data = await Material.findOne({ unitId, materialNumber, isDeleted: false });
            if (data) throw { status: 409, message: "Material number is already used for this unit" }

            data = await Material.create({
                materialName: materialName,
                materialNumber,
                description,
                unitId,
                materialUrl,
                status,
                type,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw { status: 422, message: "Fundamental material adding failed. Try again" }

            Logger.info('Materials added successfully')
            res.status(201).send({ status: 1, message: "Material added successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getMaterials(req, res, next) {
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

            let data = await Material.find(dbQuery).populate([{ path: "unitId" }]).limit(limit).skip(skip).sort({ 'materialNumber': 1 });
            let totalDataCount = await Material.find(dbQuery).countDocuments();

            Logger.info('Materials fetched successfully')
            res.status(200).send({ status: 1, message: "Materials list fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }


    static async editMaterial(req, res, next) {
        try {
            let {
                id,
                materialName,
                unitId,
                materialUrl,
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

            let data = await Material.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No material found." }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (status != undefined && status != null) dbQuery.status = status;
            if (description) dbQuery.description = description;
            if (materialName) dbQuery.materialName =materialName;
            if (materialUrl) dbQuery.materialUrl = materialUrl;
            if (type) dbQuery.type = type;
            if (unitId) {
                let unitData = await Unit.findOne({ _id: unitId, isDeleted: false });
                if (!unitData) throw { status: 404, message: "No unit found!" }
                dbQuery.unitId = unitId;
            }
            if (materialNumber) {
                let unitid = (unitId) ? unitId : data.unitId;
                let matData = await Material.findOne({ unitId: unitid, materialNumber, isDeleted: false });
                if (matData && (matData._id).toString() != id.toString()) throw { status: 409, message: "Material number is already taken for this unit" }
                dbQuery.materialNumber = materialNumber;

            }
            data = await Material.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });

            Logger.info('Material updated successfully')
            res.status(200).send({ status: 1, message: "Material updated sucessfully!", data })

        }
        catch (error) {
            next(error)
        }
    }


    static async deleteMaterial(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await Material.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true } }, { new: true });

            Logger.info('Material deleted successfully')
            res.status(200).send({ status: 1, message: "Material deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    //*-------------------Final_test_APIS-----------------------------------------------------*/
    static async addFinaltest(req, res, next) {
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

            let unitData = await Unit.findOne({ _id: unitId, isDeleted: false });
            if (!unitData) throw { status: 404, message: "No unit found!" }

            let data = await CourseFinalTest.findOne({ unitId, isDeleted: false });
            if (data) throw { status: 409, message: "Questions are already added for this unit. Try for another unit" }

            if (!questions.length) throw Error("Questions can not be empty.")

            data = await CourseFinalTest.create({
                unitId,
                questions,
                createdAt: getCurrentDateAndTime(),
                updatedAt: getCurrentDateAndTime()
            });
            if (!data) throw { status: 422, message: "Unable to add finaltest. Try again" }
            Logger.info('Final test added successfully')
            res.status(201).send({ status: 1, message: "Finaltest added sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getFinaltests(req, res, next) {
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

            let data = await CourseFinalTest.find(dbQuery).limit(limit).skip(skip).sort({ _id: -1 });
            let totalDataCount = await CourseFinalTest.find(dbQuery).countDocuments();
            Logger.info('Final tests fetched successfully')
            res.status(200).send({ status: 1, message: "FinalTests fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }


    static async editFinaltest(req, res, next) {
        try {
            let {
                id,
                unitId, questions

            } = Object.assign(req.body)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await CourseFinalTest.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No finaltest found!" }

            let dbQuery = { updatedAt: getCurrentDateAndTime() };
            if (unitId) {
                let unitData = await Unit.findOne({ _id: unitId, isDeleted: false });
                if (!unitData) throw { status: 404, message: "No unit found!" }

                let unitTestData = await CourseFinalTest.findOne({ unitId, isDeleted: false });
                if (unitTestData && (unitTestData._id).toString() !== id.toString()) throw { status: 409, message: "Questions are already added for this unit. Try for another unit" }
                dbQuery.unitId = unitId

            }
            if (questions) {
                if (!questions.length) throw { status: 400, message: "Questions cannot be empty." }
                dbQuery.questions = questions;
            }
            data = await CourseFinalTest.findOneAndUpdate({ _id: id }, { $set: dbQuery }, { new: true });
            Logger.info('Finaltest updated successfully')
            res.status(200).send({ status: 1, message: "Finaltest updated successfully!", data })

        }
        catch (error) {
            next(error)
        }
    }

    static async deleteFinaltest(req, res, next) {
        try {
            let {
                id

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                id
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            let data = await CourseFinalTest.findOne({ _id: id, isDeleted: false });
            if (!data) throw { status: 404, message: "No finaltest found!" }

            data = await CourseFinalTest.findOneAndUpdate({ _id: id }, { $set: { isDeleted: true } }, { new: true });
            Logger.info('Finaltest deleted successfully')
            res.status(200).send({ status: 1, message: "Finaltest deleted successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    //User-Api's
    static async enrollCourse(req, res, next) {
        try {

            let {
                courseIds

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                courseIds
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);

            const isFreeAccessAvailable = checkFreeTrialAccess(req.user.createdAt);
            if (!isFreeAccessAvailable || req.user.subscriptionStatus !== 0) throw { status: 409, message: "Free access is available for first three days from registration" }

            const currentDateAndTime = getCurrentDateAndTime();
            const userId = req.user._id;
            courseIds = [...new Set(courseIds)];
            if (!courseIds.length) throw { status: 400, message: "Please provide atleast one course." }

            for (let x of courseIds) {
                let courseData = await Course.findOne({ _id: x, isDeleted: false });
                if (courseData) {
                    await UserCourse.findOneAndUpdate({ courseId: x, userId, isDeleted: false }, {
                        courseId: x, userId,
                        enrolledOn: 0,
                        isDeleted: false,
                        createdAt: currentDateAndTime,
                        updatedAt: currentDateAndTime,
                        enrolledOn: 0
                    }, { new: true, upsert: true, setDefaultsOnInsert: true })
                }
            }
            res.status(200).send({ status: 1, message: "Course enrolled successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    static async disenrollCourse(req, res, next) {
        try {

            let {
                courseIds

            } = Object.assign(req.body, req.query, req.params)

            let requiredFields = {
                courseIds
            }

            let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
            if (requestDataValid !== true) throw Error(requestDataValid);
            const currentDateAndTime = getCurrentDateAndTime();
            const userId = req.user._id;
            courseIds = [...new Set(courseIds)];
            if (!courseIds.length) throw { status: 400, message: "Please provide atleast one course." }

            const data = await UserCourse.updateMany({ userId, courseId: { $in: courseIds } }, { $set: { isDeleted: true, updatedAt: currentDateAndTime } }, { multi: true })
            res.status(200).send({ status: 1, message: "Course dis-enrolled successfully!", data: {} })
        }
        catch (error) {
            next(error)
        }
    }

    static async getUserEnrolledCourses(req, res, next) {
        try {

            let {
                courseId,
                subjectId

            } = Object.assign(req.query)

            let requiredFields = {
            }

            let userId = req.user._id;
            let aggregateQuery = [];
            let matchFilter = {
                userId: new mongoose.Types.ObjectId(userId), isDeleted: false,
            };
            if (courseId) matchFilter.courseId = new mongoose.Types.ObjectId(courseId);
            matchFilter.enrolledOn = (req.user.subscriptionStatus == 1) ? 1 : 0;
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
            res.status(200).send({ status: 1, message: "Enrolled courses fetched successfully!", totalDataCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getChaptersListByUser(req, res, next) {

        try {

            let combinationId = req.query.combinationId;
            if (!combinationId) throw { status: 400, message: "Please provide combinationId." }
            let userId = req.user._id;

            let aggregateQuery = [];


            let data = await CourseSubjectCombination.findOne({ _id: combinationId, isDeleted: false });
            if (!data) throw { status: 404, message: "No combination found!" }

            //Filters_attaching
            aggregateQuery.push({
                $match: { _id: new mongoose.Types.ObjectId(combinationId) },
            },)


            aggregateQuery.push(
                {
                    $lookup: {
                        from: 'chapters',
                        localField: '_id',
                        foreignField: 'combinationId',
                        as: 'chapters',
                    },
                },
                {
                    $unwind: '$chapters',
                },
                {
                    $lookup: {
                        from: 'units',
                        localField: 'chapters._id',
                        foreignField: 'chapterId',
                        as: 'units',
                    },
                },
                {
                    $addFields: {
                        'chapters.totalUnitsCount': {
                            $size: {
                                $filter: {
                                    input: '$units',
                                    as: 'unit',
                                    cond: { $eq: ['$$unit.isDeleted', false] }
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        status: { $first: '$status' },
                        isDeleted: { $first: '$isDeleted' },
                        subjectId: { $first: '$subjectId' },
                        courseId: { $first: '$courseId' },
                        chapters: { $push: '$chapters' },
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        isDeleted: 1,
                        subjectId: 1,
                        courseId: 1,
                        chapters: {
                            $filter: {
                                input: '$chapters',
                                as: 'chapter',
                                cond: { $eq: ['$$chapter.isDeleted', false] }
                            }
                        }
                    }
                }
            )

            data = await CourseSubjectCombination.aggregate(aggregateQuery);
            data = JSON.parse(JSON.stringify(data));
            res.status(200).send({ status: 1, message: "Chapters fetched successfully!", data })
        }
        catch (error) {
            next(error)
        }
    }

    static async getUnitsListByUser(req, res, next) {
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
                chapterData = await Chapters.findOne({ _id: chapterId, isDeleted: false });
                if (!chapterData) throw { status: 404, message: "No chapter found!" }
                dbQuery.chapterId = chapterId;
            }
            if (subjectId) dbQuery.subjectId = subjectId;
            if (unitNumber) dbQuery.unitNumber = unitNumber;

            let totalDataCount = await Unit.find(dbQuery).countDocuments();
            let data = await Unit.find(dbQuery).populate([{ path: 'chapterId', select: 'chapterName chapterNumber' }, { path: 'subjectId', select: 'subjectName icon' }]).limit(limit).skip(skip).sort({ unitNumber: 1 });
            data = JSON.parse(JSON.stringify(data));
            if (data.length) {
                let unitLogsData = await UserCourseUnlockCounter.findOne({ userId, chapterId: chapterData._id, combinationId: chapterData.combinationId })

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
            }
            res.status(200).send({ status: 1, message: "Units list fetched successfully!", totalDataCount, currentPageCount: data.length, data })

        }
        catch (error) {
            next(error)
        }
    }

    static async getUnitDetailsByUser(req, res, next) {
        try {
            const userId = req.user._id;
            let id = req.query.unitId;
            if (!id) throw { status: 400, message: "Please provide unit id" };

            let unitData = await Unit.findOne({ _id: id, isDeleted: false }).populate([{ path: "chapterId", select: 'chapterNumber subjectId combinationId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }

            //Checking_Unit_Access_Or_Not
            let unitLogsData = await UserCourseUnlockCounter.findOne({ userId, combinationId: unitData.chapterId.combinationId, chapterId: unitData.chapterId._id })
            if (!unitLogsData && unitData.unitNumber != 1) throw { status: 403, message: "Please complete previous unit to unlock this unit." }
            if (unitLogsData) {
                if (unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) throw { status: 500, message: "Please complete previous unit to unlock this unit." }
            }

            //After_Having_UnitAccess
            let [materials, finaltestData, userUnlocksData, materialLogsData] = await Promise.all([
                Material.find({ unitId: id, isDeleted: false }).sort({ 'materialNumber': 1 }),
                CourseFinalTest.findOne({ unitId: id, isDeleted: false }),
                UserCourseUnlockCounter.findOne({ userId, chapterId: unitData.chapterId._id, combinationId: unitData.chapterId.combinationId }),
                UserCourseMaterialLogs.findOne({ unitId: id, userId })

            ]);
            if (!materials.length) throw { status: 404, message: "Material is not yet added for this unit" }
            if (!finaltestData) throw { status: 404, message: "Final test is not yet added for this unit" }

            materials = JSON.parse(JSON.stringify(materials));
            finaltestData = JSON.parse(JSON.stringify(finaltestData));
            let materialData = { materials };

            if (!userUnlocksData) {
                if (unitData.unitNumber == 1) materialData.isLocked = false, finaltestData.isLocked = (materialLogsData) ? false : true;
                if (unitData.unitNumber != 1) materialData.isLocked = false, finaltestData.isLocked = true;
            }
            if (userUnlocksData) {
                if (unitData.unitNumber < userUnlocksData.nextUnlockedUnitNumber) materialData.isLocked = false, finaltestData.isLocked = (materialLogsData) ? false : true;
                if (unitData.unitNumber == userUnlocksData.nextUnlockedUnitNumber) materialData.isLocked = false, finaltestData.isLocked = (materialLogsData) ? false : true;
                if (unitData.unitNumber > userUnlocksData.nextUnlockedUnitNumber) materialData.isLocked = true, finaltestData.isLocked = (materialLogsData) ? false : true;
            }

            finaltestData.questions = (AppUtils.shuffleArray(finaltestData.questions)).slice(0, 10);
            res.status(200).send({ status: 1, message: "Unit details fetched sucessfully!", data: { materialData, finaltestData } })
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


            const unitData = await Unit.findOne({ _id: unitId, isDeleted: false }).populate([{ path: "chapterId", select: 'chapterNumber subjectId combinationId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }

            const materialData = await Material.findOne({ unitId, isDeleted: false });
            if (materialData) {
                let materialLogsData = await UserCourseMaterialLogs.findOne({ unitId, userId });
                if (!materialLogsData) throw { status: 403, message: "Unlock your material first to access the assessment." }
            }
            else throw { status: 400, message: "No material added for the unit. " }

            const testData = await CourseFinalTest.findOne({ _id: testId, unitId, isDeleted: false });
            if (!testData) throw { status: 404, message: "No test found" }

            const unitLogsData = await UserCourseUnlockCounter.findOne({ userId, combinationId: unitData.chapterId.combinationId, chapterId: unitData.chapterId._id })
            if ((unitLogsData && unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) || (!unitLogsData && unitData.unitNumber != 1)) throw { status: 403, message: "Please complete previous unit to unlock this unit." }

            const lastAttemptedData = await UserCourseFinalTestLogs.findOne({
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

            let unitData = await Unit.findOne({ _id: unitId, isDeleted: false }).populate([{ path: "chapterId", select: 'chapterNumber subjectId combinationId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }


            //Checking_Unit_Access_Or_Not
            let unitLogsData = await UserCourseUnlockCounter.findOne({ userId, chapterId: unitData.chapterId._id, combinationId: unitData.chapterId.combinationId })
            if (!unitLogsData && unitData.unitNumber != 1) throw { status: 403, message: "Please complete previous unit to unlock this unit." }
            if (unitLogsData) {
                if (unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) throw { status: 403, message: "Please complete previous unit to unlock this unit." }
            }

            let data = await UserCourseMaterialLogs.findOne({ userId, unitId });
            let updateBody = {
                userId,
                unitId,
                updatedAt: getCurrentDateAndTime()
            }
            if (!data) updateBody.createdAt = getCurrentDateAndTime();
            data = await UserCourseMaterialLogs.findOneAndUpdate({ userId, unitId }, { $set: updateBody }, { new: true, upsert: true, setDefaultsOnInsert: true });
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

            let testData = await CourseFinalTest.findOne({ _id: testId, unitId, isDeleted: false });
            if (!testData) throw { status: 404, message: "No test found." }
            testData = JSON.parse(JSON.stringify(testData))

            let materialData = await Material.findOne({ unitId, isDeleted: false });
            if (materialData) {
                let materialLogsData = await UserCourseMaterialLogs.findOne({ unitId, userId });
                if (!materialLogsData) throw { status: 403, message: "Unlock your material first to access the assessment." }
            }

            let unitData = await Unit.findOne({ _id: unitId, isDeleted: false }).populate([{ path: 'chapterId', select: 'chapterNumber subjectId combinationId' }])
            if (!unitData) throw { status: 404, message: "No unit found" }

            const chapterId = unitData.chapterId._id;
            const subjectId = unitData.chapterId.subjectId;
            let attemptedOn;  //For Storing test logs

            //Checking_Unit_Access_Or_Not
            let unitLogsData = await UserCourseUnlockCounter.findOne({ userId, chapterId: unitData.chapterId._id, combinationId: unitData.chapterId.combinationId })
            if (!unitLogsData && unitData.unitNumber != 1) throw { status: 403, message: "Please complete previous unit to unlock this unit." }
            if (unitLogsData && unitData.unitNumber > unitLogsData.nextUnlockedUnitNumber) throw { status: 500, message: "Please complete previous unit to unlock this unit." }

            if (!unitLogsData || unitLogsData && unitData.unitNumber == unitLogsData.nextUnlockedUnitNumber) {
                const lastAttemptedData = await UserCourseFinalTestLogs.findOne({
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

            let data = await UserCourseFinalTestLogs.findOne({ userId, unitId, testId }).sort({ percentage: -1 });
            if (!data) highestPercentage = percentage, attemptedOn = 0;
            else if (data) {
                attemptedOn = (data.highestPercentage >= 50) ? 1 : 0;
                highestPercentage = (data.highestPercentage > percentage) ? data.highestPercentage : percentage;
            }

            //When the user qualified in assessment
            if ((!data && percentage >= 50) || ((data && data.highestPercentage < 50) && percentage >= 50)) {
                let nextUnlockedUnitNumber;
                let chapterUnitsData = await Unit.findOne({ chapterId: unitData.chapterId._id }).sort({ unitNumber: -1 })
                if (unitData.unitNumber < chapterUnitsData.unitNumber) {
                    nextUnlockedUnitNumber = unitData.unitNumber + 1;
                } if (unitData.unitNumber == chapterUnitsData.unitNumber) {
                    nextUnlockedUnitNumber = unitData.unitNumber + 1;
                }
                let unlockData = await UserCourseUnlockCounter.findOne({ userId, chapterId: unitData.chapterId._id, combinationId: unitData.chapterId.combinationId });
                if (!unlockData) {
                    unlockData = await UserCourseUnlockCounter.create({
                        nextUnlockedUnitNumber,
                        userId,
                        chapterId: unitData.chapterId._id,
                        combinationId: unitData.chapterId.combinationId,
                        createdAt: currentDate,
                        updatedAt: currentDate
                    })
                }
                else if (unlockData) {
                    unlockData = await UserCourseUnlockCounter.findOneAndUpdate({ userId, chapterId: unitData.chapterId._id, combinationId: unitData.chapterId.combinationId }, {
                        $set: {
                            nextUnlockedUnitNumber,
                            userId,
                            subjectId: unitData.subjectId,
                            combinationId: unitData.chapterId.combinationId,
                            updatedAt: currentDate
                        }
                    }, { new: true })
                }
            }

            // let updateBody = {
            //     userId,
            //     testId,
            //     unitId,
            //     responses,
            //     chapterId,
            //     subjectId,
            //     maxPercentage: Math.round(maxPercentage),
            //     currentAttemptPercentage: Math.round(percentage),
            //     lastAttemptedAt: currentDate,
            //     updatedAt: currentDate
            // }
            // if (!data) updateBody.createdAt = currentDate;

            // //Storing finaltest
            // data = await UserFinaltestLogs.findOneAndUpdate({ userId, unitId, testId }, { $set: updateBody }, { new: true, upsert: true });

            //Storing User TestLogs
            data = await UserCourseFinalTestLogs.create({
                combinationId: unitData.chapterId.combinationId, responses, userId, testId, unitId,
                chapterId, subjectId, percentage: Math.round(percentage), createdAt: currentDate, updatedAt: currentDate,
                attemptedOn, highestPercentage: Math.round(highestPercentage)
            })
            res.status(200).send({ status: 1, message: "Final test submitted sucessfully!", data })
        }
        catch (error) {
            next(error)
        }
    }
}
export default CourseController;