const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.checkEditCookValidation = async (req, res, next) => {
    try {
        const customFullNameValidator = (fullName) => {
            if (fullName.startsWith("'") || fullName.endsWith("'")) throw { statusCode: 500, responseCode: 2, msg: "Full Name cannot start or end with an apostrophe" };
            return fullName;
        };
        if (req.body.memberType) throw { statusCode: 500, responseCode: 2, msg: "memberType is not allowed" }
        const user = req.user;
        const schema = Joi.object({
            memberType: Joi.number().integer().strict().valid(1, 2).messages({
                'any.only': 'memberType must be either 1 or 2',
                'number.base': 'memberType must be a number',
            }),
            fullName: Joi.string().trim().messages({
                'string.empty': 'Please provide name'
            }),
            smsContact: Joi.number().integer().strict().allow("").valid(0, 1).messages({
                'any.only': 'Please provide valid smsContact',
                'number.base': 'smsContact must be a number',
            }),
            whatsappContact: Joi.number().integer().strict().valid(0, 1).messages({
                'any.only': 'Please provide valid whatsappContact',
                'number.base': 'whatsappContact must be a number',
            }),
            emailContact: Joi.number().integer().strict().messages({
                'any.only': 'Please provide valid emailContact',
                'number.base': 'emailContact must be a number',
            }),
            gender: Joi.when('memberType', {
                is: 1,
                then: Joi.number().valid(1, 2, 3).messages({
                    'any.only': 'Invalid gender value',
                    'number.base': 'Gender must be a number',
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'Gender is not allowed when user is a Catering',
            }),
            qualification: Joi.when('memberType', {
                is: 1,
                then: Joi.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9\s]*$/).min(4).max(100).messages({
                    'string.empty': 'Please provide qualification',
                    'string.pattern.base': 'Please enter a valid qualification',
                    'string.max': 'Qualification must not exceed 100 characters',
                    'string.min': 'Qualification must have at least 4 characters'
                }),
                otherwise: Joi.forbidden(),
            }).allow("").messages({
                'any.unknown': 'Qualification is not allowed when user is a Catering',
            }),
            area: Joi.string().trim().allow("").min(2).max(150).messages({
                'string.empty': 'Please provide area',
                'string.pattern.base': 'Please enter a valid area',
                'string.max': 'Area must not exceed 150 characters',
                'string.min': 'Area must have at least 2 characters'
            }),
            dob: Joi.when('memberType', {
                is: 1,
                then: Joi.date()
                    .max('now') // Ensure dob is not greater than current date
                    .iso()
                    .messages({
                        'date.base': 'Please enter valid date for dob',
                        'date.max': 'Dob cannot be greater than the current date',
                        'date.empty': 'Please provide date of birth',
                    }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'Dob is not allowed when user is a Catering',
            }),
            dp: Joi.string().uri().allow("").messages({
                'string.empty': 'Please provide dp'
            }),
            addressLine1: Joi.string().trim().regex(/^(?!\d+$)[a-zA-Z0-9 .,'#-]{1,100}$/).allow("").messages({
                'string.pattern.base': 'Please enter a valid addressLine1',
                'string.empty': 'Please provide addressLine1',
                'string.max': 'addressLine1 must not exceed 100 characters',
                'string.min': 'addressLine1 must have at least 1 character'
            }),
            addressLine2: Joi.string().trim().allow('').regex(/^(?!\d+$)[a-zA-Z0-9 .,'#-]{1,50}$/).allow("").messages({
                'string.pattern.base': 'Please enter a valid addressLine2',
                'string.max': 'addressLine2 cannot exceed 50 characters',
                'string.min': 'addressLine2 must have at least 1 character'
            }),
            cityName: Joi.string().trim().allow("").min(2).max(150).messages({
                'string.pattern.base': 'Please enter a valid city name',
                'string.empty': 'Please provide city name',
                'string.max': 'cityName cannot exceed 150 characters',
                'string.min': 'cityName must have at least 2 characters'
            }),
            provinceName: Joi.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9, -]{3,99}$/).allow("").messages({
                'string.pattern.base': 'Please enter a valid state name',
                'string.empty': 'Please provide state name',
                'string.max': 'stateName cannot exceed 100 characters',
                'string.min': 'stateName must have at least 4 characters'
            }),
            landmark: Joi.string().trim().allow('').regex(/^[a-zA-Z0-9 .'#-]{1,50}$/).allow("").messages({
                'string.pattern.base': 'Please enter a valid landmark',
                'string.empty': 'Please provide landmark',
                'string.max': 'Landmark cannot exceed 50 characters',
                'string.min': 'Landmark must have at least 1 character'
            }),
            about: Joi.string().trim().allow('').regex(/^[a-zA-Z\s].*$/).min(4).max(500).messages({
                'string.pattern.base': 'Please enter a valid about',
                'string.empty': 'Please provide about',
                'string.max': 'About cannot exceed 500 characters',
                'string.min': 'About must have at least 4 characters'
            }),
            pincode: Joi.string().trim().pattern(/^\d+$/).min(6).max(6).allow("").messages({
                'string.pattern.base': 'Please enter a valid pincode',
                'string.empty': 'Please provide pincode',
                'string.min': 'Pincode must have exactly 6 digits',
                'string.max': 'Pincode must have exactly 6 digits'
            }),
            languages: Joi.array()
                .items(Joi.string().regex(/^[a-zA-Z]+$/))
                .min(1)
                .messages({
                    'array.base': 'Languages must not be empty',
                    'array.min': 'Languages must not be empty',
                    'string.pattern.base': 'Please enter valid languages',
                }),
            areaCoordinates: Joi.object({
                type: Joi.string().valid('Point').required().messages({
                    'any.required': 'Type for areaCoordinates is required',
                    'any.only': 'Invalid type for area-coordinates',
                }),
                coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
                    'any.required': 'Coordinates for area are required',
                    'array.base': 'Coordinates for area  must be an array',
                    'array.length': 'Coordinates for area must contain exactly 2 numbers',
                    'array.includesRequiredUnknowns': 'Coordinates for area must contain 2 numbers',
                    'number.base': 'Coordinates for area must be numbers',
                })
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
            })

        }).unknown(false)
            .messages({
                'object.unknown': 'Unknown field: "{#key}" is not allowed in payload'
            });

        //Validating Schema
        const body = { memberType: user.memberType, ...req.body };
        let { error } = schema.validate(body);
        if (error) {
            let message = error.details[0].message;
            throw { statusCode: 400, responseCode: 2, msg: message || "Payload request error" }
        }
        else next();
    } catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Internal Server Error', e))
    }
}
