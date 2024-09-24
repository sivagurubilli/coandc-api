'use strict'

var multer = require('multer');
var axios = require('axios');
var multerS3 = require('multer-s3');
var crypto = require('crypto');
var pug = require("pug");
const path = require("path");
const config = require('../config/config')
const { fatSecret } = config;
const emailTemplates = path.resolve(__dirname, "../views/emailTemplates/");
let appStatic = require('../config/appStatic.js').data
var s3Uploader = multer({
  storage: multerS3(config.multerStorage),
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('file');
var localUploader = multer({ storage: multer.diskStorage(config.localStorage) }).single('file')
var { xml2js, parseString } = require('xml2js');
var fs = require('fs');
var Handlebars = require('handlebars');
const { isNullOrUndefined } = require('util');
const { firebaseAdm } = require("../config/config");
var notify = firebaseAdm.messaging();
const moment = require('moment');
const puppeteer = require('puppeteer');
const { promisify } = require('util')
const models = require('../models');
let { EmailLogs, SmsLogs, CookVerify, User, Otp, Payment, Notification, CronTask, EmployerVerify, Ticket } = models;
const { listeners } = require('process');
const component = 'appUtils';
const AWS = require('aws-sdk');
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const ses = new AWS.SES({ region: 'us-east-1' });
const { v4: uuidv4 } = require('uuid');
const { environment } = require("../config/config");
const { getCurrentDateAndTime } = require("../helpers/dates");

let functions = {}
functions.responseJson = (status, responseCode, data, message, error, dataCount, totalDataCount, isNew) => {
  let err = {}
  if (error) {
    if (error.status || error.error) {
      err = { ...error }
    } else {
      err.message = error.message
      err.data = JSON.stringify(error, Object.getOwnPropertyNames(error)).slice(0, 240)
    }
  }
  return { status, responseCode, data, message, error: err, dataCount, totalDataCount, isNew }
}

// functions.encryptData1 = (dataToEncrypt, reqId) => {
//   try {
//     if (typeof dataToEncrypt == 'object') {
//       dataToEncrypt = JSON.stringify(dataToEncrypt)
//     }

//     crypt.setKey(config.privateKey);
//     let encryptedStr = crypt.encrypt(dataToEncrypt);
//     return encryptedStr
//   } catch (e) {
//     functions.logger(component, reqId, 'error', e.message, { stack: e.stack })
//     throw e
//   }
// }

// functions.decryptData = (encryptedData) => {
//   try {
//     crypt.setPrivateKey(config.privateKey);
//     const decryptedStr = crypt.decrypt(encryptedData);
//     return decryptedStr
//   } catch (e) {
//     functions.logger(component, reqId, 'error', e.message, { stack: e.stack })
//     throw e
//   }
// }

functions.uploadFile = async (req, res) => {
  return new Promise((resolve, reject) => {
    s3Uploader(req, res, function (err) {
      if (err) {
        console.log("Error", err)
        reject(err)
      } else if (!req.file) {
        reject(Error('Something went wrong'))
      } else {
        resolve(req.file)
      }
    })
  })
}



functions.firstCapital = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

functions.convertDateFormat = (originalDate) => {
  const parts = originalDate.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    // Create a new Date object with the parts and format it as "YYYY-MM-DD"
    const convertedDate = new Date(`${year}-${month}-${day}`).toISOString().split('T')[0];
    return convertedDate;
  } else {
    console.error('Invalid date format:', originalDate);
    return null;
  }
}

functions.sendNotice = async (params) => {
  try {
    let { title, options, body, userToken, userId, data } = params

    var payload = {
      notification: {
        title,
        body: body
      },
      data
    };

    console.log({ userToken, payload, options }, 'before sending notifications')
    let resp = await notify.sendToDevice(userToken, payload, options)
    console.log({ resp }, 'after sending notifications')

    // let notifyData = new Notification({
    //   title,
    //   body,
    //   userId
    // })
    // notifyData = await notifyData.save()
    // console.log({ notifyData }, 'data after saving notifications')
    return resp
  } catch (e) {
    console.log({ e })
    throw e
  }
}



functions.generateOtp = () => {
  var digits = "0123456789112";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  OTP = (environment == 'prod') ? OTP : "111111";
  return OTP;
}


functions.generateWhatsappOtp = () => {
  var digits = "0123456789112";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  OTP = (environment == 'prod') ? OTP : "1111";
  return OTP;
}
functions.generateRandomString = (length) => {
  const uuid = uuidv4().replace(/-/g, '');
  return uuid.slice(0, length);
}
//For generating dynamic numbers
functions.generateDynamicUniqueNumber = (length) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(randomNumber).padStart(length, '0');
}

