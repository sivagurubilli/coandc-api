const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkCookLoginValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            emailOrMobile: Joi.string().trim().required()
                .messages({
                    'string.base': 'Please enter a valid email/ mobile number',
                    'string.empty': 'Email/Mobile number is required',
                    'string.required': 'Email/Mobile number is required',
                }),
            password: Joi.string().required().messages({
                'string.empty': 'Password must not be empty',
                'string.required': 'Password is required'
            }),
            loginIP: Joi.string().messages({
                'string.empty': 'loginIP is required ',
            }),
            loginMAC: Joi.string().messages({
                'string.empty': 'loginMAC is required ',
            }),
            deviceToken: Joi.string().messages({
                'string.empty': 'deviceToken is required ',
            }),
            webAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'webAccess must be an integer',
                'number.base': 'webAccess must be a number',
                'number.empty': 'webAccess is required',
                'any.only': 'Invalid webAccess value'
            }),
            appAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'appAccess must be an integer',
                'number.base': 'appAccess must be a number',
                'number.empty': 'appAccess is required',
                'any.only': 'Invalid appAccess value'
            }),
        }).unknown(false).messages({
            'object.unknown': 'Unknown field: "{#key}" is not allowed in payload'
        });
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