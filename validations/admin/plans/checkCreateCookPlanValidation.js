const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkCreateCookPlanValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.number().integer().valid(0, 1).required().strict().messages({
                'number.integer': 'status must be an integer',
                'number.base': 'status must be a number',
                'number.empty': 'status is required',
                'any.required': 'status is required',
                'any.only': 'status must be either 0 or 1'
            }),
            cookPlanName: Joi.string().required().messages({
                'string.empty': 'cookPlanName is required',
                'string.required': 'cookPlanName must not be empty'
            }),
            validityInDays: Joi.number().integer().min(1).required().messages({
                'number.integer': 'validityInDays  must be an integer',
                'number.base': 'validityInDays must be a number',
                'number.required': "validityInDayss is required",
                'number.empty': 'validityInDays  must not be empty',
                'number.min': 'validityInDays must greater than 0'
            }),
            profileBoostRank: Joi.number().integer().valid(0, 1).required().messages({
                'number.integer': 'profileBoostRank  must be an integer',
                'number.base': 'profileBoostRank must be a number',
                'number.required': "profileBoostRank is required",
                'number.empty': 'profileBoostRank  must not be empty',
                'any.only': 'profileBoostRank must be either 0 or 1'
            }),
            resumeBuilder: Joi.number().integer().valid(0, 1).required().messages({
                'number.integer': 'resumeBuilder  must be an integer',
                'number.base': 'resumeBuilder must be a number',
                'number.required': "resumeBuilder is required",
                'number.empty': 'resumeBuilder  must not be empty',
                'any.only': 'resumeBuilder must be either 0 or 1'
            }),
            actionPerDay: Joi.number().integer().min(1).required().messages({
                'number.integer': 'actionPerDay  must be an integer',
                'number.base': 'actionPerDay must be a number',
                'number.required': "actionPerDay is required",
                'number.empty': 'actionPerDay  must not be empty',
                'number.min': 'actionPerDay must greater than 0'
            }),
            actionPerMonth: Joi.number().integer().min(1).required().messages({
                'number.integer': 'actionPerMonth  must be an integer',
                'number.base': 'actionPerMonth must be a number',
                'number.required': "actionPerMonth is required",
                'number.empty': 'actionPerMonth  must not be empty',
                'number.min': 'actionPerMonth must greater than 0'
            }),
            price: Joi.number().integer().min(1).required().messages({
                'number.integer': 'price  must be an integer',
                'number.base': 'price must be a number',
                'number.required': "price is required",
                'number.empty': 'price  must not be empty',
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