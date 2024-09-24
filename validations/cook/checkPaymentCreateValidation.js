const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkPaymentCreateValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            cookPlanId: Joi.string().trim().required()
                .messages({
                    'string.required': 'cook Plan Id is required',
                    'string.empty': 'Please enter your cookID'
                }),
            discount: Joi.number().integer().min(0).required().messages({
                'number.integer': 'Discount must be an integer',
                'number.base': 'Discount must be a number',
                'number.required': "Discount is required",
                'number.empty': 'Discount  must not be empty',
                'number.min': 'Discount must greater than 0'
            }),
            address: Joi.string().trim().allow("").regex(/^[a-zA-Z0-9 .,'#-]{1,100}$/).messages({
                'string.pattern.base': 'Please enter a valid address',
                'string.empty': 'Please provide address',
                'string.max': 'address must not exceed 100 characters',
                'string.min': 'address must have at least 1 character'
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