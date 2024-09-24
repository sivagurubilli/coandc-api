const Joi = require('joi');
let { responseJson } = require('../../utils/appUtils');

exports.checkCookRegisterValidation = async (req, res, next) => {
    try {

        const customFullNameValidator = (fullName) => {
            if (fullName.startsWith("'") || fullName.endsWith("'")) throw { statusCode: 500, responseCode: 2, msg: "Full Name cannot start or end with an apostrophe" };
            return fullName;
        };

        const schema = Joi.object({
            webAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'webAccess must be an integer',
                'number.base': 'Please enter valid web access',
                'number.empty': 'webAccess must not be empty',
                'any.only': 'Invalid webAccess value'
            }),
            appAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'appAccess must be an integer',
                'number.base': 'Please enter valid app access',
                'number.empty': 'appAccess is required',
                'any.only': 'Invalid appAccess value'
            }),
            memberType: Joi.number().integer().strict().valid(1, 2).required().messages({
                'number.integer': 'Member Type must be an integer',
                'number.base': 'Member Type must be a number',
                'number.empty': 'Member Type is required',
                'any.required': 'Member Type is required',
                'any.only': 'Invalid Member type'
            }),
            partyCook: Joi.when('memberType', {
                is: 1,
                then: Joi.number().valid(0, 1).required().messages({
                    'any.only': 'Invalid Party Cook type',
                    'any.required': 'Party Cook Type is required',
                    'number.base': 'Cook Type must be a number',
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': `User cannot be a Party Cook and Catering at a time`,
            }),
            cookType: Joi.when('memberType', {
                is: 1,
                then: Joi.number().integer().valid(1, 2).strict().messages({
                    'any.only': 'Invalid Cook Type',
                    'number.base': 'Cook Type must be a number',
                    'number.integer': 'Cook Type must be an integer',

                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'User cannot be a Catering and Cook at a time',
            }),
            gender: Joi.when('memberType', {
                is: 1,
                then: Joi.number().integer().valid(1, 2, 3).strict().required().messages({
                    'number.base': 'Gender must be a number',
                    'number.empty': 'Gender must not be empty',
                    'any.required': 'Gender is required',
                    'any.only': 'Invalid gender value',
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'Gender is not allowed when user is a Catering',
            }),
            fullName: Joi.string().trim().required().messages({
                'string.required': 'Name is required',
                'string.empty': 'Please provide name'
            }),
            password: Joi.string()
                .min(8)
                .max(24)
                .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?])?[\w!@#$%^&*()_+[\]{};':"\\|,.<>/?’]{8,24}$/)
                .message('Password must be alphanumeric and 8 characters')
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.max': 'Password cannot exceed 24 characters',
                    'string.pattern.base': 'Password must be alphanumeric and 8 characters',
                    'string.empty': 'Password is required',
                    'string.required': 'Password is required'
                }),
            mobile: Joi.number().integer().min(1000000000).max(9999999999).strict().required()
                .messages({
                    'number.base': 'Mobile must be a number',
                    'number.integer': 'Mobile must be an integer',
                    'number.min': 'Mobile must be a 10-digit number',
                    'number.max': 'Mobile must be a 10-digit number',
                    'any.required': 'Mobile is required',
                }),
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Invalid email format',
                    'string.empty': 'Email is required',
                }),
            registerIP: Joi.string().required().messages({
                'string.empty': 'Please provide register IP',
                'string.required': 'Register IP is required'
            }),
            registerMAC: Joi.string().required().messages({
                'string.empty': 'Please provide register IP',
                'string.required': 'Register MAC is required'
            }),
            deviceToken: Joi.string().messages({
                'string.empty': 'Please provide device token',
            }),
        }).unknown(false).messages({
            'object.unknown': 'Unknown field: "{#key}" is not allowed in payload'
        })


        //Schema Validation
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

