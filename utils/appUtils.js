import { User, Otp, Payment } from '../src/models/index.js';
import { getCurrentDateAndTime } from '../helpers/dates.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import  firebaseAdmin from 'firebase-admin';

// Manually define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


class AppUtils {
  static isRequestDataValid(body) {
    try {
      let params = body;
      if (typeof params !== 'object' || params === null) {
        throw Error('not an object');
      }

      let invalidKeys = [];
      let invalidValues = [];

      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          if (typeof params[key] === 'string') {
            params[key] = params[key].trim();
          }
        }
      }

      for (let [key, value] of Object.entries(params)) {
        if (value == null) {
          invalidKeys.push(key);
        } else if (
          !value &&
          typeof value !== 'number' &&
          typeof value !== 'boolean'
        ) {
          invalidValues.push(key);
        }
      }

      if (invalidKeys.length) {
        return `${invalidKeys[0]} is a required field`;
      } else if (invalidValues.length) {
        return `${invalidValues[0]} getting blank value`;
      } else {
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  static generateFirstCapital(name) {
    if (typeof name !== 'string') return '';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  static capitalizeEveryStartingWord(str) {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static generateOtp() {
    if (process.env.ENVIRONMENT !== 'PRODUCTION') {
      return '11111';
    }
    if (process.env.ENVIRONMENT === 'PRODUCTION') {
      let otp = Math.floor(10000 + Math.random() * 90000);
      if (otp.toString().length !== 5) return this.generateOtp();
      return otp;
    }
  }

  static async sendMobileSms(body) {
    let { mobileNo, message, otp } = body;
    if (!mobileNo) throw Error('mobileNo not found');

    try {
      let otpRes = await Otp.findOneAndUpdate(
        { mobileNo },
        { $set: { otp, mobileNo } },
        { new: true, upsert: true },
      );
      if (!otpRes)
        throw { status: 422, message: 'Unable to send otp. Try again' };
    } catch (error) {
      throw error;
    }
  }

  static calculateAssessmentPercentage(Ques, responses, QuesCount) {
    const totalQuestions = QuesCount && QuesCount > 0 ? QuesCount : Ques.length;
    let correctAnswers = 0;

    responses = responses.map((response) => {
      const question = Ques.find(
        (q) => q._id.toString() === response.questionId.toString()
      );
      response.correctOption = question.correctOption;

      if (
        question &&
        parseInt(question.correctOption) === parseInt(response.selectedOption)
      ) {
        correctAnswers++;
        response.isAnswerCorrect = 1;
      } else if (
        question &&
        parseInt(question.correctOption) !== parseInt(response.selectedOption)
      ) {
        response.isAnswerCorrect = 0;
      }
      return response;
    });

    let percentage = (correctAnswers / totalQuestions) * 100;
    percentage = percentage ? percentage : 0;
    return { percentage, responses };
  }

  static shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static async getLatestPlanDetails(userId) {
    try {
      const latestPlan = await Payment.findOne({
        userId,
        paymentStatus: 1,
        isDeleted: false,
        planExpiresAt: {
          $gte: getCurrentDateAndTime(),
        },
      })
        .populate([{ path: 'planId', select: 'price' }])
        .sort({ createdAt: -1 });
      const previousPlanPrice = latestPlan?.planId?.price || 0;
      if (previousPlanPrice)
        return {
          latestPlanId: latestPlan?.planId?._id,
          latestPlanPrice: latestPlan?.planId?.price,
          planExpiresAt: latestPlan.planExpiresAt,
        };
      else
        throw {
          status: 402,
          message:
            "Your account doesn't have any active plan. Please purchase a plan now.",
        };
    } catch (error) {
      throw error;
    }
  }

  static generateHourlyData(data) {
    const result = [];
    const formatHour = (hour) => (hour < 10 ? `0${hour}` : `${hour}`);
    const initializeHoursForDate = (dateString) => {
      const resultEntry = {
        date: dateString,
        data: {},
      };
      for (let hour = 0; hour < 24; hour++) {
        const hourString = `${formatHour(hour)}:00 - ${formatHour(hour + 1)}:00`;
        resultEntry.data[hourString] = 0;
      }
      result.push(resultEntry);
    };

    data.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const dateString = date.toISOString().split('T')[0];
      const resultEntry = result.find((entry) => entry.date === dateString);
      if (!resultEntry) {
        initializeHoursForDate(dateString);
      }
      const hourString = `${formatHour(
        date.getUTCHours(),
      )}:00 - ${formatHour(date.getUTCHours() + 1)}:00`;
      const updatedResultEntry = result.find(
        (entry) => entry.date === dateString,
      );
      updatedResultEntry.data[hourString]++;
    });
    return result;
  }

  static async sendNotice(params) {
    try {
      let { title, body, userToken } = params;

      const payload = {
        notification: {
          title,
          body,
        },
      };

      // Function to initialize Firebase
      async function initializeFirebase() {
        // Check if Firebase has already been initialized
        if (!firebaseAdmin.apps.length) {
          const filePath = path.resolve(__dirname, '../config/staging.json');
          const fileContent = await fs.readFile(filePath, 'utf8');
          let firebaseConfig = JSON.parse(fileContent);

          if (typeof firebaseConfig === 'string') {
            try {
              // Attempt to parse `cert` if it's a string
              firebaseConfig = JSON.parse(firebaseConfig);
            } catch (error) {
              throw new Error("Failed to parse 'cert'. Ensure it is correctly formatted.");
            }
          }

          // Initialize Firebase app
          firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(firebaseConfig),
          });
        }
      }

      // Initialize Firebase and send notification
      await initializeFirebase();
      const notify = firebaseAdmin.messaging();

      const resp = await notify.sendToDevice(userToken, payload);

      console.log({ resp }, 'after sending notifications');
      return resp;
    } catch (e) {
      console.log({ e });
      throw e;
    }
  }





}

export default AppUtils;
