const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkEditEmployerPlanValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required().messages({
                'string.empty': 'id is required',
                'string.required': 'id must not be empty'
            }),
            status: Joi.number().integer().valid(0, 1).strict().messages({
                'number.integer': 'status must be an integer',
                'number.base': 'status must be a number',
                'number.empty': 'status must not be empty',
                'any.only': 'status must be either 0 or 1'
            }),
            employerPlanName: Joi.string().messages({
                'string.empty': 'employerPlanName is required',
                'string.required': 'employerPlanName must not be empty'
            }),
            validityInDays: Joi.number().integer().min(1).messages({
                'number.integer': 'validityInDays  must be an integer',
                'number.base': 'validityInDays must be a number',
                'number.empty': 'validityInDays  must not be empty',
                'number.min': 'validityInDays must greater than 0'
            }),
            jobPoints: Joi.number().integer().min(1).messages({
                'number.integer': 'jobPoints  must be an integer',
                'number.base': 'jobPoints must be a number',
                'number.empty': 'jobPoints  must not be empty',
                'number.min': 'jobPoints must greater than 0'
            }),
            profileViewPoints: Joi.number().integer().min(1).messages({
                'number.integer': 'profileViewPoints  must be an integer',
                'number.base': 'profileViewPoints must be a number',
                'number.empty': 'profileViewPoints  must not be empty',
                'number.min': 'profileViewPoints must greater than 0'
            }),
            responsePoints: Joi.number().integer().min(1).messages({
                'number.integer': 'responsePoints  must be an integer',
                'number.base': 'responsePoints must be a number',
                'number.empty': 'responsePoints  must not be empty',
                'number.min': 'responsePoints must greater than 0'
            }),
            supportAssistance: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'supportAssistance must be an integer',
                'number.base': 'supportAssistance must be a number',
                'number.empty': 'supportAssistance must not be empty',
                'any.only': 'supportAssistance must be either 0 or 1 in integer formats'
            }),
            refundPolicy: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'refundPolicy must be an integer',
                'number.base': 'refundPolicy must be a number',
                'number.empty': 'refundPolicy must not be empty',
                'any.only': 'refundPolicy must be either 0 or 1 in integer formats'
            }),
            assistancePrice: Joi.when('supportAssistance', {
                is: 0,
                then: Joi.number().integer().min(1).required().messages({
                    'number.integer': 'assistancePrice  must be an integer',
                    'number.base': 'assistancePrice must be a number',
                    'number.required': "assistancePrice is required",
                    'number.empty': 'assistancePrice  must not be empty',
                    'number.min': 'assistancePrice must greater than 1'
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'assistancePrice is not allowed in payload when supportAssistance is 0',
            }),
            price: Joi.number().integer().min(1).messages({
                'number.integer': 'price  must be an integer',
                'number.base': 'price must be a number',
                'number.empty': 'price  must not be empty',
                'number.min': 'price must greater than 0'
            }),
            plantype: Joi.number().integer().strict().valid(1, 2).required().messages({
                'number.integer': 'plantype must be an integer',
                'number.base': 'plantype must be a number',
                'number.empty': 'plantype is required',
                'any.required': 'plantype is required',
                'any.only': 'plantype must be either 1 or 2 in integer formats'
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