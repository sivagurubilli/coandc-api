const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.verifyNewMobileOtpValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            mobile: Joi.number().integer().min(1000000000).max(9999999999).strict().required()
                .messages({
                    'number.base': 'Please enter a valid mobile number',
                    'number.integer': 'Mobile number must be an integer',
                    'number.min': 'Mobile number must be a 10-digit number',
                    'number.max': 'Mobile number must be a 10-digit number',
                    'any.required': 'Mobile number is required',
                }),
            otp: Joi.string().trim().pattern(/^\d+$/).min(6).max(6).messages({
                'string.pattern.base': 'Please enter a valid otp',
                'string.empty': 'Please enter otp',
                'string.min': 'Otp must have exactly 6 digits',
                'string.max': 'Otp must have exactly 6 digits'
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