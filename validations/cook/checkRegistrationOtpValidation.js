const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkRegistrationOtpValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            cookId: Joi.string().trim().required()
                .messages({
                    'string.empty': 'cookId is required',
                }),
            otp: Joi.string().trim().pattern(/^\d+$/).min(6).max(6).messages({
                'string.pattern.base': 'Please enter a valid otp',
                'string.empty': 'Otp is required',
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