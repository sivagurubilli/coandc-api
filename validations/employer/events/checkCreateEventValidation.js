const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkCreateEventValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            eventType: Joi.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9,'’ ]{1,100}$/).required().messages({
                'string.pattern.base': 'Please enter a valid event type',
                'string.empty': 'Please enter your event type',
                'string.min': 'Event type must have at least 1 character',
                'string.max': 'Event type cannot exceed 100 characters',
                'string.required': 'Event type is required'
            }),
            eventDate: Joi.date().min('now').iso().required().messages({
                'date.base': 'Please enter a valid event date',
                'date.min': 'Event date cannot be lesser than the current date',
                'any.required': 'Eevent date is required'
            }),
            cuisines: Joi.array().items(
                Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).messages({
                    'string.pattern.base': 'Please enter a valid cuisines',
                })
            ).min(1).required().messages({
                'array.base': 'Please enter your cuisines ',
                'array.min': 'Please enter atleas one cuisine',
                'any.required': 'cuisines is required'
            }),
            expectedGuest: Joi.number().integer().min(10).required().messages({
                'number.integer': 'Expected guest must be an integer',
                'number.base': 'ExpectedGuest must be a number',
                'number.empty': 'Please enter your expected guest',
                'number.min': "Expected guest must be atleast 10",
                'any.required': 'Expected guest is required'
            }),
            city: Joi.string().trim().min(2).max(150).required().messages({
                'string.pattern.base': 'Please enter a valid city',
                'string.empty': 'Please enter your city',
                'string.max': 'City cannot exceed 150 characters',
                'string.min': 'City must have at least 2 characters',
                'any.required': 'City is required'
            }),
            location: Joi.string().trim().min(2).max(150).required().messages({
                'string.pattern.base': 'Please enter a valid location',
                'string.empty': 'Please enter your location',
                'string.max': 'Location  cannot exceed 150 characters',
                'string.min': 'Location must have at least 2 characters',
                'any.required': 'Location is required'
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
                    'number.base': 'Coordinates for city must be numbers',
                })
            }).required().messages({
                'any.required': 'cityCoordinates is required',
                'any.empty': 'cityCoordinates cannot be empty'
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
                    'number.base': 'Coordinates for location must be numbers',
                })
            }).required().messages({
                'any.required': 'locationcoordinates is required',
                'any.empty': 'locationcoordinates cannot be empty'
            }),
            dishes: Joi.string().trim().regex(/^[a-zA-Z0-9, ]{1,100}$/).min(1).max(100).required().messages({
                'string.pattern.base': 'Please enter valid dishes',
                'string.empty': 'Please enter your dishes',
                'string.max': 'Dishes  cannot exceed 100 characters',
                'string.min': 'Please enter valid dishes',
                'any.required': 'Dishes is required'
            }),
            pincode: Joi.number().integer().min(100000).max(999999).required().strict().messages({
                'number.base': 'pincode must be a number',
                'number.integer': 'pincode must be an integer',
                'number.min': 'pincode must be a 6-digit number',
                'number.max': 'pincode must be a 6-digit number',
                'any.required': 'pincode is required'
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