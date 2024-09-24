const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkChangeMobileValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            cookId: Joi.string().required()
                .messages({
                    'string.empty': 'Please enter your cookId',
                }),
            mobile: Joi.number().integer().min(1000000000).max(9999999999).strict().required()
                .messages({
                    'number.base': 'Mobile must be a number',
                    'number.integer': 'Mobile must be an integer',
                    'number.min': 'Mobile must be a 10-digit number',
                    'number.max': 'Mobile must be a 10-digit number',
                    'any.required': 'Mobile is required',
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