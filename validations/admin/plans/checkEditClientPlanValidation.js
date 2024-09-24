const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkEditClientPlanValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.number().integer().valid(0, 1).strict().messages({
                'number.integer': 'status must be an integer',
                'number.base': 'status must be a number',
                'number.empty': 'status is required',
                'any.only': 'status must be either 0 or 1'
            }),
            id: Joi.string().required().messages({
                'string.empty': 'id is required',
                'string.required': 'id must not be empty'
            }),
            clientPlanName: Joi.string().messages({
                'string.empty': 'cookPlanName is required',
                'string.required': 'cookPlanName must not be empty'
            }),
            validityInDays: Joi.number().integer().min(1).messages({
                'number.integer': 'validityInDays  must be an integer',
                'number.base': 'validityInDays must be a number',
                'number.empty': 'validityInDays  must not be empty',
                'number.min': 'validityInDays must greater than 0'
            }),
            eventPoints: Joi.number().integer().min(1).messages({
                'number.integer': 'eventPoints  must be an integer',
                'number.base': 'eventPoints must be a number',
                'number.empty': 'eventPoints  must not be empty',
                'number.min': 'eventPoints must greater than 0'
            }),
            houseCookPoints: Joi.number().integer().min(1).messages({
                'number.integer': 'houseCookPoints  must be an integer',
                'number.base': 'houseCookPoints must be a number',
                'number.empty': 'houseCookPoints  must not be empty',
                'number.min': 'houseCookPoints must greater than 0'
            }),
            partyCateringPoints: Joi.number().integer().min(1).messages({
                'number.integer': 'partyCateringPoints  must be an integer',
                'number.base': 'partyCateringPoints must be a number',
                'number.empty': 'partyCateringPoints  must not be empty',
                'number.min': 'partyCateringPoints must greater than 0'
            }),
            supportAssistance: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'supportAssistance must be an integer',
                'number.base': 'supportAssistance must be a number',
                'any.only': 'supportAssistance must be either 0 or 1 in integer formats'
            }),
            refundPolicy: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'refundPolicy must be an integer',
                'number.base': 'refundPolicy must be a number',
                'any.only': 'refundPolicy must be either 0 or 1 in integer formats'
            }),
            price: Joi.number().integer().min(1).messages({
                'number.integer': 'price  must be an integer',
                'number.base': 'price must be a number',
                'number.min': 'price must greater than 0'
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