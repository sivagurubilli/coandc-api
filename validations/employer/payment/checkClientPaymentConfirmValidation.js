const Joi = require("joi");
let { responseJson } = require('../../../utils/appUtils');

exports.checkClientPaymentConfirmValidation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            transactionNo: Joi.string().trim().required()
                .messages({
                    'string.required': 'Transaction number is required',
                    'string.empty': 'Please provide valid transaction number'
                }),
            transactionPaymentNo: Joi.string().trim().required()
                .messages({
                    'string.required': 'Transaction Payment number is required',
                    'string.empty': 'Please provide valid transaction payment number'
                }),
            transactionSignature: Joi.string().trim().required()
                .messages({
                    'string.required': 'transactionSignature is required',
                    'string.empty': 'Please provide valid transaction signature'
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