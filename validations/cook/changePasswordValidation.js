const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.changePasswordValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            oldPassword: Joi.string().required().messages({
                'string.empty': 'Old password must not be empty',
                'string.required': 'Old password is required'
            }),
            newPassword: Joi.string()
                .min(8)
                .max(24)
                .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?])?[\w!@#$%^&*()_+[\]{};':"\\|,.<>/?]{8,24}$/)
                .message('New Password must be alphanumeric and 8 characters')
                .required()
                .messages({
                    'string.min': 'New password must be at least 8 characters long',
                    'string.max': 'New password cannot exceed 24 characters',
                    'string.pattern.base': 'Please provide a valid new password',
                    'string.empty': 'Please provide new password',
                    'string.required': 'Please provide new password'
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