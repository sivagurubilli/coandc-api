const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkEditChefValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            jobSeeking: Joi.number().integer().valid(0, 1).strict().messages({
                'number.integer': 'Job seeking  must be an integer',
                'number.base': 'Job seeking  must be a number',
                'number.empty': 'Please provide jobSeeking.',
                'any.only': 'Invalid jobseeking value.'
            }),
            chefExperience: Joi.number().integer().min(1).max(50).required().strict().messages({
                'number.integer': 'Chef experience  must be an integer',
                'number.base': 'Chef experience must be a number',
                'number.required': "Chef experience is required",
                'number.empty': 'Chef experience must not be empty',
                'number.min': 'Chef experience must greater than or equal to 1',
                'number.min': 'Chef experience must less than or equal to 50'
            }),
            relocate: Joi.number().integer().valid(0, 1).strict().messages({
                'number.integer': 'Relocate  must be an integer',
                'number.base': 'Relocate must be a number',
                'number.empty': 'Please provide a valid value for relocate.',
                'any.only': 'Relocate type must be either 0 or 1'
            }),
            resume: Joi.string().uri().allow('').messages({
            }),
            currentSalary: Joi.number().integer().allow(0).min(5000).max(50000000).strict().required().messages({
                'number.integer': 'Current salary  must be an integer',
                'number.base': 'Current salary must be a number',
                'number.required': "Current salary is required",
                'number.empty': 'Current salary must not be empty',
                'number.min': 'Current salary must greater than or equal to 5000',
                'number.max': 'Current salary must less than or equal to 50000000'
            }),
            expectedSalary: Joi.number().integer().min(5000).max(50000000).strict().required().messages({
                'number.integer': 'Expected salary  must be an integer',
                'number.base': 'Expected salary must be a number',
                'number.required': "Expected salary is required",
                'number.empty': 'Expected salary must not be empty',
                'number.min': 'Expected salary must greater than or equal to 5000',
                'number.max': 'Expected salary must less than or equal to 50000000'
            }),
            currentCompany: Joi.string().trim().allow('').regex(/^[a-zA-Z0-9\-', &@’]{2,100}$/).messages({
                'string.pattern.base': 'Please enter a valid company name',
                'string.max': 'Company name must not exceed 100 characters',
                'string.min': 'Company name must have at least 4 characters',
            }),
            currentCityName: Joi.string().trim().min(2).max(150).required().messages({
                'string.pattern.base': 'Please enter a valid city name',
                'string.empty': 'City name must not be empty',
                'string.max': 'City name must not exceed 150 characters',
                'string.min': 'City name must have at least 22 characters'
            }),
            chefCuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Each cuisine must start with an alphabet and can contain alphabets and spaces only',
                })
            ).min(1).required().messages({
                'array.base': 'Please enter cuisines known',
                'array.min': 'Please enter cuisines known',
                'array.required': 'Please enter cuisines known',
            }),
            skills: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z0-9\- ',&@]{2,100}$/).messages({
                    'string.pattern.base': 'Please provide a valid skill.',
                })
            ),
            currentCityCoordinates: Joi.object({
                type: Joi.string().valid('Point').required().messages({
                    'any.required': 'Type for currentCityCoordinates is required',
                    'any.only': 'Type for currentCityCoordinates must be "Point"',
                }),
                coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
                    'any.required': 'Coordinates for currentCity are required',
                    'array.base': 'Coordinates for currentCity  must be an array',
                    'array.length': 'Coordinates for currentCity must contain exactly 2 numbers',
                    'array.includesRequiredUnknowns': 'Coordinates for currentCity must contain 2 numbers',
                    'number.base': 'Coordinates for currentCity must be numbers',
                })
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