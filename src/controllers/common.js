import AWS from 'aws-sdk';
import { getLoggerWithLabel } from '../../utils/logger/logger.js';
const Logger = getLoggerWithLabel('Common_Controller');
import AuthMiddleware from "../../middlewares/authMiddleware.js";
import AppUtils from '../../utils/appUtils.js';
import { Plans } from '../models/index.js';


class CommonController {
    static async uploadFile(req, res, next) {
        try {
            if (!req.file.mimetype || !req.file.originalname) throw { status: 400, message: "Please provide a valid file." }

            const s3 = new AWS.S3({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            });

            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: req.user._id + '/' + Date.now() + req.file.originalname,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };

            const uploadToS3 = () => {
                return new Promise((resolve, reject) => {
                    s3.upload(params, function (s3Error, data) {
                        if (s3Error) {
                            reject(s3Error);
                        } else {
                            resolve(data);
                        }
                    });
                });
            };

            const data = await uploadToS3();
            res.status(200).send({ status: 200, message: "File uploaded succesfully", data: { fileUrl: data.Location } })
        }
        catch (error) {
            next(error)
        }
    }

    static async getPlansList(req, res, next) {
        try {
            let {
                id,
                name,
                upgradePlan,
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
            if (name) dbQuery.name = name;
            if (upgradePlan) dbQuery.upgradePlan = upgradePlan;

            let data = await Plans.find(dbQuery).limit(limit).skip(skip);
            let totalDataCount = await Plans.find(dbQuery).countDocuments();

            Logger.info('Plans list fetched successfully')
            res.status(200).send({ status: 1, message: "Plans list fetched successfully!", totalDataCount, currentPageCount: data.length, data })
        }
        catch (error) {
            next(error)
        }
    }
}
export default CommonController;