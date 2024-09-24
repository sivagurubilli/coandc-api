const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.findCateringsValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            longitude: Joi.number().allow("").min(-180).max(180).messages({
                'number.base': 'Longitude must be a number',
                'number.min': 'Longitude must be greater than or equal to -180',
                'number.max': 'Longitude must be less than or equal to 180',
            }),
            latitude: Joi.number().allow("").min(-90).max(90).messages({
                'number.base': 'Latitude must be a number',
                'number.min': 'Latitude must be greater than or equal to -90',
                'number.max': 'Latitude must be less than or equal to 90',
            }),
            limit: Joi.number().integer().allow("").min(1).messages({
                'number.integer': 'Limit must be an integer',
                'number.base': 'Limit must be a number',
                'number.min': 'Limit must greater than 0'
            }),
            page: Joi.number().integer().allow("").min(1).messages({
                'number.integer': 'Page must be an integer',
                'number.base': 'Page must be a number',
                'number.min': 'Page must greater than 0'
            }),
            cuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Please enter valid cuisines',
                })
            )
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