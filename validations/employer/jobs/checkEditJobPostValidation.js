const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkEditJobPostValidation = async (req, res, next) => {


    try {
        const schema = Joi.object({
            id: Joi.string().trim().required().messages({
                'string.empty': 'id must not be empty',
                'string.required': 'id is required',
            }),
            designation: Joi.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9\s’]*$/).min(3).max(100).messages({
                'string.pattern.base': 'Please provide valid designation',
                'string.empty': 'Please provide designation',
                'string.max': 'Designation must not exceed 100 characters',
                'string.min': 'Designation must have at least three characters and start with a letter',
            }),
            description: Joi.string().trim().min(2).max(1000).messages({
                'string.pattern.base': 'Please provide valid description',
                'string.empty': 'Please provide description',
                'string.max': 'Description must not exceed 1000 characters',
                'string.min': 'Description must have at least two characters',
            }),
            qualification: Joi.string().trim().allow("").regex(/^[a-zA-Z][a-zA-Z0-9\s.,-]*$/).max(1000).messages({
                'string.pattern.base': 'Please provide valid qualification',
                'string.empty': 'Please provide qualification',
                'string.max': 'Qualification must not exceed 1000 characters',
            }),
            urgency: Joi.string().trim().regex(/^[a-zA-Z0-9 ]+$/).min(3).max(100).messages({
                'string.pattern.base': 'Please provide a valid urgency',
                'string.empty': 'Please enter urgency',
                'string.max': 'urgency cannot exceed 100 characters',
                'string.min': 'Urgency must have at least 3 characters'
            }),
            contactNumber: Joi.number().integer().min(1000000000).max(9999999999).strict()
                .messages({
                    'number.base': 'contactNumber must be a number',
                    'number.integer': 'contactNumber must be an integer',
                    'number.min': 'contactNumber must be a 10-digit number',
                    'number.max': 'contactNumber must be a 10-digit number',
                }),
            whatsappUpdate: Joi.number().integer().strict().valid(0, 1).messages({
                'number.integer': 'whatsappUpdate must be an integer',
                'number.base': 'whatsappUpdate must be a number',
                'number.empty': 'whatsappUpdate must not empty',
                'any.only': 'whatsappUpdate must be either 0 or 1 in integer formats'
            }),
            status: Joi.number().integer().strict().valid(0, 1, 2).messages({
                'number.integer': 'status must be an integer',
                'number.base': 'status must be a number',
                'number.empty': 'status must not be empty',
                'any.only': 'status must be either 0,1 or 2 in integer formats'
            }),
            visibility: Joi.number().integer().strict().valid(0, 1, 2).messages({
                'number.integer': 'visibility must be an integer',
                'number.base': 'visibility must be a number',
                'number.empty': 'visibility must not be empty',
                'any.only': 'visibility must be either 0,1 or 2 in integer formats'
            }),
            food: Joi.number().integer().strict().valid(0, 1, 2).messages({
                'number.integer': 'food must be an integer',
                'number.base': 'food must be a number',
                'number.empty': 'food must not be empty',
                'any.only': 'food must be either 0,1 or 2 in integer formats'
            }),
            accommodation: Joi.number().integer().strict().valid(0, 1, 2).messages({
                'number.integer': 'accommodation must be an integer',
                'number.base': 'accommodation must be a number',
                'number.empty': 'accommodation must not be empty',
                'any.only': 'accommodation must be either 0,1 or 2 in integer formats'
            }),
            pincode: Joi.number().integer().min(100000).max(999999).strict()
                .messages({
                    'number.base': 'pincode must be a number',
                    'number.integer': 'pincode must be an integer',
                    'number.min': 'pincode must be a 6-digit number',
                    'number.max': 'pincode must be a 6-digit number',
                }),
            salary: Joi.number().integer().strict().min(18000).max(50000000).messages({
                'number.integer': 'salary  must be an integer',
                'number.base': 'salary must be a number',
                'number.empty': 'salary must not be empty',
                'number.min': 'salary must greater than or equal to 18000',
                'number.max': 'salary must less than or equal to 50000000'
            }),
            experience: Joi.number().integer().min(1).max(50).strict().messages({
                'number.integer': 'Experience  must be an integer',
                'number.base': 'Experience must be a number',
                'number.empty': 'Experience must not be empty',
                'number.min': 'Experience must greater than or equal to 1',
                'number.max': 'Experience must less than or equal to 50'
            }),
            openings: Joi.number().integer().min(1).max(50000).messages({
                'number.integer': 'openings  must be an integer',
                'number.base': 'openings must be a number',
                'number.empty': 'openings must not be empty',
                'number.min': 'openings must greater than or equal to 1',
                'number.max': 'openings must less than or equal to 50000'
            }),
            dishes: Joi.string().trim().allow("").regex(/^[a-zA-Z0-9, ]{1,100}$/).min(1).max(100).messages({
                'string.pattern.base': 'Please enter valid dishes',
                'string.empty': 'Please enter your dishes',
                'string.max': 'Dishes  cannot exceed 100 characters',
                'string.min': 'Please enter valid dishes'
            }),
            location: Joi.string().trim().min(2).max(150).messages({
                'string.pattern.base': 'Please provide valid location',
                'string.empty': 'Please provide location',
                'string.max': 'location must not exceed 150 characters',
                'string.min': 'location must have at least 2 characters',
            }),
            locationCoordinates: Joi.object({
                type: Joi.string().valid('Point').required().messages({
                    'any.required': 'Type for locationCoordinates is required',
                    'any.only': 'Type for locationCoordinates must be "Point"',
                }),
                coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
                    'any.required': 'Coordinates for location are required',
                    'array.base': 'Coordinates for location  must be an array',
                    'array.length': 'Coordinates for location must contain exactly 2 numbers',
                    'array.includesRequiredUnknowns': 'Coordinates for location must contain 2 numbers',
                    'number.base': 'Coordinates for location must be numbers',
                })
            }),
            cuisines: Joi.array()
                .items(Joi.string().regex(/^[a-zA-Z\s]*$/).min(3).max(100))
                .min(0)
                .messages({
                    'string.max': 'Each cuisine cannot exceed 100 characters',
                    'string.min': 'Each cuisine must have at least 3 characters'
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