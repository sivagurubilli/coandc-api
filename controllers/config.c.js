const axios = require('axios')
let config = require('../config/config')
let appStatic = require('../config/appStatic.js').data
let models = require('../models')
let appUtils = require('../utils/appUtils')
const os = require("os");

exports.getconfig = async (req, res) => {
    try {

        let data = 'noData';
        const {
            rzp,
            sendBird
        } = config;

        if (req.query.rzp) {
            data = {
                key: rzp.key_id,
                secret: rzp.key_secret
            }
            res.send(appUtils.responseJson(1, 1, data, 'SUCCESS'))
        }
        else throw Error("Currently only rzp values available")
    }
    catch (e) {
        res.send(appUtils.responseJson(0, 0, e.message, `Failed`))
    }
}

exports.getIPv6Address = async (req, res) => {
    try {
        const interfaces = os.networkInterfaces();
        const ipv6Addresses = [];
        for (const key in interfaces) {
            interfaces[key].forEach((details) => {
                if (details.family === 'IPv6' && !details.internal) {
                    ipv6Addresses.push(details.address);
                }
            });
        }
        res.send(appUtils.responseJson(1, 1, ipv6Addresses, 'IPv6 fetched successfully!'))
    }
    catch (e) {
        res.status(e.statusCode || 500).send(appUtils.responseJson(0, e.responseCode || 0, [], e.msg || 'Fetching IPv6 failed', e))
    }
}


