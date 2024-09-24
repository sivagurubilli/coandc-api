const Joi = require("joi");
let { responseJson } = require("../../../utils/appUtils");

exports.checkEmployerLoginValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            emailOrMobile: Joi.string().trim().required()
                .messages({
                    'string.base': 'Please enter a valid email/mobilenumber',
                    'string.empty': 'Please enter email/mobilenumber',
                }),
            password: Joi.string().required().messages({
                'string.empty': 'Please enter password',
                'string.required': 'Password is required'
            }),
            loginIP: Joi.string(),
            loginMAC: Joi.string(),
            deviceToken: Joi.string(),
            webAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'webAccess must be an integer',
                'number.base': 'Please provide a valid web access',
                'number.empty': 'Please provide web access',
                'any.only': 'Invalid web access'
            }),
            appAccess: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'appAccess must be an integer',
                'number.base': 'Please provide a valid app access',
                'number.empty': 'Please provide app access',
                'any.only': 'Invalid app access'
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