const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.editChefValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required().messages({
                'string.required': 'Please provide id'
            }),
            jobSeeking: Joi.number().integer().valid(0, 1).allow("").strict().messages({
                'number.integer': 'Job seeking  must be an integer',
                'number.base': 'Job seeking  must be a number',
                'any.only': 'Invalid jobseeking value.'
            }),
            chefExperience: Joi.number().integer().min(1).max(35).allow("").strict().messages({
                'number.integer': 'Chef Experience  must be an integer',
                'number.base': 'Chef Experience must be a number',
                'number.empty': 'Chef Experience must not be empty',
                'number.min': 'Chef Experience must greater than or equal to 1',
                'number.min': 'Chef Experience must less than or equal to 35'
            }),
            relocate: Joi.number().integer().valid(0, 1).allow("").strict().messages({
                'number.integer': 'Relocate  must be an integer',
                'number.base': 'Relocate must be a number',
                'number.empty': 'Relocate must not be empty',
                'any.only': 'Relocate Type must be either 0 or 1'
            }),
            resume: Joi.string().uri().allow('').messages({
            }),
            currentSalary: Joi.number().integer().min(5000).max(50000000).strict().allow("").messages({
                'number.integer': 'Current salary  must be an integer',
                'number.base': 'Current salary must be a number',
                'number.empty': 'Current salary must not be empty',
                'number.min': 'Current salary must greater than or equal to 5000',
                'number.max': 'Current salary must less than or equal to 50000000'
            }),
            expectedSalary: Joi.number().integer().min(5000).max(50000000).strict().allow("").messages({
                'number.integer': 'Expected salary  must be an integer',
                'number.base': 'Expected salary must be a number',
                'number.empty': 'Expected salary must not be empty',
                'number.min': 'Expected salary must greater than or equal to 5000',
                'number.max': 'Expected salary must less than or equal to 50000000'
            }),
            currentCompany: Joi.string().trim().allow('').regex(/^[a-zA-Z0-9\-', &@]{2,100}$/).messages({
                'string.pattern.base': 'Please enter a valid company name',
                'string.max': 'Company name must not exceed 100 characters',
                'string.min': 'Company name must have at least 4 characters',
            }),
            currentCityName: Joi.string().trim().allow("").min(2).max(150).messages({
                'string.pattern.base': 'currentCityName must start with a letter and can contain alphanumeric characters, comma, space',
                'string.empty': 'currentCityName must not be empty',
                'string.max': 'currentCityName must not exceed 150 characters',
                'string.min': 'currentCityName must have at least 2 characters'
            }),
            chefCuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Each cuisine must start with an alphabet and can contain alphabets and spaces only',
                })
            ).min(0).messages({
            }),
            skills: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z0-9\- ',&@]{2,100}$/).messages({
                    'string.pattern.base': 'Please provide a valid skill.',
                })
            ),
            currentCityCoordinates: Joi.object({
                type: Joi.string().valid('Point').allow("").messages({
                    'any.required': 'Type for currentCityCoordinates is required',
                    'any.only': 'Type for currentCityCoordinates must be "Point"',
                }),
                coordinates: Joi.array().items(Joi.number()).length(2).allow("").messages({
                    'any.required': 'Coordinates for currentCity are required',
                    'array.base': 'Coordinates for currentCity  must be an array',
                    'array.length': 'Coordinates for currentCity must contain exactly 2 numbers',
                    'array.includesRequiredUnknowns': 'Coordinates for currentCity must contain 2 numbers',
                    'number.base': 'Coordinates for currentCity must be numbers',
                })
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