functions.formatNumberWithLeadingZeros = (number) => {
  return number < 10000 ? String(number).padStart(4, '0') : String(number);
};

functions.generateReferralCode = async (body) => {
  try {

    let { level } = body;
    if (!level) throw Error("Level is not generated")
    level = functions.formatNumberWithLeadingZeros(level);
    const maxLength = 15;
    let referralCode = `L${level}R`;
    const referralcodeLength = parseInt(referralCode.length);
    const randomNumber = functions.generateDynamicUniqueNumber(maxLength - referralcodeLength);
    referralCode = `L${level}R${randomNumber}`;
    const checkReferral = await User.findOne({ referralCode: referralCode });
    if (checkReferral) await functions.generateReferralCode({ level });
    return referralCode;
  }
  catch (e) {
    throw e
  }
}

functions.sendOtp = async (body) => {
  try {
    let { mobile, templateId, senderId, message, otp, role, type, employerId, cookId } = body
    if (!mobile) throw Error('mobileNo not found')
    if (!templateId) throw Error('templateId not found')
    if (!senderId) throw Error('senderId not found')
    if (!message) throw Error('message not found')
    if (!role) throw Error('role not found')

    let {
      url,
      api_key,
    } = config.smsApi

    let smsUrl = `https://2factor.in/API/V1/${api_key}/SMS/${mobile}/${otp}/${templateId}`
    let smsRes = (environment == "prod") ? await axios.get(smsUrl) : { data: {} }
    let otpRes;
    if (role == "cook") otpRes = await CookVerify.findOneAndUpdate({ mobile }, { cookId, otp, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { new: true, upsert: true, useFindAndModify: false });
    else if (role == "employer") otpRes = await EmployerVerify.findOneAndUpdate({ mobile }, { employerId, otp, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { new: true, upsert: true, useFindAndModify: false });
    let smsLogRes = await SmsLogs.create({ mobile, type, senderId: null, message: otp, templateId, response: JSON.stringify(smsRes.data), createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() });
  } catch (e) {
    throw e
  }
}

functions.sendWhatsappSms = async (body) => {
  let { countryCode, phoneNumber, type, template, role, otp, cookId, employerId } = body
  if (!phoneNumber) throw Error('phoneNumber not found')
  if (!countryCode) throw Error('countryCode not found')
  if (!type) throw Error('type not found')
  if (!template) throw Error('templateData not found')

  let {
    url,
    api_key,
  } = config.whatsapp

  console.log(url, api_key)


  let whatsappRes = (environment == "prod") ? await axios.post(url, { countryCode, phoneNumber, type, template }, {
    headers: { Authorization: `Basic ${api_key}` }
  }) : { data: { result: true } }
  if (whatsappRes && whatsappRes.data.result == true) {
    let otpRes;
    if (otp) {
      if (role == "cook") otpRes = await CookVerify.findOneAndUpdate({ whatsapp: phoneNumber, cookId }, { otp, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { new: true, upsert: true, useFindAndModify: false });
      else if (role == "employer") otpRes = await EmployerVerify.findOneAndUpdate({ whatsapp: phoneNumber, employerId }, { otp, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { new: true, upsert: true, useFindAndModify: false });
    }
    return true
  }
  return false;
}

functions.sendMail = async (mailData) => {
  let { projectName, project } = config
  const emailFilePath = path.join(emailTemplates, `${mailData.type}.pug`);
  mailData.options.project = project
  mailData.options.projectName = projectName
  let html = pug.renderFile(emailFilePath, mailData.options)
  let subject = mailData.subject;

  let attachments = []
  if (mailData.options && mailData.options.attachments && mailData.options.attachments.length) {
    attachments = mailData.options.attachments
  }

  let from = config.supportEmail
  const mailOptions = {
    from, // sender address
    to: mailData.to, // list of receivers
    subject, // Subject line
    html,
    attachments
  };
  if (mailData.cc) mailOptions.cc = mailData.cc;
  if (environment == "prod") {
    return config.mailer.sendMail(mailOptions, function (err, info) {
      if (err) console.log({ MailError: err })
      console.log({ mailRes: info })
      return info
    });
  }
  else if (environment != "prod") return {};
}


functions.sendEmailOtp = async (mailData) => {
  let { cookId, email, subject, sender, type, role, employerId } = mailData;
  let otp = functions.generateRandomString(15);
  let message = `Your otp for account verification is ${otp}`
  let emailLogsData = await EmailLogs.create({ email, message: otp, subject, sender: null, type, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() });
  if (role == "cook") await CookVerify.findOneAndUpdate({ email, cookId }, { otp, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { new: true, upsert: true, useFindAndModify: false });
  if (role == "employer") await EmployerVerify.findOneAndUpdate({ email, employerId }, { otp, createdAt: getCurrentDateAndTime(), updatedAt: getCurrentDateAndTime() }, { new: true, upsert: true, useFindAndModify: false });

}





functions.invoiceGen = async (body) => {
  try {
    const { s3, bucket } = config.multerStorage;
    const html = fs.readFileSync(path.resolve(__dirname, `../views/invoiceTemplates/${body.fileName}`), 'utf8');
    const template = Handlebars.compile(html);
    const finalHtml = template(body);
    const fileName = `invoice-${body.invoiceNumber}.pdf`;
    const pdf = await functions.generatePDF(finalHtml);
    const invoiceLink = await functions.savePdf(pdf, fileName, `invoices/${environment}/${fileName}`);
    return invoiceLink.Location;
  } catch (error) {
    throw error;
  }
};

functions.resumeGen = async (body) => {
  try {
    const template = Handlebars.compile(body.template);
    delete body.template;
    const finalHtml = template(body);
    const fileName = `resume-${Math.floor((new Date()).getTime() / 1000)}.pdf`;
    const pdf = await functions.generatePDF(finalHtml);
    const invoiceLink = await functions.savePdf(pdf, fileName, `resume/${environment}/${fileName}`);
    return invoiceLink.Location;
  } catch (error) {
    throw error;
  }
};





// functions.resumeGen = async (body) => {
//   try {
// const { s3, bucket } = config.multerStorage;
// const html = fs.readFileSync(path.resolve(__dirname, "../views/resumeTemplates/templateTwo.html"), 'utf8');
// const template = Handlebars.compile(html);
// const finalHtml = template(body);
// const fileName = `resume-${Math.floor((new Date()).getTime() / 1000)}`;
// // // Convert HTML to DOCX
// // console.log({ finalHtml })
// // const docxBuffer = htmlToDocx(finalHtml);
// // return docxBuffer;

// const extractedText = functions.extractTextFromHTML(finalHtml);
// functions.generateDocxFromText(extractedText, `${fileName}.docx`);

// const pdfBuffer = await functions.generatePDF(finalHtml);
// const resumePdfLink = await functions.savePdf(pdfBuffer, `${fileName}.pdf`, `resumes/${environment}/${fileName}.pdf`);
// return { resumePdfLink: resumePdfLink.Location }
//   } catch (error) {
//     throw error;
//   }
// };



functions.generatePDF = async (html = "") => {
  console.log({ environment })
  // let launchConfig = environment == 'local' ? {} : {
  //   executablePath: '/usr/bin/chromium-browser'
  // }
  // console.log({ launchConfig })

  const browser = await puppeteer.launch({ headless: "new" });
  let page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ printBackground: true });
  await page.close();
  if (browser != null) {
    await browser.close();
  }
  return pdfBuffer;
}


functions.savePdf = async (bufferData, fileName, key, contentType) => {
  try {
    if (!contentType) contentType = 'application/pdf';
    const { s3, bucket } = config.multerStorage
    return await s3.upload({
      Bucket: bucket,
      Key: key,
      Body: bufferData,
      contentType,
      ServerSideEncryption: 'AES256'
    }).promise();
  } catch (e) {
    throw e
  }
}

functions.localFileS3 = (body) => {
  return new Promise((resolve, reject) => {
    try {
      let { filePath, fileName, fileOrignalPath } = body
      if (!filePath) throw Error('filePath is required')
      if (!fileName) throw Error('fileName is required')
      if (!fileOrignalPath) throw Error('fileOrignalPath is required')

      let { s3, bucket } = config.multerStorage

      fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        const params = {
          Bucket: bucket, // pass your bucket name
          Key: `invoices/${fileName}`, // file will be saved as testBucket/contacts.csv
          Body: data,
          contentType: 'application/pdf'
        };
        s3.upload(params, function (s3Err, data) {
          if (s3Err) reject(s3Err)
          console.log(data, 'data')
          if (data && data.Location) {
            console.log(filePath, 'filepat')
            fs.unlink(filePath, (err, res) => {
              console.log(err, res, 'fs')
              fs.unlink(fileOrignalPath, (err, res) => {
                console.log(err, res, 'fs2')
              })
            })
            resolve(data.Location)
          } else {
            fs.unlink(filePath, (err, res) => {
              reject('Upload failed')
            })
          }
        });
      });
    } catch (error) {
      console.log(error, 'ewrror')
      reject(error)
    }
  })
}

functions.isRequestDataValid = (body) => {
  try {
    let params = body;
    if (typeof params !== 'object') {
      throw Error('not an object')
    }

    let invalidKeys = [];
    let invalidValues = [];

    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        // Check if the value is a string (to avoid errors for non-string values)
        if (typeof params[key] === 'string') {
          params[key] = params[key].trim();
        }
      }
    }

    for (let [key, value] of Object.entries(params)) {
      if (isNullOrUndefined(params[key])) {
        invalidKeys.push(key)
      }
      else if (!value && typeof value !== 'number' && typeof value !== 'boolean') {
        invalidValues.push(key)
      }
    }

    if (invalidKeys.length) {
      return `${invalidKeys[0]} is a required field`
    } else if (invalidValues.length) {
      return `${invalidValues[0]} getting blank value`
    }
    else return true
  } catch (e) {
    throw e
  }
}

