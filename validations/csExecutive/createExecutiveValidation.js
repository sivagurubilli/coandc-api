const Joi = require("joi");
let { responseJson } = require('../../utils/appUtils');

exports.createExecutiveValidation = async (req, res, next) => {
    try {

        const schema = Joi.object({
            name: Joi.string().trim().min(2).required().messages({
                'string.empty': 'Please enter name',
                'string.min': 'Name must have atleast 2 characters',
                'any.required': 'Please provide name',
            }),
            username: Joi.string().trim().min(2).required().messages({
                'string.empty': 'Please enter username',
                'string.min': 'Username must have atleast 2 characters',
                'any.required': 'Please provide username',
            }),
            password: Joi.string().trim().min(8).required().messages({
                'string.empty': 'Please enter password',
                'string.min': 'Password must have atleast 8 characters',
                'any.required': 'Please provide password',
            }),
            role: Joi.string().trim().min(20).required().messages({
                'string.empty': 'Please enter role',
                'string.min': 'Role must have atleast 20 characters',
                'any.required': 'Please provide role',
            }),
            status: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'status must be an integer',
                'number.base': 'Please provide valid status',
                'number.empty': 'Please provide status value',
                'any.required': 'Please provide status',
                'any.only': 'Invalid status value'
            }),
            houseCookAccess: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'House Cook Access must be an integer',
                'number.base': 'Please provide valid house cook access',
                'number.empty': 'Please provide house cook access value',
                'any.required': 'Please provide house cook access',
                'any.only': 'Invalid house cook access value'
            }),
            partyCookAccess: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'Party Cook Access must be an integer',
                'number.base': 'Please provide valid party cook access',
                'number.empty': 'Please provide party cook access value',
                'any.required': 'Please provide party cook access',
                'any.only': 'Invalid party cook access value'
            }),
            chefAccess: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'Chef Access must be an integer',
                'number.base': 'Please provide valid chef access',
                'number.empty': 'Please provide chef access value',
                'any.required': 'Please provide chef access',
                'any.only': 'Invalid chef access value'
            }),
            cateringAccess: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'Catering Access must be an integer',
                'number.base': 'Please provide valid catering access',
                'number.empty': 'Please provide catering access value',
                'any.required': 'Please provide catering access',
                'any.only': 'Invalid catering access value'
            }),
            employerAccess: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'Employer Access must be an integer',
                'number.base': 'Please provide valid employer access',
                'number.empty': 'Please provide employer access value',
                'any.required': 'Please provide employer access',
                'any.only': 'Invalid employer access value'
            }),
            clientAccess: Joi.number().integer().strict().valid(0, 1).required().messages({
                'number.integer': 'Client Access must be an integer',
                'number.base': 'Please provide valid client access',
                'number.empty': 'Please provide catering client value',
                'any.required': 'Please provide client access',
                'any.only': 'Invalid client access value'
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