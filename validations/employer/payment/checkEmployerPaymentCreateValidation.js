const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkEmployerPaymentCreateValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            employerPlanId: Joi.string().trim().required()
                .messages({
                    'string.required': 'Employer Plan Id is required',
                    'string.empty': 'Please provide valid employer plan'
                }),
            discount: Joi.number().integer().min(0).required().messages({
                'number.integer': 'Discount must be an integer',
                'number.base': 'Please enter a valid disoount',
                'number.required': "Discount is required",
                'number.empty': 'Please enter your disocount',
                'number.min': 'Discount must greater than 0'
            }),
            supportAssistance: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'supportAssistance must be an integer',
                'number.base': 'Please provide a valid support assistance',
                'number.empty': 'supportAssistance is required',
                'any.required': 'supportAssistance is required',
                'any.only': 'Invalid support assistance provided'
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