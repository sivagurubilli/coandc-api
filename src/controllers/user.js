import { getLoggerWithLabel } from '../../utils/logger/logger.js';
import mongoose from 'mongoose';
const Logger = getLoggerWithLabel('User_Controller');

import { User, Otp, UserQuizLogs, QuizContent, QuizCategory, Ticket, UserActivityLogs } from '../models/index.js';
import AuthMiddleware from '../../middlewares/authMiddleware.js';
import AppUtils from '../../utils/appUtils.js';
import { getCurrentDateAndTime, checkFreeTrialAccess } from '../../helpers/dates.js';

class UserController {

  static getconfig = async (req, res, next) => {
    try {
      let data = {};
      if (!req.query.type) throw { status: 400, message: "type is a required field" }

      if (req.query.type == "rzp") {
        data = {
          key: "rzp_test_9fCU1YLVql9Fpd",
          secret: "2GnMBiAdsUfrpJE70dabHUBA",
        }
      }
      else throw { status: 422, message: "Currently only rzp values available" }
      res
        .status(200)
        .send({
          status: 1,
          message: 'Config fetched successfully',
          data,
        });
    }
    catch (error) {
      next(error)
    }
  }

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

  static async signup(req, res, next) {
    try {
      let { name, mobileNo, email } = Object.assign(
        req.body,
        req.query,
        req.params,
      );

      const requiredFields = {
        name,
        mobileNo,
        email,

      };
      const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
      if (requestDataValid !== true)
        throw { status: 400, message: requestDataValid };
      const currentDateAndTime = getCurrentDateAndTime();
      const [emailData, mobileData] = await Promise.all([
        User.findOne({ status: 1, email, isDeleted: false }),
        User.findOne({ status: 1, mobileNo, isDeleted: false }),
      ]);
      if (emailData)
        throw {
          status: 409,
          message:
            'Email is already associated with another account. Try with another one',
        };
      if (mobileData)
        throw {
          status: 409,
          message:
            'Mobile number is already associated with another account. Try with another one',
        };

      const otp = AppUtils.generateOtp();
      const data = await User.findOneAndUpdate({ mobileNo }, {
        $set: {
          name: AppUtils.capitalizeEveryStartingWord(name),
          email,
          mobileNo,
          createdAt: currentDateAndTime,
          updatedAt: currentDateAndTime,
        }
      }, { new: true, upsert: true, setDefaultsOnInsert: true });

      if (!data)
        throw {
          status: 422,
          message: 'Failed to create account. Try again',
        };

      //Sending Mobile Sms
      await AppUtils.sendMobileSms({ mobileNo, otp });
      Logger.info('Signup Success');
      res
        .status(200)
        .send({
          status: 1,
          message: 'Otp sent successfully to mobile number',
          data,
        });
    } catch (error) {
      next(error);
    }
  }



  static async TrueCallersignup(req, res, next) {
    try {
      let { name, mobileNo,deviceToken } = Object.assign(
        req.body,
        req.query,
        req.params,
      );

      const requiredFields = {
        name,
        mobileNo,
        deviceToken,
      };
      const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
      if (requestDataValid !== true)
        throw { status: 400, message: requestDataValid };
      const currentDateAndTime = getCurrentDateAndTime();
      const [ mobileData] = await Promise.all([
        User.findOne({ status: 1, mobileNo, isDeleted: false }),
      ]);
     
      if (mobileData)
        throw {
          status: 409,
          message:
            'Mobile number is already associated with another account. Try with another one',
        };

      let data = await User.findOneAndUpdate({ mobileNo }, {
        $set: {
          name: AppUtils.capitalizeEveryStartingWord(name),
          mobileNo,
          deviceToken,
          createdAt: currentDateAndTime,
          updatedAt: currentDateAndTime,
          isMobileVerified: true,
          status: 1,
        }
      }, { new: true, upsert: true, setDefaultsOnInsert: true });

      if (!data)
        throw {
          status: 422,
          message: 'Failed to create account. Try again',
        };
        data = JSON.parse(JSON.stringify(data));
        const { accessToken, refreshToken } = AuthMiddleware.issueAuthTokens(
          data._id,
        );
        data.accessToken = accessToken;
        data.refreshToken = refreshToken;
        data.isFreeTrialActive = checkFreeTrialAccess(data.createdAt)
      //Sending Mobile Sms
      Logger.info('Signup Success');
      res
        .status(200)
        .send({
          status: 1,
          message: 'Signup through True Caller Success',
          data,
        });
    } catch (error) {
      next(error);
    }
  }

