const Joi = require("joi");
let { responseJson } = require("../../../utils/appUtils");

exports.checkEmployerOtpValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            employerId: Joi.string().trim().required()
                .messages({
                    'string.empty': 'Please provide a valid employer id',
                    'string.required': 'Employer Id is required'
                }),
            otp: Joi.string().trim().length(6).required()
                .messages({
                    'string.empty': 'Please provide a valid otp',
                    'string.required': 'Otp is required'
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