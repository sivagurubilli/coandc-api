const Joi = require('joi');
let { responseJson } = require("../../../utils/appUtils");

exports.checkEmployerRegisterValidation = async (req, res, next) => {
    try {
        const customFullNameValidator = (fullName) => {
            if (fullName.startsWith("'") || fullName.endsWith("'")) throw { statusCode: 500, responseCode: 2, msg: "Full Name cannot start or end with an apostrophe" };
            return fullName;
        };

        const schema = Joi.object({
            webAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'webAccess must be an integer',
                'number.base': 'Please enter your web access',
                'number.empty': 'Please enter web access',
                'any.only': 'Invalid web access'
            }),
            appAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'appAccess must be an integer',
                'number.base': 'Please enter your app access',
                'number.empty': 'Please provide app acces',
                'any.only': 'Invalid app access'
            }),
            memberType: Joi.number().integer().strict().valid(1, 2).required().messages({
                'number.integer': 'Mobile must be an integer',
                'number.base': 'Please enter a valid member type',
                'number.empty': 'Please provide member type',
                'any.required': 'Member Type is required',
                'any.only': 'Invalid member type'
            }),
            gender: Joi.when('memberType', {
                is: 1,
                then: Joi.number().valid(1, 2, 3).required().messages({
                    'number.base': 'Gender must be a number',
                    'number.empty': 'Gender is required',
                    'any.required': 'Gender is required',
                    'any.only': 'Gender must be 1,2 or 3',
                }),
                otherwise: Joi.forbidden()
            }).messages({
                'any.unknown': 'Gender is not required when user is Employer',
            }),
            fullName: Joi.string().trim().required().messages({
                'string.required': 'Name is required',
                'string.empty': 'Please provide name'
            }),
            password: Joi.string()
                .min(8)
                .max(24)
                .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?])?[\w!@#$%^&*()_+[\]{};':"\\|,.<>/?]{8,24}$/)
                .message('Please enter a valid password')
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.max': 'Password cannot exceed 24 characters',
                    'string.pattern.base': 'Please enter a valid password',
                    'string.empty': 'Please enter password',
                }),
            mobile: Joi.number().integer().min(1000000000).max(9999999999).strict().required()
                .messages({
                    'number.base': 'Please enter a valid mobile number',
                    'number.integer': 'Mobile number must be an integer',
                    'number.min': 'Mobile number must be a 10-digit number',
                    'number.max': 'Mobile number must be a 10-digit number',
                    'any.required': 'Mobile number is required',
                }),
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please enter a valid email',
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

