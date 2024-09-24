const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.findHouseCookJobsValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            longitude: Joi.number().min(-180).max(180).allow("").messages({
                'number.base': 'Longitude must be a number',
                'number.min': 'Longitude must be greater than or equal to -180',
                'number.max': 'Longitude must be less than or equal to 180',
            }),
            latitude: Joi.number().min(-90).max(90).allow("").messages({
                'number.base': 'Latitude must be a number',
                'number.min': 'Latitude must be greater than or equal to -90',
                'number.max': 'Latitude must be less than or equal to 90',
            }),
            jobType: Joi.number().integer().strict().allow("").valid(1, 2, 3).messages({
                'number.integer': 'jobType must be an integer',
                'number.base': 'jobType must be a number',
                'any.only': 'Invalid jobtype value'
            }),
            gender: Joi.number().integer().strict().allow("").valid(1, 2, 3, 4).messages({
                'number.integer': 'Gender must be an integer',
                'number.base': 'Gender must be a number',
                'any.only': 'Invalid gender value'
            }),
            limit: Joi.number().integer().allow("").min(1).messages({
                'number.integer': 'Limit must be an integer',
                'number.base': 'Limit must be a number',
                'number.min': 'Limit must greater than 0'
            }),
            page: Joi.number().integer().allow("").min(1).messages({
                'number.integer': 'Page must be an integer',
                'number.base': 'Page must be a number',
                'number.min': 'Page must greater than 0'
            }),
            payment: Joi.string().allow(""),
            cuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Please enter valid cuisines',
                })
            ).min(1).messages({
                'array.base': 'Please enter your cuisines',
                'array.min': 'Please enter atleast one cuisine'
            }),
            sortingByCreatedAt: Joi.number().integer().valid(1, -1).allow("").strict().messages({
                'number.integer': 'Sorting By createdAt must be an integer',
                'number.base': 'Sorting By createdAt  must be a number',
                'number.empty': 'Please provide sorting by createdAt',
                'any.only': 'Please provide valid value for sorting by createdAt'
            }),
        }).unknown(false)
            .messages({
                'object.unknown': 'Unknown field: "{#key}" is not allowed in payload'
            });

        //Validating Schema
        let { error } = schema.validate(req.body);
        if (error) {
            let message = error.details[0].message;
            throw { statusCode: 400, responseCode: 2, msg: message || "Payload request error" }
        }
        else next();
    } catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Internal Server Error', e))
    }
}