  static async verifySignupOtp(req, res, next) {
    try {
      let { id, mobileNo, otp,deviceToken } = Object.assign(
        req.body,
        req.query,
        req.params,
      );

      const requiredFields = {
        id,
        mobileNo,
        otp,
        deviceToken
      };
      const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
      if (requestDataValid !== true)
        throw { status: 400, message: requestDataValid };
      const currentDateAndTime = getCurrentDateAndTime();
      const [otpData, mobileData] = await Promise.all([
        Otp.findOne({ mobileNo, otp }),
        User.findOne({ _id: id, mobileNo, isDeleted: false }),
      ]);
      if (!otpData)
        throw { status: 404, message: 'Invalid otp. Please try again' };
      if (!mobileData) throw { status: 404, message: 'No account found' };

      let data = await User.findOneAndUpdate(
        {
          _id: id,
        },
        {
          $set: {
            isMobileVerified: true,
            status: 1,
            updatedAt: currentDateAndTime,
            deviceToken:deviceToken,
          },
        },
        { new: true },
      );
      data = JSON.parse(JSON.stringify(data));
      const { accessToken, refreshToken } = AuthMiddleware.issueAuthTokens(
        data._id,
      );
      data.accessToken = accessToken;
      data.refreshToken = refreshToken;
      data.isFreeTrialActive = checkFreeTrialAccess(data.createdAt)
      Logger.info('Signup Otp Verification Success');
      res
        .status(200)
        .send({ status: 1, message: 'Otp Verification Success', data });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      let { mobileNo ,isTrueCaller,deviceToken} = Object.assign(req.body, req.query, req.params);

      const requiredFields = {
        mobileNo,
        isTrueCaller
      };

      if(isTrueCaller===1 && !deviceToken ) throw { status: 400, message: 'Device token is missing' };

    
      const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
      if (requestDataValid !== true)
        throw { status: 400, message: requestDataValid };

      let data = await User.findOne({ status: 1, mobileNo, isDeleted: false });
       

      if (!data) throw { status: 404, message: 'No account found!' };
let data1
if(isTrueCaller===1){
    data1 = await User.findOneAndUpdate(
        {
          _id: data._id,
        },
        {
          $set: {
            isMobileVerified: true,
            deviceToken:deviceToken
          },
        },
        { new: true },
      );


      //Sending Mobile Sms
      data1 = JSON.parse(JSON.stringify(data1));

      if(isTrueCaller===1 && data1){
        const { accessToken, refreshToken } = AuthMiddleware.issueAuthTokens(
          data._id,
        );
        data1.accessToken = accessToken;
        data1.refreshToken = refreshToken;
        data1.isFreeTrialActive = checkFreeTrialAccess(data.createdAt)
        Logger.info('Login with  TrueCaller Success');
        res
          .status(200)
          .send({ status: 1, message: 'Login with  TrueCaller Success', data1 });
      
      }
    }else{
      const otp = AppUtils.generateOtp();
      await AppUtils.sendMobileSms({ mobileNo, otp });
      res
        .status(200)
        .send({
          status: 1,
          message: 'Otp sent successfully to mobile number',
          data: { mobileNo },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async verifyLoginOtp(req, res, next) {
    try {
      let { mobileNo, otp ,deviceToken} = Object.assign(req.body, req.query, req.params);

      const requiredFields = {
        mobileNo,
        otp,
        deviceToken
      };
      const requestDataValid = AppUtils.isRequestDataValid(requiredFields);
      if (requestDataValid !== true)
        throw { status: 400, message: requestDataValid };
      const currentDateAndTime = getCurrentDateAndTime();

      const [otpData, mobileData] = await Promise.all([
        Otp.findOne({ mobileNo, otp }),
        User.findOne({ status: 1, mobileNo, isDeleted: false }),
      ]);

   
      if (!otpData)
        throw { status: 404, message: 'Invalid otp. Please try again' };
      if (!mobileData) throw { status: 404, message: 'No account found' };

      let data = await User.findOneAndUpdate(
        {
          _id: mobileData._id,
        },
        {
          $set: {
            isMobileVerified: true,
            deviceToken:deviceToken
          },
        },
        { new: true },
      );

      data = JSON.parse(JSON.stringify(data));
      const { accessToken, refreshToken } = AuthMiddleware.issueAuthTokens(
        data._id,
      );
      data.accessToken = accessToken;
      data.refreshToken = refreshToken;
      data.isFreeTrialActive = checkFreeTrialAccess(data.createdAt)
      Logger.info('Login Otp Verification Success');
      res
        .status(200)
        .send({ status: 1, message: 'Otp Verification Success', data });
    } catch (error) {
      next(error);
    }
  }

  static async editProfile(req, res, next) {
    try {
      let {
        profileImageUrl

      } = Object.assign(req.body, req.query, req.params)

      let requiredFields = {

      }

      let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
      if (requestDataValid !== true) throw Error(requestDataValid);

      const userId = req.userId;
      let data = await User.findOneAndUpdate({ _id: userId }, { $set: { profileImageUrl } }, { new: true });
      data = JSON.parse(JSON.stringify(data));
      data.isFreeTrialActive = checkFreeTrialAccess(data.createdAt)
      Logger.info('Updating profile success');
      res
        .status(200)
        .send({ status: 1, message: 'Profile updated successfully!', data });
    } catch (error) {
      next(error);
    }
  }

  static async fetchProfile(req, res, next) {
    try {
      let data = req.user;
      data = JSON.parse(JSON.stringify(data));
      data.isFreeTrialActive = checkFreeTrialAccess(data.createdAt)
      Logger.info('Fetching profile success');
      res
        .status(200)
        .send({ status: 1, message: 'Profile Fetched successfully!', data });
    } catch (error) {
      next(error);
    }
  }

  static async getQuizContentsListByUser(req, res, next) {
    try {


      let {
        quizCategoryId,
        quizContentId,
        date,
        limit,
        skip,
        page

      } = Object.assign(req.body, req.query, req.params)

      let requiredFields = {
        quizCategoryId
      }

      let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
      if (requestDataValid !== true) throw Error(requestDataValid);

      limit = limit ? parseInt(limit) : 50
      page = page ? parseInt(page) : 1
      skip = parseInt(limit) * parseInt(page - 1)
      let userId = req.user._id;

      let categoryData = await QuizCategory.findOne({ _id: quizCategoryId });
      if (!categoryData) throw { status: 404, message: "No quiz category found!" }

      let matchDbFilters = {
        quizCategoryId: new mongoose.Types.ObjectId(quizCategoryId)
      }
      if (quizContentId) {
        let contentData = await QuizContent.findOne({ _id: quizContentId });
        if (!contentData) throw { status: 404, message: "No content found!" }
        matchDbFilters._id = mongoose.Types.ObjectId(quizContentId)
      }
      // if (date) matchDbFilters.date = date;

      let totalDataCount = await QuizContent.find(matchDbFilters).countDocuments();
      let data = await QuizContent.aggregate([
        {
          $match: matchDbFilters
        },
        {
          $sort: {
            date: -1
          }
        },
        {
          $lookup: {
            from: "userquizlogs",
            let: { quizContentId: "$_id", userId: new mongoose.Types.ObjectId(userId) },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$userId", "$$userId"] }, { $eq: ["$quizContentId", "$$quizContentId"] }] } } },
              { $project: { _id: 1 } }
            ],
            as: "userLogs"
          }
        },
        {
          $addFields: {
            isRead: { $gt: [{ $size: "$userLogs" }, 0] }
          }
        },
        {
          $project: {
            _id: 1,
            date: 1,
            quizCategoryId: 1,
            content: 1,
            isDeleted: 1,
            isRead: 1,
            questions: 1
          }
        },
        { $skip: skip },
        { $limit: limit }
      ])
      res.status(200).send({ status: 1, message: "Quiz content fetched successfully!", totalDataCount, currentPageCount: data.length, data })
    }
    catch (error) {
      next(error)
    }
  }

  static async readQuizContent(req, res, next) {
    try {

      let {
        quizContentId

      } = Object.assign(req.body, req.query, req.params)

      let requiredFields = {
        quizContentId
      }

      let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
      if (requestDataValid !== true) throw Error(requestDataValid);

      let contentData = await QuizContent.findOne({ _id: quizContentId });
      if (!contentData) throw { status: 404, message: "No content found!" }

      let data = await UserQuizLogs.findOneAndUpdate(
        {
          userId: req.user._id, quizContentId, quizCategoryId: contentData.quizCategoryId
        },
        {
          userId: req.user._id, quizContentId, quizCategoryId: contentData.quizCategoryId, createdAt: getCurrentDateAndTime(),
          updatedAt: getCurrentDateAndTime()
        },
        {
          new: true, upsert: true
        })
      if (!data) throw { status: 422, message: "Unable to store. Try again" }
      res.status(200).send({ status: 1, message: "Quiz content logged successfully!", data })
    }
    catch (error) {
      next(error)
    }
  }

  static async createTicket(req, res, next) {
    try {

      let {
        issueType,
        description,
        ticketNumber

      } = Object.assign(req.body, req.query, req.params)

      let requiredFields = {
        issueType,
        description
      }

      let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
      if (requestDataValid !== true) throw Error(requestDataValid);
      const userId = req.userId;
      if (![1, 2, 3].includes(issueType)) throw { status: 400, message: "Please provide a valid issuetype." }

      const lastTicketNumber = await Ticket.findOne({}).sort({ ticketNumber: -1 });
      if (!lastTicketNumber) ticketNumber = 1;
      else ticketNumber = lastTicketNumber.ticketNumber + 1;

      const data = await Ticket.create({
        userId,
        ticketNumber,
        issueType, description,
        createdAt: getCurrentDateAndTime(),
        updatedAt: getCurrentDateAndTime()
      })
      if (!data) throw { status: 422, message: "Unable to add ticket. Try again" }

      Logger.info('Ticket added successfully')
      res.status(200).send({ status: 1, message: "Ticket added successfully!", data })
    }
    catch (error) {
      next(error)
    }
  }

  static async fetchTickets(req, res, next) {
    try {

      let {
        id,
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
      const userId = req.userId;

      limit = limit ? parseInt(limit) : 50
      page = page ? parseInt(page) : 1
      skip = parseInt(limit) * parseInt(page - 1)

      const dbQuery = { userId };
      if (id) dbQuery._id = id;
      if (status == 0 || status == 1) dbQuery.status = status;
      if (issueType) dbQuery.issueType = issueType;
      if (ticketNumber) dbQuery.ticketNumber = ticketNumber;


      const data = await Ticket.find(dbQuery).sort({ ticketNumber: -1 }).limit(limit).skip(skip);
      const totalDataCount = await Ticket.find(dbQuery).countDocuments();
      Logger.info('Tickets fetched successfully')
      res.status(200).send({ status: 1, message: "Tickets fetched successfully!", totalDataCount, currentPageCount: data.length, data })
    }
    catch (error) {
      next(error)
    }
  }

  static async deleteTicket(req, res, next) {
    try {

      let {
        id

      } = Object.assign(req.body, req.query, req.params)

      let requiredFields = {
        id
      }

      let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
      if (requestDataValid !== true) throw Error(requestDataValid);
      const userId = req.userId;

      const data = await Ticket.findOneAndDelete({ userId, _id: id });
      Logger.info('Tickets deleted successfully')
      res.status(200).send({ status: 1, message: "Tickets deleted successfully!", data: {} })
    }
    catch (error) {
      next(error)
    }
  }

  static async storeUserActivityLog(req, res, next) {
    try {
      let {
        activity

      } = Object.assign(req.body, req.query, req.params)

      let requiredFields = {
        activity
      }

      let requestDataValid = AppUtils.isRequestDataValid(requiredFields, req.reqId)
      if (requestDataValid !== true) throw Error(requestDataValid);

      const activities = [
        "user_login",
        "viewed_job_alerts",
        "test_series_attempted",
        "test_series_submitted",
        "current_affairs_viewed",
        "quiz_viewed",
        "fundamental_finaltest_viewed",
        "fundamental_finaltest_submitted",
        "fundamental_material_viewed",
        "fundamental_material_submitted",
        "course_finaltest_viewed",
        "course_finaltest_submitted",
        "course_material_viewed",
        "course_material_submitted"
      ];
      if (!activities.includes(activity.trim().toLowerCase())) throw { status: 400, message: "Please provide a valid activity" }
      const currentDate = getCurrentDateAndTime();
      const data = await UserActivityLogs.create({ userId: req.user._id, activity: activity.trim().toLowerCase(), createdAt: currentDate, updatedAt: currentDate });
      if (!data) throw { status: 422, message: "Unable to log the activity. Try again" }

      Logger.info('Activity logged successfully!')
      res.status(201).send({ status: 1, message: "Activity logged successfully!", data })
    }
    catch (error) {
      next(error)
    }
  }
}

export default UserController;