functions.getMilisecondsFromDateTime = (date, time, reqId) => {
  return new Date(`${date} ${time}`).getTime();
}


// functions.logger = (component, reqId, level, message, options) => {
//   let color = {
//     info: "\x1b[34m", // blue
//     warn: "\x1b[33m", // yellow
//     error: "\x1b[31m", // red
//     debug: "\x1b[35m", // magenta
//     log: "\x1b[32m", // green
//   }
//   let colorCode = color[level]
//   console[level](colorCode, JSON.stringify({
//     component,
//     level,
//     message,
//     timeStamp: new Date(),
//     reqId,
//     message
//   }));
// }

functions.getNextTicketNumber = async (modelName, fieldName) => {
  let ticketNumber = 10;

  let lastRecord = await models[modelName].find({}).sort({ _id: -1 }).limit(1);
  if (lastRecord.length && lastRecord[0][fieldName]) {
    ticketNumber = parseInt(lastRecord[0][fieldName]) + 1
  }
  return ticketNumber.toString().padStart(6, "0")
};

functions.numberOfNightsBetweenDates = (startDate, endDate) => {
  var a = moment(startDate, 'MM/DD/YYYY');
  var b = moment(endDate, 'MM/DD/YYYY');
  return b.diff(a, 'days');
}



functions.sampleFirebaseToken = 'egZSBaKoQ-OSR24mL6QNxk:APA91bFPvKdMZCzqkc5SrM6J_pRCFJDqejZPSnA7aAhsX1LlCKlFM0zoSzZ6EDnckFm4pUT7PT1OuM2Via-jztL4YewagD2_iv4AOE_gQmH0dMwmYD4I-Hkg5PkxfUG1amf71BlesId9'


