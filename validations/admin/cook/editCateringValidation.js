const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.editCateringValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required().messages({
                'string.required': 'Please provide id'
            }),
            cateringFoodType: Joi.number().integer().valid(1, 2, 3).allow("").strict().messages({
                'number.integer': 'Catering Food Type must be an integer',
                'number.base': 'Catering Food Type must be a number',
                'any.only': 'Invalid catering food type value'
            }),
            fssai: Joi.string().allow('').messages({
            }),
            cateringMinPlates: Joi.number().integer().min(1).allow("").messages({
                'number.integer': 'Catering Min Plates must be an integer',
                'number.base': 'Catering Min Plates must be a number',
                'number.min': 'Catering Min Plates must greater than 0'
            }),
            teamSize: Joi.number().integer().min(3).allow("").messages({
                'number.integer': 'teamSize must be an integer',
                'number.base': 'teamSize must be a number',
                'number.empty': 'Please enter your teamsize',
                'number.min': 'teamSize must greater than 3'
            }),
            website: Joi.string().trim().allow("").regex(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})(:[0-9]+)?(\/.*)?$/).messages({
                'string.pattern.base': 'Invalid website URL.',
            }),
            cateringCuisines: Joi.array().items(Joi.string().regex(/^[a-zA-Z][a-zA-Z\s]*$/).allow("").messages({
                'string.pattern.base': 'Each cuisine must start with an alphabet and can contain alphabets and spaces only',
            })).messages({
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