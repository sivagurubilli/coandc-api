var nodemailer = require('nodemailer');
let multer = require('multer')
var firebaseAdmin = require("firebase-admin");
const smtpTransport = require('nodemailer-smtp-transport');
var dotenv = require('dotenv');
dotenv.config({ path: './.env' });
let environment = "stage";
let Razorpay = require('razorpay');
let AWS = require('aws-sdk');
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const {
    firebase,
    mongoDb,
    mailer,
    smsApi,
    whatsapp,
    projectDetails,
    companyDetails,
    aws,
    privateKey,
    razorpay,
    weavy
} = require(`./${environment}.json`)
console.log({ Environment_Name: environment })


const s3 = new AWS.S3({
    secretAccessKey: aws.secretAccessKey,
    accessKeyId: aws.accessKeyId,
    region: aws.region
});

module.exports = {
    companyName: companyDetails.name,
    companyAddress: companyDetails.address,
    companyZipCode: companyDetails.pinCode,
    companyPhone: companyDetails.phone,
    companyMail: companyDetails.mail,

    project: projectDetails.project,
    projectName: projectDetails.projectName,
    frontendUrl: projectDetails.frontendUrl,
    backendUrl: projectDetails.backendUrl,
    supportEmail: projectDetails.supportEmail,
    adminEmail: projectDetails.adminEmail,
    smsApi,
    whatsapp,
    privateKey,
    multerStorage: {
        s3: s3,
        bucket: aws.bucket,
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            var newFileName = `${environment}/` + Date.now() + "-" + file.originalname.replace(/ /g, '');
            var fullPath = `${req.folder || 'litzo'}/${newFileName}`;
            cb(null, fullPath)
        }
    },
    localStorage: {
        destination: function (req, file, cb) {
            cb(null, `public/${req.folder || 'zariyaa'}`)
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname.replace(/ /g, ''))
        }
    },
    acl: {
        models: ['Enquiry', 'SubscriptionPlan'],
        roles: ['instituteAdmin', 'expert', 'user', 'admin'],
        methodMap: { get: 'L', post: 'C', put: 'U', delete: "D" },
        permissions: [
            ['LCRUD', 'LCRUD'],
            ['LCRU', 'LR'],
            ['LCRU', 'LR']
        ]
    },

    mailer: nodemailer.createTransport(smtpTransport({
        host: mailer.host,
        port: mailer.port,
        secure: true,
        auth: {
            user: mailer.username,
            pass: mailer.password,
        }
    })),
    mongoDb,
    firebaseAdm: firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(firebase.cert)
    }),
    s3,
    aws,
    environment,
    razorpay: new Razorpay({
        key_id: razorpay.key_id,
        key_secret: razorpay.key_secret,
    }),
    razorpaySecretKey: razorpay.key_secret,
    rzp: razorpay,
    chat: weavy
}