functions.capitalizeEveryInnerWord = (str) => {
  let words = str.split(' ');

  let capitalizedWords = words.map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  let capitalizedStr = capitalizedWords.join(' ');
  return capitalizedStr;
}

functions.decryptPaymentData = (data, workingKey) => {
  var m = crypto.createHash('md5');
  m.update(workingKey)
  var key = m.digest();
  var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  var decoded = decipher.update(data, 'hex', 'utf8');
  decoded += decipher.final('utf8');
  return decoded;
};

functions.encryptPaymentData = (data, workingKey) => {
  var m = crypto.createHash('md5');
  m.update(workingKey);
  var key = m.digest();
  var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  var encoded = cipher.update(data, 'utf8', 'hex');
  encoded += cipher.final('hex');
  return encoded;
}


functions.isActiveSubscriber = (start_date, end_date) => {
  let startDate = moment(start_date).format('YYYY-MM-DD');
  let endDate = moment(end_date).format('YYYY-MM-DD');
  let currentDate = moment(new Date()).format('YYYY-MM-DD');
  return currentDate >= startDate && currentDate <= endDate;

}



functions.isValidUser = async (userId) => {
  try {
    const userData = await User.findOne({ _id: userId, isDeleted: false })
    if (!userData) throw Error("UserId is not valid.Please Try again")
    const isActiveUser = await User.findOne({ _id: userId, isActive: true })
    if (!isActiveUser) throw Error("Your account is inactive.Please Contact support team or try subscription")
    return isActiveUser;
  }
  catch (e) {
    throw e
  }
}


