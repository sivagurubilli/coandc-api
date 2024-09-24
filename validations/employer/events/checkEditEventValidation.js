const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkEditEventValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().trim().min(8).required().messages({
                'string.empty': 'Please provide id',
                'string.min': 'id must have at least 8 characters',
                'string.required': 'id is required'
            }),
            status: Joi.number().integer().strict().valid(0, 1, 2).messages({
                'number.integer': 'status must be an integer',
                'number.base': 'status must be a number',
                'number.empty': 'Please provide status value',
                'any.only': 'Invalid status value'
            }),
            eventType: Joi.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9,'’ ]{1,100}$/).messages({
                'string.pattern.base': 'Please enter a valid event type',
                'string.empty': 'Please enter your event type',
                'string.min': 'Event type must have at least 1 character',
                'string.max': 'Event type cannot exceed 100 characters'
            }),
            eventDate: Joi.date().min('now').iso().messages({
                'date.base': 'Please enter valid event date',
                'date.min': 'eventDate cannot be lesser than the todays date'
            }),
            cuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Please enter valid cuisines',
                })
            ).min(1).messages({
                'array.base': 'Please enter your cuisines',
                'array.min': 'Please provide atleast one cuisine'
            }),
            expectedGuest: Joi.number().integer().min(10).messages({
                'number.integer': 'expectedGuest must be an integer',
                'number.base': 'Please enter valid expected guest count',
                'number.empty': 'Please enter you expected guest count',
                'number.min': "Expected Guest count must be greater than 10",
            }),
            city: Joi.string().trim().min(2).max(150).messages({
                'string.pattern.base': 'Please enter a valid city',
                'string.empty': 'Please provide your city',
                'string.max': 'city cannot exceed 150 characters',
                'string.min': 'city must have at least 2 characters'
            }),
            location: Joi.string().trim().min(2).max(150).messages({
                'string.pattern.base': 'Please enter a valid location',
                'string.empty': 'Please provide your location',
                'string.max': 'location cannot exceed 150 characters',
                'string.min': 'location must have at least 2 characters',
            }),
            cityCoordinates: Joi.object({
                type: Joi.string().valid('Point').required().messages({
                    'any.required': 'Type for city is required',
                    'any.only': 'Invalid type for city-coordinates',
                }),
                coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
                    'any.required': 'Coordinates for city are required',
                    'array.base': 'Coordinates for city  must be an array',
                    'array.length': 'Coordinates for city must contain exactly 2 numbers',
                    'array.includesRequiredUnknowns': 'Coordinates for city must contain 2 numbers',
                    'number.base': 'Please provide valid city coordinates',
                })
            }),
            locationCoordinates: Joi.object({
                type: Joi.string().valid('Point').required().messages({
                    'any.required': 'Type for location is required',
                    'any.only': 'Invalid type for location-coordinates',
                }),
                coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
                    'any.required': 'Coordinates for location are required',
                    'array.base': 'Coordinates for location must be an array',
                    'array.length': 'Coordinates for location must contain exactly 2 numbers',
                    'array.includesRequiredUnknowns': 'Coordinates for location must contain 2 numbers',
                    'number.base': 'Please provide valid location coordinates',
                })
            }),
            dishes: Joi.string().trim().regex(/^[a-zA-Z0-9, ]{1,100}$/).min(1).max(100).messages({
                'string.pattern.base': 'Please enter valid dishes',
                'string.empty': 'Please enter your dishes',
                'string.max': 'Dishes  cannot exceed 100 characters',
                'string.min': 'Please enter valid dishes'
            }),
            pincode: Joi.number().integer().min(100000).max(999999).strict().messages({
                'number.base': 'Please enter valid pincode',
                'number.integer': 'pincode must be an integer',
                'number.min': 'pincode must be a 6-digit number',
                'number.max': 'pincode must be a 6-digit number',
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