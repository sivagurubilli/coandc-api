const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.editReqValidation = async (req, res, next) => {
    try {
        const user = req.user;
        const schema = Joi.object({
            id: Joi.string().trim().required().messages({
                'string.pattern.base': 'Please enter valid id',
                'string.empty': 'Please enter id',
                'any.required': 'Please enter id',
            }),
            jobType: Joi.number().integer().strict().valid(1, 2, 3).messages({
                'number.integer': 'jobType must be an integer',
                'number.base': 'jobType must be a number',
                'any.only': 'Invalid jobtype value'
            }),
            status: Joi.number().integer().strict().valid(0, 1, 2).messages({
                'number.integer': 'status must be an integer',
                'number.base': 'status must be a number',
                'number.empty': 'Please provide status value',
                'any.only': 'Invalid status value'
            }),
            preferredGender: Joi.number().integer().strict().valid(1, 2, 3).messages({
                'number.integer': 'preferred gender must be an integer',
                'number.base': 'Preferred gender must be a number',
                'any.only': 'Invalid preferred gender value'
            }),
            breakfast: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'breakfast must be an integer',
                'number.base': 'breakfast must be a number',
                'any.only': 'Invalid breakfast value'
            }),
            dinner: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'dinner must be an integer',
                'number.base': 'dinner must be a number',
                'any.only': 'Invalid dinner value'
            }),
            lunch: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'lunch must be an integer',
                'number.base': 'lunch must be a number',
                'any.only': 'Invalid lunch value'
            }),
            vesselWash: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'vesselWash must be an integer',
                'number.base': 'vesselWash must be a number',
                'any.only': 'vesselWash must be either 0 or 1 in integer formats'
            }),
            urgency: Joi.string().trim().messages({
                'number.empty': 'Please enter your urgency',
            }),
            minimumPayment: Joi.string().trim().regex(/^[a-zA-Z0-9\s]+$/).min(4).messages({
                'string.pattern.base': 'Please enter valid minimum payment',
                'string.min': 'Minimum payment must have at least 4 characters',
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