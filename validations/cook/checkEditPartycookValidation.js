const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkEditPartycookValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            partyCookAvailability: Joi.number().integer().valid(1, 2, 3).required().strict().messages({
                'number.integer': 'Party cook availability must be an integer',
                'number.base': 'Party cook availability  must be a number',
                'number.empty': 'Please enter your party cook availability',
                'any.required': 'Party cook availability is required',
                'any.only': 'Invalid value for party cook availability'
            }),
            partyCookFoodType: Joi.number().integer().valid(1, 2, 3).strict().allow("").messages({
                'number.integer': 'Party cook food type  must be an integer',
                'number.base': 'Party cook food typee  must be a number',
                'any.only': 'Invalid value for party cook food type'
            }),
            partyCookVesselWash: Joi.number().integer().valid(0, 1).required().strict().messages({
                'number.integer': 'Party vessel wash must be an integer',
                'number.base': 'Party vessel wash must be a number',
                'number.empty': 'Please enter your party vessel wash',
                'any.required': 'Party VesselWash is required',
                'any.only': 'Invalid value for party vessel wash'
            }),
            partyExperience: Joi.number().integer().min(1).max(50).required().strict().messages({
                'number.integer': 'Party Experience  must be an integer',
                'number.base': 'Party Experience must be a number',
                'number.required': "Party Experience is required",
                'number.empty': 'Please enter your party experience',
                'number.min': 'Party Experience must greater than 0',
                'number.min': 'Party Experience must less than 50'
            }),
            speciality: Joi.string()
                .trim()
                .allow('')
                .regex(/^[a-zA-Z0-9, ]{1,100}$/)
                .min(1).max(100).messages({
                    'string.pattern.base': 'Please enter a valid speciality',
                    'string.max': 'speciality cannot exceed 100 characters',
                    'string.min': 'speciality must have at least 1 characters'
                }),
            partyCuisines: Joi.array().items(Joi.string()).min(1).required().messages({
                'array.base': 'Please enter your party Cuisines',
                'array.min': 'Please enter your party Cuisines',
                'array.required': 'Party Cuisines is required'
            }),
            partyMaxPlates: Joi.number().integer().min(1).allow("").messages({
                'number.integer': 'Party max plates must be an integer',
                'number.base': 'Party max plates must be a number',
                'number.empty': 'Please enter your party maximum plates',
                'number.min': 'Party max plates must greater than 0'
            }),
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