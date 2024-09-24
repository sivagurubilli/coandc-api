const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkAddReqValidation = async (req, res, next) => {
    try {
        const user = req.user;
        const schema = Joi.object({
            jobType: Joi.number().integer().strict().valid(1, 2, 3).required().messages({
                'number.integer': 'jobType must be an integer',
                'number.base': 'jobType must be a number',
                'number.empty': 'jobType is required',
                'any.required': 'jobType is required',
                'any.only': 'Invalid jobtype value'
            }),
            status: Joi.number().integer().strict().valid(0, 1, 2).messages({
                'number.integer': 'status must be an integer',
                'number.base': 'status must be a number',
                'number.empty': 'Please provide status value',
                'any.only': 'Invalid status value'
            }),
            preferredGender: Joi.number().integer().strict().valid(1, 2, 3).required().messages({
                'number.integer': 'preferred gender must be an integer',
                'number.base': 'Preferred gender must be a number',
                'number.empty': 'Preferred gender is required',
                'any.required': 'Preferred gender is required',
                'any.only': 'Invalid preferred gender value'
            }),
            breakfast: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'breakfast must be an integer',
                'number.base': 'breakfast must be a number',
                'number.empty': 'breakfast is required',
                'any.required': 'breakfast is required',
                'any.only': 'Invalid breakfast value'
            }),
            dinner: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'dinner must be an integer',
                'number.base': 'dinner must be a number',
                'number.empty': 'dinner is required',
                'any.required': 'dinner is required',
                'any.only': 'Invalid dinner value'
            }),
            lunch: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'lunch must be an integer',
                'number.base': 'lunch must be a number',
                'number.empty': 'lunch is required',
                'any.required': 'lunch is required',
                'any.only': 'Invalid lunch value'
            }),
            vesselWash: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'vesselWash must be an integer',
                'number.base': 'vesselWash must be a number',
                'number.empty': 'vesselWash is required',
                'any.required': 'vesselWash is required',
                'any.only': 'vesselWash must be either 0 or 1 in integer formats'
            }),
            urgency: Joi.string().trim().required().messages({
                'number.empty': 'Please enter your urgency',
                'any.required': 'urgency is required'
            }),
            minimumPayment: Joi.string().trim().regex(/^[a-zA-Z0-9\s]+$/).min(4).required().messages({
                'string.pattern.base': 'Please enter valid minimum payment',
                'string.empty': 'Please enter your minimum payment',
                'string.min': 'Minimum payment must have at least 4 characters',
                'any.required': 'Minimum payment is required',
            }),
            cuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Please enter valid cuisines',
                })
            ).min(1).required().messages({
                'array.base': 'Please enter your cuisines',
                'array.min': 'Please enter atleast one cuisine',
                'array.required': 'cuisines is required',
            })

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