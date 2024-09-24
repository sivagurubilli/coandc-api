const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.findChefsValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            longitude: Joi.number().allow("").min(-180).max(180).messages({
                'number.base': 'Longitude must be a number',
                'number.min': 'Longitude must be greater than or equal to -180',
                'number.max': 'Longitude must be less than or equal to 180',
            }),
            latitude: Joi.number().allow("").min(-90).max(90).messages({
                'number.base': 'Latitude must be a number',
                'number.min': 'Latitude must be greater than or equal to -90',
                'number.max': 'Latitude must be less than or equal to 90',
            }),
            minimumExperience: Joi.number().integer().allow("").min(0).max(50).messages({
                'number.integer': 'Minimum Experience must be an integer',
                'number.base': 'Minimum Experience must be a number',
                'number.min': 'Please provide a valid minimum experience',
                'number.min': 'Minimum Experience must less than or equal to 50'
            }),
            maximumExperience: Joi.number().integer().allow("").min(1).max(50).messages({
                'number.integer': 'Maximum Experience must be an integer',
                'number.base': 'Maximum Experience must be a number',
                'number.min': 'Maximum Experience must greater than or equal to 1',
                'number.min': 'Maximum Experience must less than or equal to 50'
            }),
            minimumSalary: Joi.number().integer().allow("").min(5000).max(50000000).messages({
                'number.integer': 'Minimum salary  must be an integer',
                'number.base': 'Minimum salary must be a number',
                'number.min': 'Minimum salary must greater than or equal to 5000',
                'number.max': 'Minimum salary must less than or equal to 50000000'
            }),
            maximumSalary: Joi.number().integer().allow("").min(5000).max(50000000).messages({
                'number.integer': 'Maximum salary  must be an integer',
                'number.base': 'Maximum salary must be a number',
                'number.min': 'Maximum salary must greater than or equal to 5000',
                'number.max': 'Maximum salary must less than or equal to 50000000'
            }),
            limit: Joi.number().integer().allow("").min(1).messages({
                'number.integer': 'Limit must be an integer',
                'number.base': 'Limit must be a number',
                'number.min': 'Limit must greater than 0'
            }),
            skills: Joi.string().allow(""),
            page: Joi.number().integer().allow("").min(1).messages({
                'number.integer': 'Page must be an integer',
                'number.base': 'Page must be a number',
                'number.min': 'Page must greater than 0'
            }),
            cuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Please enter valid cuisines',
                })
            )
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