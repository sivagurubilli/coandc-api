const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkWhatsappNumberValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            whatsappNumber: Joi.number().integer().min(1000000000).max(9999999999).strict().required()
                .messages({
                    'number.base': 'whatsappNumber must be a number',
                    'number.integer': 'whatsappNumber must be an integer',
                    'number.min': 'whatsappNumber must be a 10-digit number',
                    'number.max': 'whatsappNumber must be a 10-digit number',
                    'any.required': 'whatsappNumber is required',
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