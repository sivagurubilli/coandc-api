const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkEditEmployerValidation = async (req, res, next) => {


    try {
        const customFullNameValidator = (fullName) => {
            if (fullName.startsWith("'") || fullName.endsWith("'")) throw { statusCode: 500, responseCode: 2, msg: "Full Name cannot start or end with an apostrophe" };
            return fullName;
        };


        if (req.body.memberType) throw { statusCode: 500, responseCode: 2, msg: "memberType is not allowed" }
        const currentYear = new Date().getFullYear();
        const user = req.user;
        const schema = Joi.object({
            memberType: Joi.number().integer().strict().valid(1, 2),
            fullName: Joi.string().trim().messages({
                'string.empty': 'Please provide name'
            }),
            addressLine1: Joi.string().trim().regex(/^(?!\d+$)[a-zA-Z0-9 .,'#-]{1,100}$/).messages({
                'string.pattern.base': 'Please provide a valid address line1',
                'string.empty': 'Please provide address line1',
                'string.max': 'Address line1 cannot exceed 100 characters',
                'string.min': 'Address line1 must have at least 1 characters'
            }),
            smsContact: Joi.number().integer().strict().allow("").valid(0, 1).messages({
                'any.only': 'Please provide valid smsContact',
                'number.base': 'smsContact must be a number',
            }),
            whatsappContact: Joi.number().integer().strict().allow("").valid(0, 1).messages({
                'any.only': 'Please provide valid whatsappContact',
                'number.base': 'whatsappContact must be a number',
            }),
            emailContact: Joi.number().integer().strict().allow("").valid(0, 1).messages({
                'any.only': 'Please provide valid emailContact',
                'number.base': 'emailContact must be a number',
            }),
            addressLine2: Joi.string().trim().allow('').regex(/^(?!\d+$)[a-zA-Z0-9 .,'#-]{1,50}$/).messages({
                'string.pattern.base': 'Please provide a valid addressLine2',
                'string.empty': 'Please provide addressLine2',
                'string.max': 'addressLine2  cannot exceed 50 characters',
                'string.min': 'addressLine2 must have at least 1 character'
            }),
            dp: Joi.string().uri().allow('').messages({
                'string.empty': 'Please provide dp'
            }),
            gender: Joi.when('memberType', {
                is: 1,
                then: Joi.number().valid(1, 2, 3).messages({
                    'any.only': 'Gender must be either 1,2 or 3',
                    'number.base': 'Gender must be a number',
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'Gender is not allowed when user is a employer',
            }),
            occupation: Joi.when('memberType', {
                is: 1,
                then: Joi.string().trim().allow('').regex(/^[a-zA-Z][a-zA-Z\s]*[a-zA-Z]$/).min(2).max(100).messages({
                    'string.pattern.base': 'Please provide a valid occupation',
                    'string.empty': 'Please provide occupation',
                    'string.max': 'Occupation cannot exceed 100 characters',
                    'string.min': 'Occupation must have at least 2 characters'
                }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'Occupation is not allowed when user is a employer',
            }),
            languages: Joi.when('memberType', {
                is: 1,
                then: Joi.array().items(Joi.string().regex(/^[a-zA-Z]+$/)).min(1).messages({
                    'array.base': 'Please provide a valid languages',
                    'array.min': 'Please enter atleast 1 language',
                    'string.pattern.base': 'Please enter valid languages',
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'Languages not allowed in payload when user is employer'
            }),
            cityName: Joi.string().trim().allow('').min(2).max(150).messages({
                'string.pattern.base': 'Please enter valid city name',
                'string.empty': 'Please provide city name',
                'string.max': 'cityname cannot exceed 150 characters',
                'string.min': 'cityname must have at least 2 characters'
            }),
            provinceName: Joi.string().trim().allow('').regex(/^[a-zA-Z][a-zA-Z0-9, -]{3,99}$/).messages({
                'string.pattern.base': 'Please enter valid state name',
                'string.empty': 'Please provide state name',
                'string.max': 'stateName cannot exceed 100 characters',
                'string.min': 'stateName must have at least 4 characters'
            }),
            landmark: Joi.when('memberType', {
                is: 1,
                then: Joi.string().trim().allow('').regex(/^[a-zA-Z0-9 .'#-]{0,50}$/).messages({
                    'string.pattern.base': 'Please enter valid landmark',
                    'string.max': 'Landmark cannot exceed 50 characters'
                }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'Landmark is not allowed when user is employer'
            }),
            pincode: Joi.when('memberType', {
                is: 1,
                then: Joi.string().trim().pattern(/^\d+$/).min(6).max(6).messages({
                    'string.pattern.base': 'Please provide a valid pincode',
                    'string.empty': 'Please provide pincode',
                    'string.min': 'Pincode must have exactly 6 digits',
                    'string.max': 'Pincode must have exactly 6 digits'
                }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'Pincode is not allowed when user is employer'
            }),
            dob: Joi.when('memberType', {
                is: 1,
                then: Joi.date()
                    .max('now') // Ensure dob is not greater than current date
                    .iso()
                    .messages({
                        'date.base': 'Please provide a valid date for dob',
                        'date.max': 'Dob cannot be greater than the current date',
                        'date.empty': 'Please provide dob',
                    }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'Dob is not allowed  when user is employer',
            }),
            contactPerson: Joi.when('memberType', {
                is: 2,
                then: Joi.string().trim().allow("").regex(/^[a-zA-Z ]+$/).max(30).messages({
                    'string.pattern.base': 'Please provide valid contact person',
                    'string.max': 'contactPerson cannot exceed 30 characters'
                }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'Contact Person is not allowed when user is client',
            }),
            fssai: Joi.when('memberType', {
                is: 2,
                then: Joi.string().trim().allow("").alphanum().max(30).messages({
                    'string.alphanum': 'Please provide a valid FSSAI',
                    'string.max': 'FSSAI cannot exceed 30 characters'
                }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'Fssai is not allowed when user is client'
            }),
            contactPersonMobile: Joi.when('memberType', {
                is: 2,
                then: Joi.number().integer().allow("").max(9999999999).strict()
                    .messages({
                        'number.base': 'Please enter valid contact person mobile number',
                        'number.integer': 'Mobile must be an integer',
                        'number.max': 'Contact person mobile number must be a 10-digit number',
                    }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'Contact Person mobile is not allowed when user is client'
            }),
            propertyType: Joi.when('memberType', {
                is: 2,
                then: Joi.number().integer().strict().valid(1, 2, 3, 4, 5).messages({
                    'number.integer': 'Property Type must be an integer',
                    'number.base': 'Please provide valid property type',
                    'number.empty': 'Please provide property type',
                    'any.only': 'Invalid property type'
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'Property Type is not allowed when user is client'
            }),
            website: Joi.when('memberType', {
                is: 2,
                then: Joi.string().trim().allow("").regex(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})(:[0-9]+)?(\/.*)?$/).messages({
                    'string.pattern.base': 'Invalid website URL.',
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'website is not allowed when the user is a client',
            }),

            employeesCount: Joi.when('memberType', {
                is: 2,
                then: Joi.number().integer().strict().min(1).messages({
                    'number.integer': 'EmployeesCount must be an integer',
                    'number.base': 'Please provide a valid count of employees',
                    'number.empty': 'Please enter count of employees',
                    'number.min': 'EmployeesCount must greater than zero'
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'employeesCount is not allowed when user is client'
            }),
            establishmentYear: Joi.when('memberType', {
                is: 2,
                then: Joi.number()
                    .integer()
                    .min(1900)
                    .max(currentYear).message('Invalid establishment year. It should be a 4-digit year between ' + 1900 + ' and ' + currentYear),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'employeesCount is not allowed when user is client'
            }),
            area: Joi.when('memberType', {
                is: 1,
                then: Joi.string().trim().min(2).max(150).messages({
                    'string.pattern.base': 'Please enter a valid area',
                    'string.empty': 'Please provide area',
                    'string.max': 'area cannot exceed 150 characters',
                    'string.min': 'area must have at least 2 characters'
                }),
                otherwise: Joi.forbidden(),
            }).allow('').messages({
                'any.unknown': 'area is not allowed when user is employer',
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
            }),
            areaCoordinates: Joi.when('memberType', {
                is: 1,
                then: Joi.object({
                    type: Joi.string().valid('Point').required().messages({
                        'any.required': 'Type for areaCoordinates is required',
                        'any.only': 'Invalid type for city-coordinates',
                    }),
                    coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
                        'any.required': 'Coordinates for area are required',
                        'array.base': 'Coordinates for area  must be an array',
                        'array.length': 'Coordinates for area must contain exactly 2 numbers',
                        'array.includesRequiredUnknowns': 'Coordinates for area must contain 2 numbers',
                        'number.base': 'Coordinates for area must be numbers',
                    })
                }),
                otherwise: Joi.forbidden(),
            }).messages({
                'any.unknown': 'areaCoordinates is not allowed when user is employers'
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
