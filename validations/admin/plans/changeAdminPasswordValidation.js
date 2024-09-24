const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.changeAdminPasswordValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            otp: Joi.string().trim().pattern(/^\d+$/).min(6).max(6).required().messages({
                'string.pattern.base': 'Please enter a valid otp',
                'string.empty': 'Please provide otp',
                'string.required': 'Please provide otp',
                'string.min': 'Otp must have exactly 6 digits',
                'string.max': 'Otp must have exactly 6 digits'
            }),
            password: Joi.string()
                .min(8)
                .max(24)
                .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?])?[\w!@#$%^&*()_+[\]{};':"\\|,.<>/?]{8,24}$/)
                .message('New Password must be alphanumeric and 8 characters')
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.max': 'Password cannot exceed 24 characters',
                    'string.pattern.base': 'Please provide a valid password',
                    'string.empty': 'Please provide password',
                    'string.required': 'Please provide password'
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