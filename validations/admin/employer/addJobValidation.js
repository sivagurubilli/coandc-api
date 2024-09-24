const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.addJobValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            employerId: Joi.string().trim().required().messages({
                'string.empty': 'Please provide employerId',
                'any.required': 'Please provide employerId'
            }),
            designation: Joi.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9\s]*$/).min(3).max(100).required().messages({
                'string.pattern.base': 'Please provide a valid designation',
                'string.empty': 'Please enter designation',
                'string.required': 'Please enter designation',
                'string.max': 'Designation must not exceed 100 characters',
                'string.min': 'Designation must have min three characters and start with a letter',
            }),
            description: Joi.string().trim().min(2).max(1000).required().messages({
                'string.pattern.base': 'Please provide a valid description',
                'string.empty': 'Please enter description',
                'string.required': 'Please enter description',
                'string.max': 'Description must not exceed 100 characters',
                'string.min': 'Description must have min two characters',
            }),
            qualification: Joi.string().trim().allow("").regex(/^[a-zA-Z][a-zA-Z0-9\s.,-]*$/).max(100).messages({
                'string.pattern.base': 'Please provide a valid qualification',
                'string.max': 'Qualification must not exceed 100 characters',
                'string.min': 'qualification must have at least three characters and start with a letter',
            }),
            urgency: Joi.string().trim().regex(/^[a-zA-Z0-9 ]+$/).min(3).max(100).required().messages({
                'string.pattern.base': 'Please provide a valid urgency',
                'string.empty': 'Please enter urgency',
                'string.required': 'Please enter urgency',
                'string.max': 'Urgency must not exceed 100 characters',
                'string.min': 'Urgency must have min 3 characters'
            }),
            contactNumber: Joi.number().integer().allow("").max(9999999999).strict().required()
                .messages({
                    'number.base': 'Please provide a valid contact number',
                    'number.integer': 'Contact number must be an integer',
                    'number.max': 'Contact number must be 10 digit'

                }),
            whatsappUpdate: Joi.number().integer().allow("").valid(0, 1).messages({
                'number.integer': 'Please provide a valid whatsapp update',
                'number.base': 'Please provide a valid whatsapp update value',
                'any.only': 'Invalid whatsapp update value'
            }),
            status: Joi.number().integer().strict().allow("").valid(0, 1, 2).messages({
                'number.integer': 'Status must be an integer',
                'number.base': 'Please enter a valid status',
                'any.only': 'Invalid status value'
            }),
            visibility: Joi.number().integer().strict().allow("").valid(0, 1, 2).messages({
                'number.integer': 'Visibility must be an integer',
                'number.base': 'Please enter valid visibility',
                'number.empty': 'Please enter visibility',
                'any.only': 'Invalid visibility value'
            }),
            food: Joi.number().integer().strict().valid(0, 1, 2).required().messages({
                'number.integer': 'Food must be an integer',
                'number.base': 'Please enter a valid value for food',
                'number.empty': 'Please provide food value',
                'any.required': 'Food value is required',
                'any.only': 'Invalid food value'
            }),
            accommodation: Joi.number().integer().strict().valid(0, 1, 2).required().messages({
                'number.integer': 'Accommodation must be an integer',
                'number.base': 'Please provide a valid accomodation value',
                'number.empty': 'Please provide accomodation',
                'any.required': 'Accommodation is required',
                'any.only': 'Invalid accomodation values'
            }),
            pincode: Joi.number().integer().min(100000).max(999999).strict().required()
                .messages({
                    'number.base': 'Please provide a valid pincode',
                    'number.integer': 'Pincode must be an integer',
                    'number.min': 'Pincode must be 6 digits',
                    'number.max': 'Pincode must be 6 digits',
                    'number.required': "Pincode is required",

                }),
            salary: Joi.number().integer().strict().min(18000).max(50000000).required().messages({
                'number.integer': 'Salary must be an integer',
                'number.base': 'Please provide a valid salary',
                'number.empty': 'Please enter salary',
                'number.required': "Salary is required",
                'number.min': 'Salary must greater than or equal to 18000',
                'number.max': 'Salary must less than or equal to 50000000'
            }),
            experience: Joi.number().integer().min(1).max(50).required().strict().messages({
                'number.integer': 'Experience  must be an integer',
                'number.base': 'Please provide a valid experience',
                'number.required': "Experience is required",
                'number.empty': 'Please enter experience',
                'number.min': 'Experience must greater than or equal to 1',
                'number.max': 'Experience must less than or equal to 50'
            }),
            openings: Joi.number().integer().allow("").max(100).messages({
                'number.integer': 'Openings  must be an integer',
                'number.base': 'Please provide valid openings values',
                'number.min': 'Openings must greater than or equal to 1',
                'number.max': 'Openings must less than or equal to 100'
            }),
            cuisines: Joi.array()
                .items(Joi.string().regex(/^[a-zA-Z\s]*$/).min(3).max(100))
                .min(1)
                .required()
                .messages({
                    'array.base': 'Please provide cuisines',
                    'array.min': 'Please provide atleast one cuisine',
                    'array.required': 'Cuisines is required',
                    'string.max': 'Each cuisine cannot exceed 100 characters',
                    'string.min': 'Each cuisine must have at least 3 characters'
                }),
            dishes: Joi.string().trim().allow("").regex(/^[a-zA-Z0-9, ]{0,100}$/).min(0).max(100).messages({
                'string.pattern.base': 'Please enter valid dishes',
                'string.max': 'Dishes cannot exceed 100 characters',
                'string.min': 'Please enter valid dishes'
            }),
            location: Joi.string().trim().min(2).max(150).required().messages({
                'string.pattern.base': 'Please provide a valid location',
                'string.empty': 'Please enter location',
                'string.max': 'Location cannot exceed 150 characters',
                'string.min': 'Location must have at least 2 characters',
                'any.required': 'Location is required'
            }),
            locationCoordinates: Joi.object({
                type: Joi.string().valid('Point').required().messages({
                    'any.required': 'Type for location coordinates is required',
                    'any.only': 'Invalid type for location coordinates',
                }),
                coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
                    'any.required': 'Coordinates for location are required',
                    'array.base': 'Coordinates for location  must be an array',
                    'array.length': 'Coordinates for location must contain exactly 2 numbers',
                    'array.includesRequiredUnknowns': 'Coordinates for location must contain 2 numbers',
                    'number.base': 'Coordinates for location must be numbers',
                })
            }).required().messages({
                'any.required': 'Location coordinates is required',
                'any.empty': 'Location coordinates cannot be empty'
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