functions.generateUniqueString = () => {
  const generateRandomNumber = () => Math.floor(Math.random() * 10); // Random number between 0 and 9
  const generateRandomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random capital letter (A-Z)

  let result = '';
  for (let i = 0; i < 7; i++) {
    result += generateRandomNumber();
  }
  for (let i = 0; i < 3; i++) {
    result += generateRandomLetter();
  }
  return result.trim();
}

functions.generateMemberId = (role) => {
  role = role.toLowerCase();
  let rolecode;
  if (role == "catering") rolecode = "CG";
  else if (role == "cook") rolecode = "CK";
  else if (role == "employer") rolecode = "EP";
  else if (role == "client") rolecode = "CT";
  let uniquecode = functions.generateUniqueString();
  return `CNC${rolecode}${uniquecode}`
}

functions.isValidDate = (value) => {
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime()) && date.toISOString().slice(0, 10) !== value) throw { statusCode: 500, responseCode: 2, msg: "Dob is invalid date" };
    return value;
  }
  catch (e) {
    throw e;
  }
};

functions.calculateProfileScore = (body) => {

  let { payload, scoringKeys } = body;
  let score = 0;

  for (const key in scoringKeys) {
    if (payload.hasOwnProperty(key)) {
      let value = payload[key];

      // Trim the value if it's a string
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Check if the trimmed value is an array and contains at least one element
      if (Array.isArray(value) && value.length > 0) {
        score += scoringKeys[key];
      } else if (!Array.isArray(value) && value !== null && value !== undefined) {
        if (typeof value == "string" && value !== "") {
          score += scoringKeys[key];
        }
        if (typeof value !== "string") {
          score += scoringKeys[key];
        }
      }
    }
  }
  return score
}

functions.checkValueType = (value) => {
  if (/^\d+$/.test(value)) {
    return 'number';
  } else if (typeof value === 'string') {
    // Check if it's an email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      return 'email';
    }
    return 'name';
  } else if (typeof parseInt(value) === 'number') {
    return 'number';
  } else {
    return 'unknown';
  }
}

functions.calculateDistance = (lat1, lon1, lat2, lon2, unit) => {
  var radlat1 = Math.PI * lat1 / 180
  var radlat2 = Math.PI * lat2 / 180
  var radlon1 = Math.PI * lon1 / 180
  var radlon2 = Math.PI * lon2 / 180
  var theta = lon1 - lon2
  var radtheta = Math.PI * theta / 180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180 / Math.PI
  dist = dist * 60 * 1.1515
  if (unit == "KM") { dist = dist * 1.609344 }
  if (unit == "N") { dist = dist * 0.8684 }
  return dist
}

functions.generateTicketNumber = async () => {
  let lastTicketNumber;
  let currentDate = moment().utcOffset('+05:30');
  currentDate = currentDate.format('DDMMYYYY');
  let data = await Ticket.findOne({}).sort({ ticketNumber: -1 });
  if (!data) lastTicketNumber = "000001";
  else if (data) lastTicketNumber = parseInt(data.ticketNumber) + 1;
  return lastTicketNumber.toString().padStart(6, "0");
}

functions.isDateExired = (date) => {
  const currentDate = new Date(getCurrentDateAndTime());
  const expiryDate = new Date(date);
  let status;

  if (currentDate < expiryDate) {
    status = true;
  } else {
    status = false;
  }

  console.log(status);

}


module.exports = functions;
