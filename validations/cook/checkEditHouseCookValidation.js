const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkEditHouseCookValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            householdVesselWash: Joi.number().integer().valid(0, 1).required().strict().messages({
                'number.integer': 'House Hold VesselWash must be an integer',
                'number.base': 'House Hold VesselWash must be a number',
                'number.empty': 'Please enter your house hold vesselwash',
                'any.required': 'House Hold VesselWash is required',
                'any.only': 'Invalid value for house hold vesselwash'
            }),
            jobType: Joi.number().integer().valid(2, 1, 3).required().strict().messages({
                'number.integer': 'Job type must be an integer',
                'number.base': 'Job type must be a number',
                'number.empty': 'Please enter your jobtype',
                'any.required': 'Job type is required',
                'any.only': 'Invalid value for job type'
            }),
            payment: Joi.string().trim().allow('').regex(/^[a-zA-Z0-9\s]+$/).min(4).messages({
                'string.pattern.base': 'Please enter valid payment',
                'string.min': 'payment must have at least 4 characters',
            }),
            householdCuisines: Joi.array().items(Joi.string()).min(1).required().messages({
                'array.base': 'Please enter your house hold cuisines',
                'array.min': 'Please enter your house hold cuisines',
                'array.required': 'House Hold Cuisines is required'
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